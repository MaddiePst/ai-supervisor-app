import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/tasks/:projectId
router.get("/:projectId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", req.params.projectId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/assign
router.patch("/:id/assign", async (req, res) => {
  const { assigned_to } = req.body;

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ assigned_to, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id - full task update
router.put("/:id", async (req, res) => {
  const { title, what, how, skills, status } = req.body;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ title, what, how, skills, status, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;