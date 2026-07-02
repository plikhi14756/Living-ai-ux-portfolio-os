import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

const REQUIRED_SUPABASE_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export function missingSupabaseEnvVars() {
  return REQUIRED_SUPABASE_ENV.filter((name) => !process.env[name]?.trim());
}

export function supabaseConfigurationError() {
  const missing = missingSupabaseEnvVars();
  if (!missing.length) return null;
  return `Supabase production configuration is missing: ${missing.join(", ")}. Add these variables in Vercel Project Settings before using production.`;
}

export function isSupabaseConfigured() {
  return missingSupabaseEnvVars().length === 0;
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return cachedClient;
}
