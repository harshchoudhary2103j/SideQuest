/**
 * SideQuest — Safe Structured Logger
 * Redacts sensitive fields, bearer tokens, passwords, and secret keys.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = new Set([
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'password',
  'secret',
  'service_role',
  'cookie',
  'apikey',
]);

export function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else if (typeof value === 'string' && value.startsWith('Bearer ')) {
      sanitized[key] = 'Bearer [REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(sanitize(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message: string, meta?: unknown) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message: string, meta?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
