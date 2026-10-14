import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const missionsRouter: Router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/missions/catalog
 * Returns all active mission definitions from the canonical catalog
 * under caller's RLS scope.
 */
missionsRouter.get(
  '/catalog',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scopedSupabase = req.scopedSupabase!;

      const { data: catalog, error } = await scopedSupabase
        .from('mission_definitions')
        .select('*')
        .eq('status', 'active')
        .order('difficulty', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        return next(error);
      }

      res.status(200).json({
        catalog: catalog || [],
        total: catalog?.length || 0,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/missions/daily/:squadId
 * Idempotently fetches or creates the 5 daily mission assignments for the squad.
 * Caller's squad membership is validated at database/RPC boundary.
 */
missionsRouter.get(
  '/daily/:squadId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawSquadId = req.params.squadId;
      const squadId = typeof rawSquadId === 'string' ? rawSquadId : Array.isArray(rawSquadId) ? rawSquadId[0] : '';
      const timezone = (req.query.timezone as string) || 'UTC';

      if (!squadId || !UUID_REGEX.test(squadId)) {
        res.status(400).json({ error: 'Valid squadId UUID required' });
        return;
      }

      const scopedSupabase = req.scopedSupabase!;

      const { data: assignments, error } = await scopedSupabase
        .rpc('get_or_create_daily_missions', {
          p_squad_id: squadId,
          p_timezone: timezone,
        });

      if (error) {
        if (error.message.includes('not a member') || error.message.includes('Unauthorized')) {
          res.status(403).json({ error: 'Caller is not a member of this squad' });
          return;
        }
        return next(error);
      }

      res.status(200).json({
        squadId,
        date: assignments?.[0]?.assigned_date || new Date().toISOString().split('T')[0],
        assignments: assignments || [],
        count: assignments?.length || 0,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/missions/assignments/:assignmentId/submissions
 * Returns all submissions for a given assignment, scoped to squad members.
 */
missionsRouter.get(
  '/assignments/:assignmentId/submissions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawAssignmentId = req.params.assignmentId;
      const assignmentId = typeof rawAssignmentId === 'string' ? rawAssignmentId : '';

      if (!assignmentId || !UUID_REGEX.test(assignmentId)) {
        res.status(400).json({ error: 'Valid assignmentId UUID required' });
        return;
      }

      const scopedSupabase = req.scopedSupabase!;

      // 1. Verify assignment exists and caller has access via RLS
      const { data: assignment, error: assignError } = await scopedSupabase
        .from('mission_assignments')
        .select('id, squad_id, status')
        .eq('id', assignmentId)
        .maybeSingle();

      if (assignError) {
        return next(assignError);
      }

      if (!assignment) {
        res.status(404).json({ error: 'Mission assignment not found or access denied' });
        return;
      }

      // 2. Fetch submissions for this assignment (RLS enforces squad membership)
      const { data: submissions, error: subError } = await scopedSupabase
        .from('mission_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (subError) {
        return next(subError);
      }

      res.status(200).json({
        assignmentId,
        submissions: submissions || [],
        count: submissions?.length || 0,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/missions/assignments/:assignmentId/submissions
 * Submits proof for a mission assignment with strict server-side validation.
 * Derive submitter identity from authenticated JWT; never trust client user ID.
 */
missionsRouter.post(
  '/assignments/:assignmentId/submissions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawAssignmentId = req.params.assignmentId;
      const assignmentId = typeof rawAssignmentId === 'string' ? rawAssignmentId : '';
      const { squadId, proofType, storagePath, textContent } = req.body || {};

      if (!assignmentId || !UUID_REGEX.test(assignmentId)) {
        res.status(400).json({ error: 'Valid assignmentId UUID required' });
        return;
      }

      if (!squadId || !UUID_REGEX.test(squadId)) {
        res.status(400).json({ error: 'Valid squadId UUID required' });
        return;
      }

      const validProofTypes = ['photo', 'video', 'voice', 'text'];
      if (!proofType || !validProofTypes.includes(proofType)) {
        res.status(400).json({ error: `proofType must be one of: ${validProofTypes.join(', ')}` });
        return;
      }

      if (!storagePath && !textContent) {
        res.status(400).json({ error: 'Either storagePath or textContent must be provided' });
        return;
      }

      const userId = req.user!.id;

      // Validate storage path conventions if provided: must be <squadId>/<userId>/<filename>
      if (storagePath) {
        const parts = (storagePath as string).split('/');
        if (parts.length < 3 || parts[0] !== squadId || parts[1] !== userId) {
          res.status(403).json({
            error: 'Storage path must match the authorized folder convention: <squadId>/<userId>/<filename>',
          });
          return;
        }
      }

      const scopedSupabase = req.scopedSupabase!;

      // Verify the assignment belongs to this squad
      const { data: assignment, error: assignError } = await scopedSupabase
        .from('mission_assignments')
        .select('id, squad_id, status')
        .eq('id', assignmentId)
        .eq('squad_id', squadId)
        .maybeSingle();

      if (assignError) {
        return next(assignError);
      }

      if (!assignment) {
        res.status(404).json({ error: 'Mission assignment not found for this squad or access denied' });
        return;
      }

      // Insert submission record (RLS enforces that submitted_by = auth.uid())
      const { data: newSubmission, error: insertError } = await scopedSupabase
        .from('mission_submissions')
        .insert({
          assignment_id: assignmentId,
          squad_id: squadId,
          submitted_by: userId,
          proof_type: proofType,
          proof_storage_path: storagePath || null,
          text_content: textContent ? String(textContent).trim() : null,
          status: 'submitted',
        })
        .select()
        .single();

      if (insertError) {
        return next(insertError);
      }

      // Transition assignment from 'available' to 'in_progress'
      if (assignment.status === 'available') {
        await scopedSupabase
          .from('mission_assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignmentId)
          .eq('status', 'available');
      }

      res.status(201).json({
        success: true,
        submission: newSubmission,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/missions/proof/signed-url
 * Generates a short-lived signed URL for reading a proof object in the private bucket.
 * Caller's membership in the target squad is strictly validated.
 */
missionsRouter.post(
  '/proof/signed-url',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { storagePath, expiresIn = 3600 } = req.body || {};

      if (!storagePath || typeof storagePath !== 'string') {
        res.status(400).json({ error: 'storagePath string is required' });
        return;
      }

      const parts = storagePath.split('/');
      const squadId = parts[0];
      if (!squadId || !UUID_REGEX.test(squadId)) {
        res.status(400).json({ error: 'storagePath must start with a valid squadId UUID' });
        return;
      }

      const scopedSupabase = req.scopedSupabase!;

      // Verify caller is member of this squad
      const { data: membership, error: memError } = await scopedSupabase
        .from('squad_memberships')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', req.user!.id)
        .maybeSingle();

      if (memError || !membership) {
        res.status(403).json({ error: 'Access denied: not a member of the squad that owns this proof' });
        return;
      }

      // Generate signed URL via Supabase Storage
      const { data, error: signError } = await scopedSupabase.storage
        .from('mission-proof')
        .createSignedUrl(storagePath, Math.min(Number(expiresIn) || 3600, 86400));

      if (signError) {
        res.status(404).json({ error: `Could not sign URL: ${signError.message}` });
        return;
      }

      res.status(200).json({
        signedUrl: data?.signedUrl,
        storagePath,
        expiresIn: Math.min(Number(expiresIn) || 3600, 86400),
      });
    } catch (err) {
      next(err);
    }
  }
);
