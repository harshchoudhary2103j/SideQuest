-- =============================================================================
-- SideQuest — Phase 3A: Initial Database Schema, RLS, and Storage Security
-- Migration: 20261014000000_initial_schema.sql
-- Security Hardened Edition
-- =============================================================================

-- Ensure necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Helper & Trigger Utilities
-- =============================================================================

-- Automatic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Safe UUID syntax validator (prevents cast crashes on malformed folder names in storage policies)
CREATE OR REPLACE FUNCTION public.is_valid_uuid(val text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT val ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

-- =============================================================================
-- 2. Core Entities
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles
-- Linked 1-to-1 with Supabase Auth users.
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_path text,
  aura text DEFAULT 'midnight_rebel',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_display_name_len CHECK (char_length(trim(display_name)) >= 2 AND char_length(display_name) <= 50)
);

CREATE TRIGGER on_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profile creation on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_path, aura)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'Adventurer'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'aura', 'midnight_rebel')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Squads
-- Private friend groups that share a Questy companion.
-- -----------------------------------------------------------------------------
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  motto text,
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_squad_name_len CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 60),
  CONSTRAINT chk_invite_code_format CHECK (invite_code ~ '^[A-Z0-9_-]{4,20}$')
);

CREATE INDEX idx_squads_invite_code ON public.squads(invite_code);
CREATE INDEX idx_squads_created_by ON public.squads(created_by);

-- Guard immutable squad creation fields during update
CREATE OR REPLACE FUNCTION public.handle_squad_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_by <> OLD.created_by THEN
    RAISE EXCEPTION 'Squad created_by cannot be altered';
  END IF;
  IF NEW.invite_code <> OLD.invite_code THEN
    RAISE EXCEPTION 'Squad invite_code cannot be altered';
  END IF;
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.handle_squad_update();

-- -----------------------------------------------------------------------------
-- Squad Memberships
-- Defines user roles within a private squad (owner, admin, member).
-- -----------------------------------------------------------------------------
CREATE TABLE public.squad_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_squad_membership UNIQUE (squad_id, user_id)
);

CREATE INDEX idx_squad_memberships_squad ON public.squad_memberships(squad_id);
CREATE INDEX idx_squad_memberships_user ON public.squad_memberships(user_id);

