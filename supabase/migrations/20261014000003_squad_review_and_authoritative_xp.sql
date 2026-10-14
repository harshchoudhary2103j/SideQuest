-- =============================================================================
-- SideQuest Phase 4C: Squad Review, Mission Completion & Authoritative XP
-- Migration: 20261014000003_squad_review_and_authoritative_xp.sql
--
-- Additive, production-safe schema changes:
-- 1. Add review columns (reviewed_by, rejection_reason) to public.mission_submissions.
-- 2. Create append-only, immutable squad XP ledger (public.squad_xp_ledger) with
--    unique constraint on assignment_id for exactly-once reward guarantee.
-- 3. Implement atomic stored procedure review_mission_submission() with row locks,
--    self-review guard, member validation, assignment completion, and progression increment.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add Review Columns to public.mission_submissions
-- -----------------------------------------------------------------------------
ALTER TABLE public.mission_submissions
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_mission_submissions_reviewer
  ON public.mission_submissions(reviewed_by);

-- -----------------------------------------------------------------------------
-- 2. Immutable Squad XP Ledger
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.mission_assignments(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.mission_submissions(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  source text NOT NULL DEFAULT 'mission_completion' CHECK (source IN ('mission_completion', 'bonus', 'streak')),
  awarded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  -- Durable idempotency guarantee: an assignment can award XP exactly once in repository history
  CONSTRAINT uq_squad_xp_ledger_assignment UNIQUE (assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_xp_ledger_squad
  ON public.squad_xp_ledger(squad_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_squad_xp_ledger_assignment
  ON public.squad_xp_ledger(assignment_id);

-- Enable Row Level Security on the ledger
ALTER TABLE public.squad_xp_ledger ENABLE ROW LEVEL SECURITY;

-- Squad members can view XP ledger records for their squad
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'squad_xp_ledger' AND policyname = 'squad_xp_ledger_select_members'
  ) THEN
    CREATE POLICY "squad_xp_ledger_select_members"
      ON public.squad_xp_ledger FOR SELECT
      TO authenticated
      USING (public.is_squad_member(squad_id, auth.uid()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Atomic Stored Procedure: review_mission_submission
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_mission_submission(
  p_submission_id uuid,
  p_decision text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_reviewer_id uuid;
  v_sub record;
  v_xp_reward integer;
  v_mission_title text;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  -- 1. Identify and authenticate reviewer
  v_reviewer_id := auth.uid();
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to review mission submission';
  END IF;

  -- 2. Validate decision input
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review decision "%". Allowed decisions: approved, rejected', p_decision;
  END IF;

  -- 3. Validate rejection reason (must be meaningful, at least 3 non-whitespace characters)
  IF p_decision = 'rejected' AND (p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 3) THEN
    RAISE EXCEPTION 'A meaningful rejection reason is required to reject a submission';
  END IF;

  -- 4. Lock and retrieve submission, assignment, and trusted mission reward
  SELECT
    s.id,
    s.assignment_id,
    s.squad_id,
    s.submitted_by,
    s.status AS submission_status,
    s.reviewed_at,
    a.status AS assignment_status,
    m.xp_reward,
    m.title AS mission_title
  INTO v_sub
  FROM public.mission_submissions s
  JOIN public.mission_assignments a ON a.id = s.assignment_id AND a.squad_id = s.squad_id
  JOIN public.mission_definitions m ON m.id = a.mission_id
  WHERE s.id = p_submission_id
  FOR UPDATE OF s, a;

  IF v_sub.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found or invalid submission ID';
  END IF;

  -- 5. Validate reviewer belongs to the squad
  IF NOT public.is_squad_member(v_sub.squad_id, v_reviewer_id) THEN
    RAISE EXCEPTION 'Unauthorized: only active members of this squad can review submissions';
  END IF;

  -- 6. Prevent self-review (submitter cannot approve/reject own proof)
  IF v_sub.submitted_by = v_reviewer_id THEN
    RAISE EXCEPTION 'Submitter cannot review or finalize their own submission';
  END IF;

  -- 7. Ensure submission has not already been finalized
  IF v_sub.submission_status <> 'submitted' THEN
    RAISE EXCEPTION 'Submission has already been finalized with status "%"', v_sub.submission_status;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Path A: Rejection
  -- ---------------------------------------------------------------------------
  IF p_decision = 'rejected' THEN
    UPDATE public.mission_submissions
    SET
      status = 'rejected',
      reviewed_at = timezone('utc'::text, now()),
      reviewed_by = v_reviewer_id,
      rejection_reason = trim(p_rejection_reason)
    WHERE id = p_submission_id;

    RETURN jsonb_build_object(
      'success', true,
      'decision', 'rejected',
      'submission_id', p_submission_id,
      'assignment_id', v_sub.assignment_id,
      'status', 'rejected',
      'rejection_reason', trim(p_rejection_reason),
      'xp_awarded', 0
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- Path B: Approval & Authoritative Completion
  -- ---------------------------------------------------------------------------
  -- Prevent double reward if assignment is already completed
  IF v_sub.assignment_status = 'completed' THEN
    RAISE EXCEPTION 'Assignment has already been completed and rewarded';
  END IF;

  -- Check existing ledger entry for idempotency
  IF EXISTS (SELECT 1 FROM public.squad_xp_ledger WHERE assignment_id = v_sub.assignment_id) THEN
    RAISE EXCEPTION 'XP has already been awarded for this assignment';
  END IF;

  -- 1. Finalize submission to 'approved'
  UPDATE public.mission_submissions
  SET
    status = 'approved',
    reviewed_at = timezone('utc'::text, now()),
    reviewed_by = v_reviewer_id,
    rejection_reason = NULL
  WHERE id = p_submission_id;

  -- 2. Mark assignment 'completed'
  UPDATE public.mission_assignments
  SET status = 'completed'
  WHERE id = v_sub.assignment_id;

  -- 3. Insert immutable XP ledger record (unique constraint enforces exactly-once)
  INSERT INTO public.squad_xp_ledger (
    squad_id,
    assignment_id,
    submission_id,
    amount,
    source,
    awarded_by
  ) VALUES (
    v_sub.squad_id,
    v_sub.assignment_id,
    v_sub.id,
    v_sub.xp_reward,
    'mission_completion',
    v_reviewer_id
  );

  -- 4. Atomically increment squad progression (XP and Level)
  UPDATE public.squad_progression
  SET
    xp = xp + v_sub.xp_reward,
    level = GREATEST(1, FLOOR((xp + v_sub.xp_reward) / 300) + 1),
    updated_at = timezone('utc'::text, now())
  WHERE squad_id = v_sub.squad_id
  RETURNING xp, level INTO v_new_xp, v_new_level;

  -- 5. Record celebratory memory in squad lore vault
  INSERT INTO public.squad_lore (
    squad_id,
    created_by,
    event_type,
    title,
    content,
    metadata
  ) VALUES (
    v_sub.squad_id,
    v_sub.submitted_by,
    'mission_completed',
    v_sub.mission_title,
    'Mission proof verified and approved by squad teammate!',
    jsonb_build_object(
      'assignment_id', v_sub.assignment_id,
      'submission_id', v_sub.id,
      'xp_awarded', v_sub.xp_reward,
      'reviewed_by', v_reviewer_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'decision', 'approved',
    'submission_id', p_submission_id,
    'assignment_id', v_sub.assignment_id,
    'status', 'approved',
    'xp_awarded', v_sub.xp_reward,
    'new_total_xp', v_new_xp,
    'new_level', v_new_level
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_mission_submission(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_mission_submission(uuid, text, text) TO authenticated;
