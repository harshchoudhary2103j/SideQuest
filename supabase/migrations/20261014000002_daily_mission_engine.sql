-- =============================================================================
-- SideQuest — Phase 4A Migration: Daily Mission Engine & Squad Assignments
-- supabase/migrations/20261014000002_daily_mission_engine.sql
-- =============================================================================

-- 1. Add assigned_date column to mission_assignments (backward compatible)
ALTER TABLE public.mission_assignments
  ADD COLUMN IF NOT EXISTS assigned_date date NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'UTC');

-- 2. Add composite unique constraint to guarantee idempotency and prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS uq_mission_assignments_squad_mission_date
  ON public.mission_assignments (squad_id, mission_id, assigned_date);

-- 3. Add performance index for squad daily assignment lookups
CREATE INDEX IF NOT EXISTS idx_mission_assignments_squad_date
  ON public.mission_assignments (squad_id, assigned_date);

-- 4. Idempotent Daily Mission Selection and Generation Function
-- Selects 5 daily missions (2 easy, 2 medium, 1 hard) with anti-repetition.
-- Guarantees atomic, idempotent generation using advisory transaction locking.
CREATE OR REPLACE FUNCTION public.get_or_create_daily_missions(
  p_squad_id uuid,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE (
  assignment_id uuid,
  squad_id uuid,
  mission_id uuid,
  assigned_date date,
  starts_at timestamptz,
  expires_at timestamptz,
  status text,
  created_at timestamptz,
  title text,
  description text,
  category text,
  difficulty text,
  xp_reward integer,
  proof_type text[],
  rules text[],
  submission_requirements text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
  v_caller_id uuid := auth.uid();
  v_mission_date date;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_existing_count integer;
  v_recent_mission_ids uuid[];
  v_selected_mission_ids uuid[];
  v_easy_ids uuid[];
  v_medium_ids uuid[];
  v_hard_ids uuid[];
  v_fallback_ids uuid[];
BEGIN
  -- 1. Validate Caller Authentication & Squad Membership
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access squad missions';
  END IF;

  IF NOT public.is_squad_member(p_squad_id, v_caller_id) THEN
    RAISE EXCEPTION 'Caller is not a member of squad %', p_squad_id;
  END IF;

  -- 2. Calculate Mission Date and Boundaries in Squad/App Timezone
  BEGIN
    v_mission_date := (now() AT TIME ZONE p_timezone)::date;
    v_starts_at := (v_mission_date::text || ' 00:00:00')::timestamp AT TIME ZONE p_timezone;
    v_expires_at := v_starts_at + interval '24 hours';
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to UTC if timezone string is invalid
    v_mission_date := (now() AT TIME ZONE 'UTC')::date;
    v_starts_at := (v_mission_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'UTC';
    v_expires_at := v_starts_at + interval '24 hours';
  END;

  -- 3. Acquire Advisory Transaction Lock to prevent concurrent generation races
  PERFORM pg_advisory_xact_lock(hashtext('daily_missions_' || p_squad_id::text || '_' || v_mission_date::text));

  -- 4. Check if Daily Assignments already exist for today
  SELECT count(*)
  INTO v_existing_count
  FROM public.mission_assignments ma
  WHERE ma.squad_id = p_squad_id
    AND ma.assigned_date = v_mission_date;

  -- If assignments already exist, return them immediately
  IF v_existing_count >= 5 THEN
    RETURN QUERY
    SELECT
      ma.id AS assignment_id,
      ma.squad_id,
      ma.mission_id,
      ma.assigned_date,
      ma.starts_at,
      ma.expires_at,
      ma.status,
      ma.created_at,
      md.title,
      md.description,
      md.category,
      md.difficulty,
      md.xp_reward,
      md.proof_type,
      md.rules,
      md.submission_requirements
    FROM public.mission_assignments ma
    JOIN public.mission_definitions md ON md.id = ma.mission_id
    WHERE ma.squad_id = p_squad_id
      AND ma.assigned_date = v_mission_date
    ORDER BY md.difficulty ASC, md.title ASC;
    RETURN;
  END IF;

  -- 5. Selection Engine: Determine Recent Missions to Avoid Repetition (past 7 days)
  SELECT COALESCE(array_agg(ma.mission_id), '{}'::uuid[])
  INTO v_recent_mission_ids
  FROM public.mission_assignments ma
  WHERE ma.squad_id = p_squad_id
    AND ma.assigned_date >= (v_mission_date - interval '7 days')::date
    AND ma.assigned_date < v_mission_date;

  -- Select 2 Easy Missions (excluding recent if possible)
  SELECT array_agg(sub.id)
  INTO v_easy_ids
  FROM (
    SELECT md.id
    FROM public.mission_definitions md
    WHERE md.status = 'active'
      AND md.difficulty = 'easy'
      AND NOT (md.id = ANY(v_recent_mission_ids))
    ORDER BY random()
    LIMIT 2
  ) sub;

  -- Fallback for easy if catalog had fewer non-recent easy missions
  IF COALESCE(array_length(v_easy_ids, 1), 0) < 2 THEN
    SELECT array_agg(sub.id)
    INTO v_easy_ids
    FROM (
      SELECT md.id
      FROM public.mission_definitions md
      WHERE md.status = 'active'
        AND md.difficulty = 'easy'
      ORDER BY (md.id = ANY(v_recent_mission_ids)) ASC, random()
      LIMIT 2
    ) sub;
  END IF;

  -- Select 2 Medium Missions (excluding recent and already chosen)
  SELECT array_agg(sub.id)
  INTO v_medium_ids
  FROM (
    SELECT md.id
    FROM public.mission_definitions md
    WHERE md.status = 'active'
      AND md.difficulty = 'medium'
      AND NOT (md.id = ANY(v_recent_mission_ids))
      AND NOT (md.id = ANY(COALESCE(v_easy_ids, '{}'::uuid[])))
    ORDER BY random()
    LIMIT 2
  ) sub;

  -- Fallback for medium
  IF COALESCE(array_length(v_medium_ids, 1), 0) < 2 THEN
    SELECT array_agg(sub.id)
    INTO v_medium_ids
    FROM (
      SELECT md.id
      FROM public.mission_definitions md
      WHERE md.status = 'active'
        AND md.difficulty = 'medium'
        AND NOT (md.id = ANY(COALESCE(v_easy_ids, '{}'::uuid[])))
      ORDER BY (md.id = ANY(v_recent_mission_ids)) ASC, random()
      LIMIT 2
    ) sub;
  END IF;

  -- Select 1 Hard Mission (excluding recent and already chosen)
  SELECT array_agg(sub.id)
  INTO v_hard_ids
  FROM (
    SELECT md.id
    FROM public.mission_definitions md
    WHERE md.status = 'active'
      AND md.difficulty = 'hard'
      AND NOT (md.id = ANY(v_recent_mission_ids))
      AND NOT (md.id = ANY(COALESCE(v_easy_ids, '{}'::uuid[]) || COALESCE(v_medium_ids, '{}'::uuid[])))
    ORDER BY random()
    LIMIT 1
  ) sub;

  -- Fallback for hard
  IF COALESCE(array_length(v_hard_ids, 1), 0) < 1 THEN
    SELECT array_agg(sub.id)
    INTO v_hard_ids
    FROM (
      SELECT md.id
      FROM public.mission_definitions md
      WHERE md.status = 'active'
        AND md.difficulty = 'hard'
        AND NOT (md.id = ANY(COALESCE(v_easy_ids, '{}'::uuid[]) || COALESCE(v_medium_ids, '{}'::uuid[])))
      ORDER BY (md.id = ANY(v_recent_mission_ids)) ASC, random()
      LIMIT 1
    ) sub;
  END IF;

  -- Combine selected IDs
  v_selected_mission_ids := COALESCE(v_easy_ids, '{}'::uuid[]) ||
                            COALESCE(v_medium_ids, '{}'::uuid[]) ||
                            COALESCE(v_hard_ids, '{}'::uuid[]);

  -- If still under 5 due to limited catalog, top up with any active missions not yet chosen
  IF COALESCE(array_length(v_selected_mission_ids, 1), 0) < 5 THEN
    SELECT array_agg(sub.id)
    INTO v_fallback_ids
    FROM (
      SELECT md.id
      FROM public.mission_definitions md
      WHERE md.status = 'active'
        AND NOT (md.id = ANY(v_selected_mission_ids))
      ORDER BY random()
      LIMIT (5 - COALESCE(array_length(v_selected_mission_ids, 1), 0))
    ) sub;

    v_selected_mission_ids := v_selected_mission_ids || COALESCE(v_fallback_ids, '{}'::uuid[]);
  END IF;

  -- 6. Insert Persisted Assignments (with ON CONFLICT DO NOTHING for safety)
  INSERT INTO public.mission_assignments (
    squad_id,
    mission_id,
    assigned_date,
    starts_at,
    expires_at,
    status
  )
  SELECT
    p_squad_id,
    m_id,
    v_mission_date,
    v_starts_at,
    v_expires_at,
    'available'
  FROM unnest(v_selected_mission_ids) AS m_id
  ON CONFLICT (squad_id, mission_id, assigned_date) DO NOTHING;

  -- 7. Return Resulting Daily Assignments Joined with Definition Details
  RETURN QUERY
  SELECT
    ma.id AS assignment_id,
    ma.squad_id,
    ma.mission_id,
    ma.assigned_date,
    ma.starts_at,
    ma.expires_at,
    ma.status,
    ma.created_at,
    md.title,
    md.description,
    md.category,
    md.difficulty,
    md.xp_reward,
    md.proof_type,
    md.rules,
    md.submission_requirements
  FROM public.mission_assignments ma
  JOIN public.mission_definitions md ON md.id = ma.mission_id
  WHERE ma.squad_id = p_squad_id
    AND ma.assigned_date = v_mission_date
  ORDER BY md.difficulty ASC, md.title ASC;
END;
$$;

-- Revoke default public permissions and grant exclusively to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_or_create_daily_missions(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_daily_missions(uuid, text) TO authenticated;
