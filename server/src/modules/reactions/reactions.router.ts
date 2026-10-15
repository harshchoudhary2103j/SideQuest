import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { generateQuestyReaction } from './reactions.service.js';
import type { QuestyEventType } from './reactions.types.js';

export const reactionsRouter: Router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_EVENT_TYPES: QuestyEventType[] = ['mission_approved', 'level_up', 'mascot_evolved'];

/**
 * POST /api/v1/reactions/submission/:submissionId
 * Requests a context-aware Questy reaction for an approved mission submission event.
 * Authoritative: Derives trusted squad, mission, and progression data from the database.
 * Completely decoupled from the approval transaction.
 */
reactionsRouter.post(
  '/submission/:submissionId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawSubmissionId = req.params.submissionId;
      const submissionId = typeof rawSubmissionId === 'string' ? rawSubmissionId : '';
      const { eventType } = req.body || {};

      if (!submissionId || !UUID_REGEX.test(submissionId)) {
        res.status(400).json({ error: 'Valid submissionId UUID required' });
        return;
      }

      if (eventType && !VALID_EVENT_TYPES.includes(eventType)) {
        res.status(400).json({
          error: `Invalid eventType. Allowed types: ${VALID_EVENT_TYPES.join(', ')}`,
        });
        return;
      }

      const result = await generateQuestyReaction(
        req.scopedSupabase!,
        submissionId,
        req.user!.id,
        eventType as QuestyEventType | undefined
      );

      res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 400 || err.statusCode === 403 || err.statusCode === 404) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