-- -----------------------------------------------------------------------------
-- Squad Progression Foundation
-- Authoritative mascot progression, XP, and evolution tracking.
-- Modifiable only via server operations.
-- -----------------------------------------------------------------------------
CREATE TABLE public.squad_progression (
  squad_id uuid PRIMARY KEY REFERENCES public.squads(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  current_evolution_stage integer NOT NULL DEFAULT 1 CHECK (current_evolution_stage BETWEEN 1 AND 5),
  streak_days integer NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER on_squad_progression_updated_at
  BEFORE UPDATE ON public.squad_progression
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Atomic Squad Initialization Trigger
-- Guarantees that creating a squad immediately provisions the owner membership
-- and the initial progression entity in a single transaction.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_squad_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Insert owner membership
  INSERT INTO public.squad_memberships (squad_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  -- 2. Initialize default progression (Level 1 Star Pup, 0 XP)
  INSERT INTO public.squad_progression (squad_id, xp, level, current_evolution_stage, streak_days)
  VALUES (NEW.id, 0, 1, 1, 0);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_squad_created
  AFTER INSERT ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.handle_squad_created();

-- -----------------------------------------------------------------------------
-- Mission Definitions
-- Canonical library of real-world adventures, categories, and constraints.
-- -----------------------------------------------------------------------------
CREATE TABLE public.mission_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('exploration', 'creative', 'social', 'chaos')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward integer NOT NULL CHECK (xp_reward > 0),
  proof_type text[] NOT NULL DEFAULT ARRAY['photo']::text[],
  rules text[] NOT NULL DEFAULT '{}'::text[],
  submission_requirements text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_mission_definitions_category ON public.mission_definitions(category);
CREATE INDEX idx_mission_definitions_status ON public.mission_definitions(status);

CREATE TRIGGER on_mission_definitions_updated_at
  BEFORE UPDATE ON public.mission_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Mission Assignments
-- Active, pending, or completed mission instances assigned to a specific squad.
-- -----------------------------------------------------------------------------
CREATE TABLE public.mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.mission_definitions(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_assignment_dates CHECK (expires_at IS NULL OR expires_at > starts_at),
  -- Composite unique constraint to structurally bind submissions to squad
  CONSTRAINT uq_mission_assignments_id_squad UNIQUE (id, squad_id)
);

CREATE INDEX idx_mission_assignments_squad_status ON public.mission_assignments(squad_id, status);
CREATE INDEX idx_mission_assignments_mission ON public.mission_assignments(mission_id);

-- Prevent unauthorized column updates on assignments by squad members
CREATE OR REPLACE FUNCTION public.handle_mission_assignment_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.squad_id <> OLD.squad_id OR NEW.mission_id <> OLD.mission_id THEN
    RAISE EXCEPTION 'Assignment squad_id and mission_id are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mission_assignments_update
  BEFORE UPDATE ON public.mission_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_mission_assignment_update();

-- -----------------------------------------------------------------------------
-- Mission Submissions
-- Multi-format proof submitted by squad members (photo, video, audio, text).
-- Constrained to valid squad and assignment relationships.
-- -----------------------------------------------------------------------------
CREATE TABLE public.mission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  squad_id uuid NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_type text NOT NULL CHECK (proof_type IN ('photo', 'video', 'voice', 'text')),
  proof_storage_path text,
  text_content text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'flagged')),
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at timestamptz,
  CONSTRAINT chk_submission_has_proof CHECK (proof_storage_path IS NOT NULL OR text_content IS NOT NULL),
  -- Foreign key ensuring submission assignment matches submission squad
  CONSTRAINT fk_submission_assignment_squad FOREIGN KEY (assignment_id, squad_id)
    REFERENCES public.mission_assignments(id, squad_id) ON DELETE CASCADE
);

CREATE INDEX idx_mission_submissions_squad ON public.mission_submissions(squad_id, submitted_at DESC);
CREATE INDEX idx_mission_submissions_assignment ON public.mission_submissions(assignment_id);
CREATE INDEX idx_mission_submissions_submitter ON public.mission_submissions(submitted_by);

-- Guard immutable submission fields
CREATE OR REPLACE FUNCTION public.handle_mission_submission_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assignment_id <> OLD.assignment_id OR
     NEW.squad_id <> OLD.squad_id OR
     NEW.submitted_by <> OLD.submitted_by THEN
    RAISE EXCEPTION 'Submission relationship identifiers are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mission_submissions_update
  BEFORE UPDATE ON public.mission_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_mission_submission_update();

-- -----------------------------------------------------------------------------
-- Squad Lore Vault
-- Immutable memory scrapbook preserving finished missions, milestones, and chaos.
-- -----------------------------------------------------------------------------
CREATE TABLE public.squad_lore (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('mission_completed', 'milestone_unlocked', 'chaos_moment', 'mascot_evolution', 'streak_milestone')),
  title text NOT NULL,
  content text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_squad_lore_squad ON public.squad_lore(squad_id, created_at DESC);
CREATE INDEX idx_squad_lore_event_type ON public.squad_lore(squad_id, event_type);

-- =============================================================================
-- 3. Security Definer Helper Functions (Anti-Recursive RLS)
-- =============================================================================

-- Check whether a user is an active member of a given squad
CREATE OR REPLACE FUNCTION public.is_squad_member(check_squad_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.squad_memberships
    WHERE squad_id = check_squad_id AND user_id = check_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) TO authenticated;

