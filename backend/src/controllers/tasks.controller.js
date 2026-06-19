import { supabase } from "../lib/supabaseClient.js";;

export async function listTasks(req, res) {
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
}

export async function updateTaskStatus(req, res) {
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
}

export async function assignTask(req, res) {
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
}

export async function updateTask(req, res) {
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
}

export async function deleteTask(req, res) {
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
}
