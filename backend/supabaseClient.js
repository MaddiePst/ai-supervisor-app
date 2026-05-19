import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL in .env");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("Missing SUPABASE_ANON_KEY in .env");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");

// Used for auth operations (signUp, signInWithPassword, getUser)
// The anon key is correct here — Supabase Auth endpoints always use it
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Used for database operations (insert, select, update on profiles table)
// The service role key bypasses RLS — NEVER send this to the frontend
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);