-- Retrieve user role within a squad ('owner', 'admin', 'member', or NULL)
CREATE OR REPLACE FUNCTION public.get_squad_role(check_squad_id uuid, check_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.squad_memberships
  WHERE squad_id = check_squad_id AND user_id = check_user_id
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_squad_role(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_squad_role(uuid, uuid) TO authenticated;

-- Secure procedure to join a squad via invite code
CREATE OR REPLACE FUNCTION public.join_squad_with_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_squad_id uuid;
  caller_id uuid;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to join squad';
  END IF;

  IF code IS NULL OR trim(code) = '' OR length(trim(code)) < 4 OR length(trim(code)) > 20 THEN
    RAISE EXCEPTION 'Invalid squad invite code format';
  END IF;

  SELECT id INTO target_squad_id
  FROM public.squads
  WHERE invite_code = UPPER(TRIM(code));

  IF target_squad_id IS NULL THEN
    RAISE EXCEPTION 'Squad not found with invite code: %', code;
  END IF;

  -- Insert membership as regular member (cannot join as owner or admin via invite code)
  INSERT INTO public.squad_memberships (squad_id, user_id, role)
  VALUES (target_squad_id, caller_id, 'member')
  ON CONFLICT (squad_id, user_id) DO NOTHING;

  RETURN target_squad_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_squad_with_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_squad_with_code(text) TO authenticated;

-- =============================================================================
-- 4. Row Level Security Policies
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_lore ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles Policies
-- -----------------------------------------------------------------------------
-- Any authenticated user can read adventurer profiles (needed to see teammates and public headers)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only modify their own profile attributes
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Squads Policies
-- -----------------------------------------------------------------------------
-- Only squad members can view squad details
CREATE POLICY "squads_select_members"
  ON public.squads FOR SELECT
  TO authenticated
  USING (public.is_squad_member(id, auth.uid()));

-- Any authenticated user can create a squad (creator becomes owner via trigger)
CREATE POLICY "squads_insert_creator"
  ON public.squads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only owners and admins can update squad information
CREATE POLICY "squads_update_admin"
  ON public.squads FOR UPDATE
  TO authenticated
  USING (public.get_squad_role(id, auth.uid()) IN ('owner', 'admin'))
  WITH CHECK (public.get_squad_role(id, auth.uid()) IN ('owner', 'admin'));

-- Only the owner can delete a squad
CREATE POLICY "squads_delete_owner"
  ON public.squads FOR DELETE
  TO authenticated
  USING (public.get_squad_role(id, auth.uid()) = 'owner');

-- -----------------------------------------------------------------------------
-- Squad Memberships Policies
-- -----------------------------------------------------------------------------
-- Squad members can view roster of their own squad
CREATE POLICY "squad_memberships_select_members"
  ON public.squad_memberships FOR SELECT
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));

-- Only owners and admins can directly add members; cannot insert a second owner
CREATE POLICY "squad_memberships_insert_admin"
  ON public.squad_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_squad_role(squad_id, auth.uid()) IN ('owner', 'admin') AND
    role IN ('member', 'admin') AND
    (role != 'admin' OR public.get_squad_role(squad_id, auth.uid()) = 'owner')
  );

-- Only owners can update roles (and cannot demote owner without ownership transfer)
CREATE POLICY "squad_memberships_update_admin"
  ON public.squad_memberships FOR UPDATE
  TO authenticated
  USING (public.get_squad_role(squad_id, auth.uid()) = 'owner')
  WITH CHECK (public.get_squad_role(squad_id, auth.uid()) = 'owner');

-- Members can leave squad (unless sole owner), or admins/owners can remove members (cannot remove owner)
CREATE POLICY "squad_memberships_delete"
  ON public.squad_memberships FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid() AND role != 'owner') OR
    (public.get_squad_role(squad_id, auth.uid()) IN ('owner', 'admin') AND role != 'owner')
  );

