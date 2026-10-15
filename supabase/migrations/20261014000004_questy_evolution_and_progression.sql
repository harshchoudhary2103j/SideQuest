-- =============================================================================
-- SideQuest Phase 4D: Questy Evolution & Squad Progression
-- Migration: 20261014000004_questy_evolution_and_progression.sql
--
-- Additive, production-safe schema changes:
-- 1. Progression synchronization trigger guaranteeing current_evolution_stage
--    and level always match authoritative cumulative XP.
-- 2. Stored procedure review_mission_submission() upgraded to record genuine
--    milestone_unlocked and mascot_evolution events into public.squad_lore.
-- 3. Return evolution state (new_evolution_stage, leveled_up, evolved, stage_name)
--    upon atomic mission verification.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper Function: Map Evolution Stage to Canonical Mascot Name
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_mascot_stage_name(p_stage integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_stage
    WHEN 1 THEN 'Star Pup'
    WHEN 2 THEN 'Glow Buddy'
    WHEN 3 THEN 'Quest Pal'
    WHEN 4 THEN 'Star Guardian'
    WHEN 5 THEN 'Legendary Questy'
    ELSE 'Star Pup'
  END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Progression Synchronization Trigger
-- Guarantees that level and current_evolution_stage are always authoritatively
-- derived from cumulative XP whenever squad_progression is updated.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_squad_progression_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Level formula: 300 XP per level
  NEW.level := GREATEST(1, FLOOR(NEW.xp / 300) + 1);
  -- Evolution stage: 1 at Lv1, 2 at Lv2, 3 at Lv3, 4 at Lv4, 5 at Lv5+
  NEW.current_evolution_stage := LEAST(5, GREATEST(1, NEW.level));
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_squad_progression_sync ON public.squad_progression;
CREATE TRIGGER trg_squad_progression_sync
  BEFORE UPDATE OF xp ON public.squad_progression
  FOR EACH ROW EXECUTE FUNCTION public.handle_squad_progression_sync();

-- Harmonize existing progression records safely (non-destructive)
UPDATE public.squad_progression
SET
  level = GREATEST(1, FLOOR(xp / 300) + 1),
  current_evolution_stage = LEAST(5, GREATEST(1, FLOOR(xp / 300) + 1)),
  updated_at = timezone('utc'::text, now());

-- -----------------------------------------------------------------------------
-- 3. Atomic Review & Evolution Procedure
-- Upgrades review_mission_submission to detect genuine level-up and evolution
-- milestones, record them in public.squad_lore, and return authoritative progression.
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
  v_old_xp integer;
  v_old_level integer;
  v_old_stage integer;
  v_new_xp integer;
  v_new_level integer;
  v_new_stage integer;
  v_stage_name text;
  v_leveled_up boolean := false;
  v_evolved boolean := false;
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission submission not found or assignment relationship invalid';
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
      'xp_awarded', 0,
      'leveled_up', false,
      'evolved', false
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- Path B: Approval & Authoritative Completion
  -- ---------------------------------------------------------------------------
  -- 1. Verify assignment has not already been completed by another submission
  IF v_sub.assignment_status = 'completed' THEN
    RAISE EXCEPTION 'Mission assignment has already been completed';
  END IF;

  -- 2. Finalize submission record
  UPDATE public.mission_submissions
  SET
    status = 'approved',
    reviewed_at = timezone('utc'::text, now()),
    reviewed_by = v_reviewer_id,
    rejection_reason = NULL
  WHERE id = p_submission_id;

  -- 3. Mark assignment completed
  UPDATE public.mission_assignments
  SET status = 'completed'
  WHERE id = v_sub.assignment_id;

  -- 4. Insert immutable squad XP ledger entry (enforces exactly-once award per assignment)
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

  -- 5. Lock and retrieve current squad progression
  SELECT xp, level, current_evolution_stage
  INTO v_old_xp, v_old_level, v_old_stage
  FROM public.squad_progression
  WHERE squad_id = v_sub.squad_id
  FOR UPDATE;

  IF NOT FOUND THEN
    v_old_xp := 0;
    v_old_level := 1;
    v_old_stage := 1;
  END IF;

  -- 6. Calculate authoritative progression and evolution stage
  v_new_xp := v_old_xp + v_sub.xp_reward;
  v_new_level := GREATEST(1, FLOOR(v_new_xp / 300) + 1);
  v_new_stage := LEAST(5, GREATEST(1, v_new_level));
  v_stage_name := public.get_mascot_stage_name(v_new_stage);

  v_leveled_up := (v_new_level > v_old_level);
  v_evolved := (v_new_stage > v_old_stage);

  -- 7. Atomically update squad progression
  UPDATE public.squad_progression
  SET
    xp = v_new_xp,
    level = v_new_level,
    current_evolution_stage = v_new_stage,
    updated_at = timezone('utc'::text, now())
  WHERE squad_id = v_sub.squad_id;

  -- 8. Record celebratory memory in squad lore vault for mission completion
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

  -- 9. Record genuine Level-Up Milestone in squad lore
  IF v_leveled_up THEN
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
      'milestone_unlocked',
      'Squad Reached Level ' || v_new_level || '!',
      'The squad leveled up to Level ' || v_new_level || ' with ' || v_new_xp || ' cumulative XP!',
      jsonb_build_object(
        'level', v_new_level,
        'total_xp', v_new_xp,
        'assignment_id', v_sub.assignment_id,
        'submission_id', v_sub.id
      )
    );
  END IF;

  -- 10. Record genuine Mascot Evolution Milestone in squad lore
  IF v_evolved THEN
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
      'mascot_evolution',
      'Questy Evolved into ' || v_stage_name || '!',
      'Questy ascended to Evolution Stage ' || v_new_stage || ' (' || v_stage_name || ')!',
      jsonb_build_object(
        'stage', v_new_stage,
        'evolution_stage', v_new_stage,
        'stage_name', v_stage_name,
        'level', v_new_level,
        'total_xp', v_new_xp,
        'assignment_id', v_sub.assignment_id,
        'submission_id', v_sub.id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'decision', 'approved',
    'submission_id', p_submission_id,
    'assignment_id', v_sub.assignment_id,
    'status', 'approved',
    'xp_awarded', v_sub.xp_reward,
    'new_total_xp', v_new_xp,
    'new_level', v_new_level,
    'new_evolution_stage', v_new_stage,
    'leveled_up', v_leveled_up,
    'evolved', v_evolved,
    'stage_name', v_stage_name
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_mission_submission(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_mission_submission(uuid, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Harden Squad Lore RLS against Client-Fabricated Progression History
-- -----------------------------------------------------------------------------
-- Squad members can insert personal memories/quotes/chaos moments, but
-- progression events (milestone_unlocked, mascot_evolution, mission_completed)
-- can ONLY be authored by authoritative system stored procedures.
DROP POLICY IF EXISTS "squad_lore_insert_members" ON public.squad_lore;
CREATE POLICY "squad_lore_insert_members"
  ON public.squad_lore FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_squad_member(squad_id, auth.uid()) AND
    (created_by IS NULL OR created_by = auth.uid()) AND
    event_type NOT IN ('milestone_unlocked', 'mascot_evolution', 'mission_completed')
  );

-- -----------------------------------------------------------------------------
-- 5. Helper Function: Get Submission Squad ID (Authoritative Squad Discovery)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_submission_squad_id(p_submission_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT squad_id FROM public.mission_submissions WHERE id = p_submission_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_submission_squad_id(uuid) TO authenticated;


