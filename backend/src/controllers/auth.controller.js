import { supabase } from "../lib/supabase.js";

// Called after OAuth when the user picks their role for the first time.
// req.sbUser is set by requireSupabaseAuth.
export async function completeProfile(req, res) {
  const { role } = req.body;
  const sbUser = req.sbUser;

  if (!["manager", "team"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'manager' or 'team'." });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: sbUser.id,
        email: sbUser.email,
        full_name: sbUser.user_metadata?.full_name ?? sbUser.email.split("@")[0],
        role,
      },
      { onConflict: "id" }
    )
    .select("id, full_name, role, email")
    .single();

  if (error) return res.status(500).json({ message: "Failed to create profile." });

  res.status(201).json({ user: profile });
}