-- -----------------------------------------------------------------------------
-- Squad Progression Policies
-- Authoritative progression is strictly server-controlled.
-- -----------------------------------------------------------------------------
-- Squad members can view their squad's XP, level, and evolution stage
CREATE POLICY "squad_progression_select_members"
  ON public.squad_progression FOR SELECT
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));

-- No direct client INSERT, UPDATE, or DELETE policies exist for progression.
-- Changes must be dispatched via server API with service-role permissions.

-- -----------------------------------------------------------------------------
-- Mission Definitions Policies
-- Canonical missions are read-only for authenticated players.
-- -----------------------------------------------------------------------------
CREATE POLICY "mission_definitions_select_active"
  ON public.mission_definitions FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Definitions are managed only by admin/service-role.

-- -----------------------------------------------------------------------------
-- Mission Assignments Policies
-- -----------------------------------------------------------------------------
-- Squad members can view missions assigned to their squad
CREATE POLICY "mission_assignments_select_members"
  ON public.mission_assignments FOR SELECT
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));

-- Squad members can only start an available mission (cannot mark completed or change dates)
CREATE POLICY "mission_assignments_update_members"
  ON public.mission_assignments FOR UPDATE
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()))
  WITH CHECK (
    public.is_squad_member(squad_id, auth.uid()) AND
    status IN ('available', 'in_progress')
  );

-- -----------------------------------------------------------------------------
-- Mission Submissions Policies
-- -----------------------------------------------------------------------------
-- Squad members can view all submissions in their squad
CREATE POLICY "mission_submissions_select_members"
  ON public.mission_submissions FOR SELECT
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));

-- Authenticated squad members can submit proof on behalf of themselves
CREATE POLICY "mission_submissions_insert_member"
  ON public.mission_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = submitted_by AND
    public.is_squad_member(squad_id, auth.uid())
  );

-- Users can only modify their own submissions if still in 'submitted' status
-- and must remain within their authorized squad
CREATE POLICY "mission_submissions_update_own"
  ON public.mission_submissions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = submitted_by AND
    status = 'submitted'
  )
  WITH CHECK (
    auth.uid() = submitted_by AND
    status = 'submitted' AND
    public.is_squad_member(squad_id, auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Squad Lore Policies
-- -----------------------------------------------------------------------------
-- Squad members can view their squad's lore vault
CREATE POLICY "squad_lore_select_members"
  ON public.squad_lore FOR SELECT
  TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));

-- Squad members can contribute memories; creator must be self or null
CREATE POLICY "squad_lore_insert_members"
  ON public.squad_lore FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_squad_member(squad_id, auth.uid()) AND
    (created_by IS NULL OR created_by = auth.uid())
  );

-- =============================================================================
-- 5. Private Storage Bucket Setup and Policies
-- =============================================================================

-- Ensure private storage bucket 'mission-proof' exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-proof',
  'mission-proof',
  false,
  52428800, -- 50 MB max per upload
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/webm',
    'audio/wav',
    'audio/mp4'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
-- Expected folder layout: mission-proof/<squad_id>/<user_id>/<filename>

-- Read policy: only squad members can view/stream proof files from their squad
CREATE POLICY "storage_proof_read_squad_members"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'mission-proof' AND
    public.is_valid_uuid((storage.foldername(name))[1]) AND
    public.is_squad_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

-- Upload policy: authenticated members can upload only into their squad & user subfolder
CREATE POLICY "storage_proof_upload_member_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'mission-proof' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    public.is_valid_uuid((storage.foldername(name))[1]) AND
    public.is_squad_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

-- Delete policy: file owner or squad owner/admin can delete uploaded proof files
CREATE POLICY "storage_proof_delete_owner_or_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mission-proof' AND
    public.is_valid_uuid((storage.foldername(name))[1]) AND (
      (storage.foldername(name))[2] = auth.uid()::text OR
      public.get_squad_role((storage.foldername(name))[1]::uuid, auth.uid()) IN ('owner', 'admin')
    )
  );
