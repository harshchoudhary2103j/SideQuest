import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter: Router = Router();

/**
 * GET /api/v1/auth/me
 * Protected route that verifies the Supabase access token server-side,
 * derives authenticated identity, and fetches profile under caller's RLS scope.
 */
authRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const scopedSupabase = req.scopedSupabase!;

      // Fetch user's profile under caller's RLS context (not service role)
      const { data: profile, error } = await scopedSupabase
        .from('profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is row not found (which can happen temporarily)
        return next(error);
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
        profile: profile || null,
      });
    } catch (err) {
      next(err);
    }
  }
);
