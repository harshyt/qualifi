import { z } from "zod";

/**
 * Centralized, validated environment variables.
 *
 * Every server-side module should call `getServerEnv()` instead of accessing
 * `process.env` directly. This guarantees a hard, early failure with a
 * clear error message if any required variable is missing.
 */

// ── Server-only variables (never exposed to the browser) ──────────────
const serverSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY must not be empty"),
});

// ── Public variables (available on client and server) ─────────────────
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY must not be empty"),
});

// ── Parse + export ────────────────────────────────────────────────────

/** Validated public env — safe to use on both client and server. */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Validated server-only env — import only in Server Components,
 * Server Actions, Route Handlers, and `middleware.ts`.
 *
 * Calling this on the client will throw because the values are undefined.
 */
export function getServerEnv() {
  return serverSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
}
