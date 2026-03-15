import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Legacy client (kept for backwards compatibility in server actions that don't need cookies)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Browser client with SSR support (reads/writes cookies for session)
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
