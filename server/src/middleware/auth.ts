import type { Request, Response, NextFunction } from 'express';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './errorHandler.js';
import { verifyAccessToken, createScopedSupabaseClient } from '../lib/supabase.js';

// Extend Express Request interface to include authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
      scopedSupabase?: SupabaseClient;
    }
  }
}

/**
 * Extracts Bearer token from the incoming Authorization header.
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Mandatory authentication middleware.
 * Verifies JWT with Supabase Auth and injects user context & scoped Supabase client.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);

  if (!token) {
    return next(ApiError.unauthorized('Missing or invalid Authorization header. Expected Bearer token.'));
  }

  try {
    const user = await verifyAccessToken(token);

    if (!user) {
      return next(ApiError.unauthorized('Invalid, expired, or revoked authentication token.'));
    }

    // Attach authenticated identity and RLS-scoped Supabase client
    req.user = user;
    req.token = token;
    req.scopedSupabase = createScopedSupabaseClient(token);

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware.
 * Populates req.user if a valid token is provided, but does not reject unauthenticated requests.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    const user = await verifyAccessToken(token);
    if (user) {
      req.user = user;
      req.token = token;
      req.scopedSupabase = createScopedSupabaseClient(token);
    }
  } catch {
    // Silently continue without attaching user for optional auth
  }

  next();
}
