-- =============================================================================
-- SideQuest Migration: 20261014000001_squad_select_creator_policy.sql
-- Description: Allow squad creator to view the created squad during INSERT RETURNING
-- Root Cause: PostgREST .insert().select().single() checks the SELECT policy during
--             the RETURNING projection. The AFTER INSERT trigger populates
--             squad_memberships, but that row is not visible during the RETURNING
--             check. Adding (auth.uid() = created_by) ensures legitimate creation
--             succeeds under strict RLS.
-- =============================================================================

DROP POLICY IF EXISTS "squads_select_members" ON public.squads;

CREATE POLICY "squads_select_members"
  ON public.squads FOR SELECT
  TO authenticated
  USING (
    public.is_squad_member(id, auth.uid()) OR
    auth.uid() = created_by
  );
