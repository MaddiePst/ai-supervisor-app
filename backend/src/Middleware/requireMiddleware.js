import { supabase, supabaseAdmin } from "../lib/supabaseClient.js";

// Verifies Supabase token only — does NOT require a profile row.
// Use on endpoints that run before a profile exists (e.g., complete-profile).
export async function requireSupabaseAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);



  if (error || !user) return res.status(401).json({ message: "Invalid or expired token" });

  req.sbUser = user;
  next();
}

// Verifies Supabase token AND requires a profiles row to exist.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const {
    data: { user: sbUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !sbUser) return res.status(401).json({ message: "Invalid or expired token" });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("id", sbUser.id)
    .single();

  if (profileError || !profile) return res.status(401).json({ message: "User not found" });

  req.user = profile;
  next();
  console.log("requireAuth — profile:", profile);
  console.log("requireAuth — req.user:", req.user);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}