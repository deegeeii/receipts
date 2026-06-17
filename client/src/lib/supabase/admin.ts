// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

// ── CLIENT ────────────────────────────────────────────────────────────────────
// supabaseAdmin — service role client for server-side operations that bypass RLS
// Never expose this to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
