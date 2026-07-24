import { supabaseAdmin } from "../lib/supabaseClient.js";
import { notifyTaskStatusUpdate } from "../Utils/NotificationService.js";
import { model } from "../lib/aiConfig.js";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const parser = new JsonOutputParser();

const assignRolesPrompt = PromptTemplate.fromTemplate(`
You are a project manager AI. Assign each task to the most appropriate role based on the task title, description, and required skills.

Return a JSON array with this exact shape:
[
  {{
    "task_id": "the task id",
    "role_id": "the matching role id",
    "role_title": "the matching role title"
  }}
]

Return only the JSON array, no explanation, no markdown.

Roles:
{roles}

Tasks:
{tasks}
`);

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
  if (!project_id) return res.status(400).json({ error: "project_id is required" });
  if (req.user.role !== "manager") return res.status(403).json({ message: "Only managers can create tasks." });

  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({ project_id, title, what, how, skills, status: status || "not_started", role_id: role_id || null, role_title: role_title || null })
      .select().single();
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
    const { data: task, error: taskError } = await supabaseAdmin
  .from("tasks").select("id, title, status, role_id, project_id").eq("id", req.params.id).single();

    if (taskError || !task) return res.status(404).json({ message: "Task not found." });

    if (userRole !== "manager") {
      if (!task.role_id) return res.status(403).json({ message: "This task is not assigned to any role." });
      const { data: membership } = await supabaseAdmin
        .from("project_members").select("id")
        .eq("project_id", task.project_id).eq("user_id", userId).eq("role_id", task.role_id).single();
      if (!membership) return res.status(403).json({ message: "You are not hired into the role assigned to this task." });
    }

    const { data, error } = await supabaseAdmin
      .from("tasks").update({ status, updated_at: new Date() }).eq("id", req.params.id).select().single();
    if (error) throw error;

    notifyTaskStatusUpdate({
      projectId: task.project_id,
      taskTitle: task.title,
      oldStatus: task.status,
      newStatus: status,
      actorName: req.user.full_name || req.user.email,
    }).catch((err) => console.error("Notification error:", err.message));
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function assignTask(req, res) {
  if (req.user.role !== "manager") return res.status(403).json({ message: "Only managers can assign tasks." });
  const { assigned_to } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks").update({ assigned_to, updated_at: new Date() }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateTask(req, res) {
  if (req.user.role !== "manager") return res.status(403).json({ message: "Only managers can edit tasks." });
  const { title, what, how, skills, status, role_id, role_title } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({ title, what, how, skills, status, role_id: role_id || null, role_title: role_title || null, updated_at: new Date() })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteTask(req, res) {
  if (req.user.role !== "manager") return res.status(403).json({ message: "Only managers can delete tasks." });
  try {
    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── ASSIGN ROLES TO TASKS VIA AI ────────────────────────────────────────────
export async function assignRolesToTasks(req, res) {
  const { projectId } = req.params;
  if (req.user.role !== "manager") return res.status(403).json({ message: "Only managers can do this." });

  try {
    const { data: project } = await supabaseAdmin
      .from("projects").select("roles").eq("id", projectId).single();

    const roles = project?.roles || [];
    if (roles.length === 0) return res.status(400).json({ message: "No roles defined for this project." });

    // Only process tasks with no role assigned
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("tasks").select("id, title, what, how, skills")
      .eq("project_id", projectId).is("role_id", null);

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) return res.json({ message: "All tasks already have roles assigned.", updated: 0 });

    const chain = assignRolesPrompt.pipe(model).pipe(parser);
    const assignments = await chain.invoke({
      roles: JSON.stringify(roles.map((r) => ({ id: r.id, title: r.title, skills: r.skills || [] }))),
      tasks: JSON.stringify(tasks.map((t) => ({ task_id: t.id, title: t.title, what: t.what, skills: t.skills }))),
    });

    const updates = await Promise.all(
      assignments.map(async ({ task_id, role_id, role_title }) => {
        if (!task_id || !role_id) return null;
        const { data, error } = await supabaseAdmin
          .from("tasks")
          .update({ role_id, role_title, updated_at: new Date() })
          .eq("id", task_id).eq("project_id", projectId)
          .select("id, title, role_id, role_title").single();
        if (error) { console.error(`Task ${task_id}:`, error.message); return null; }
        return data;
      })
    );

    const updated = updates.filter(Boolean);
    res.json({ message: `Assigned roles to ${updated.length} tasks.`, updated });
  } catch (err) {
    console.error("assignRolesToTasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
}