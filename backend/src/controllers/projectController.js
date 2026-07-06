import { supabaseAdmin } from "../lib/supabaseClient.js";

// ─── LIST PROJECTS ────────────────────────────────────────────────────────────
// Managers see their own projects
// Team members see projects they are hired into
export async function listProjects(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let data, error;

    if (userRole === "manager") {
      ({ data, error } = await supabaseAdmin
        .from("projects")
        .select("*, tasks(id, status, skills, assigned_to, role_id, role_title)")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }));
    } else {
      // Team member — get projects they are hired into
      const { data: memberships } = await supabaseAdmin
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId);

      const projectIds = (memberships || []).map((m) => m.project_id);

      if (projectIds.length === 0) {
        return res.json([]);
      }

      ({ data, error } = await supabaseAdmin
        .from("projects")
        .select("*, tasks(id, status, skills, assigned_to, role_id, role_title)")
        .in("id", projectIds)
        .order("created_at", { ascending: false }));
    }

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── GET PROJECT ──────────────────────────────────────────────────────────────
export async function getProject(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(`*, tasks (*), uploads (id, filename, file_url, created_at)`)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── CREATE PROJECT ───────────────────────────────────────────────────────────
export async function createProject(req, res) {
  const { name, description } = req.body;
  const owner_id = req.user.id;

  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({ name, description, owner_id, roles: [] })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── UPDATE PROJECT ───────────────────────────────────────────────────────────
export async function updateProject(req, res) {
  const { name, description, status } = req.body;

  try {
    const { data, error } = await supabaseAdmin
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

// ─── UPDATE PROJECT ROLES ─────────────────────────────────────────────────────
export async function updateProjectRoles(req, res) {
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    return res.status(400).json({ message: "roles must be an array." });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .update({ roles })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ roles: data.roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── DELETE PROJECT ───────────────────────────────────────────────────────────
export async function deleteProject(req, res) {
  try {
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}