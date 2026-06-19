import { supabase } from "../lib/supabaseClient.js";;

export async function listProjects(req, res) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*, tasks(id, status, skills, assigned_to)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProject(req, res) {
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
}

export async function createProject(req, res) {
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
}

export async function updateProject(req, res) {
  // Team members may only update projects they're assigned to
  if (req.user.role === "team") {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("project_id", req.params.id)
      .eq("assigned_to", req.user.id)
      .limit(1);

    if (!tasks || tasks.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this project." });
    }
  }

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
}

export async function deleteProject(req, res) {
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
}
