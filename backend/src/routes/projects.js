import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/projects
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        tasks (*),
        uploads (id, filename, file_url, created_at)
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post("/", async (req, res) => {
  const { name, description, owner_id } = req.body;

  try {
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, description, owner_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id
router.patch("/:id", async (req, res) => {
  const { name, description, status } = req.body;

  try {
    const { data, error } = await supabase
      .from("projects")
      .update({ name, description, status, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;