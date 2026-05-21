import { createClient } from "@supabase/supabase-js";

// This is the FRONTEND Supabase client — uses the anon key only.
// Never use the service role key on the frontend.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);