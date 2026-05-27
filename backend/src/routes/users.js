import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/users?role=team
router.get("/", async (req, res) => {
  const { role } = req.query;
  try {
    let query = supabase.from("profiles").select("id, full_name, role");
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;