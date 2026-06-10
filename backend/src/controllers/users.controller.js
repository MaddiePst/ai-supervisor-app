import { supabase } from "../lib/supabase.js";

export function getMe(req, res) {
  res.json({ user: req.user });
}

export async function listUsers(req, res) {
  const { role } = req.query;
  try {
    let query = supabase.from("profiles").select("id, full_name, role, email");
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
