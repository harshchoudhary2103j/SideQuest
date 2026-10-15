import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables from server/.env if present, otherwise root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface ServerConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  frontendOrigins: string[];
  supabase: {
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
    isConfigured: boolean;
  };
  openai: {
    apiKey: string | null;
    model: string;
    timeoutMs: number;
    isConfigured: boolean;
  };
}

function parseOrigins(raw?: string): string[] {
  if (!raw || raw.trim() === '') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  return (
    value.includes('your-project-ref') ||
    value.includes('your-supabase-anon-key') ||
    value.includes('your-supabase-service-role') ||
    value.includes('your-openai-api-key') ||
    value.trim() === ''
  );
}

export function validateAndLoadConfig(): ServerConfig {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const port = parseInt(process.env.PORT || '4000', 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`[Server Config Error] PORT must be a valid number between 1 and 65535. Received: ${process.env.PORT}`);
  }

  const rawUrl = process.env.SUPABASE_URL || null;
  const rawAnonKey = process.env.SUPABASE_ANON_KEY || null;
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  const isSupabaseConfigured = !isPlaceholder(rawUrl) && !isPlaceholder(rawAnonKey);

  if (env === 'production' && !isSupabaseConfigured) {
    throw new Error(
      '[Server Config Error] Missing required production environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be provided.'
    );
  }

  // OpenAI Provider Configuration (Phase 4E.1)
  const rawOpenAiKey = process.env.OPENAI_API_KEY || null;
  const rawOpenAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const rawTimeout = parseInt(process.env.OPENAI_TIMEOUT_MS || '5000', 10);
  const isOpenAiConfigured = !isPlaceholder(rawOpenAiKey);

  return {
    env,
    port,
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGIN),
    supabase: {
      url: isSupabaseConfigured ? (rawUrl as string) : null,
      anonKey: isSupabaseConfigured ? (rawAnonKey as string) : null,
      serviceRoleKey: !isPlaceholder(rawServiceKey) ? (rawServiceKey as string) : null,
      isConfigured: isSupabaseConfigured,
    },
    openai: {
      apiKey: isOpenAiConfigured ? (rawOpenAiKey as string) : null,
      model: rawOpenAiModel,
      timeoutMs: Number.isNaN(rawTimeout) || rawTimeout <= 0 ? 5000 : rawTimeout,
      isConfigured: isOpenAiConfigured,
    },
  };
}

export const config = validateAndLoadConfig();
