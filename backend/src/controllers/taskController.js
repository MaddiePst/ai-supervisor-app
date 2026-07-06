import { supabaseAdmin } from "../lib/supabaseClient.js";

export async function listTasks(req, res) {
  try {
    const { data, error } = await supabaseAdmin
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

export async function createTask(req, res) {
  const { project_id, title, what, how, skills, status, role_id, role_title } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  // Only managers can create tasks
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Only managers can create tasks." });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        project_id, title, what, how, skills,
        status: status || "not_started",
        role_id: role_id || null,
        role_title: role_title || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateTaskStatus(req, res) {
  const { status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Get the task to check its role_id
    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("role_id, project_id")
      .eq("id", req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Team members can only update status if they are hired into the task's role
    if (userRole !== "manager") {
      if (!task.role_id) {
        return res.status(403).json({ message: "This task is not assigned to any role." });
      }

      const { data: membership } = await supabaseAdmin
        .from("project_members")
        .select("id")
        .eq("project_id", task.project_id)
        .eq("user_id", userId)
        .eq("role_id", task.role_id)
        .single();

      if (!membership) {
        return res.status(403).json({ message: "You are not hired into the role assigned to this task." });
      }
    }

    const { data, error } = await supabaseAdmin
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
  // Only managers can assign tasks
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Only managers can assign tasks." });
  }

  const { assigned_to } = req.body;

  try {
    const { data, error } = await supabaseAdmin
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
  // Only managers can update full task details
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Only managers can edit tasks." });
  }

  const { title, what, how, skills, status, role_id, role_title } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({
        title, what, how, skills, status,
        role_id: role_id || null,
        role_title: role_title || null,
        updated_at: new Date(),
      })
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
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Only managers can delete tasks." });
  }

  try {
    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}