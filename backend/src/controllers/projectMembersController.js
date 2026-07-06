import { supabaseAdmin } from "../lib/supabaseClient.js";

// ─── LIST CANDIDATES FOR A ROLE ───────────────────────────────────────────────
// Returns all team members, scored by skill match with the role
// Already-hired members for this role are marked
export async function listCandidates(req, res) {
  const { projectId } = req.params;
  const { role_id } = req.query;

  try {
    // Get the role's required skills from the project
    const { data: project, error: projError } = await supabaseAdmin
      .from("projects")
      .select("roles")
      .eq("id", projectId)
      .single();

    if (projError || !project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const roles = project.roles || [];
    const role = roles.find((r) => r.id === role_id);
    const roleSkills = role?.skills || [];

    // Get all team members
    const { data: teamMembers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, skills, headline, experience")
      .eq("role", "team");

    if (usersError) throw usersError;

    // Get already-hired members for this project+role
    const { data: hired } = await supabaseAdmin
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("role_id", role_id || "");

    const hiredIds = new Set((hired || []).map((h) => h.user_id));

    // Score each team member by skill match
    const scored = teamMembers.map((member) => {
      const memberSkills = (member.skills || []).map((s) => s.toLowerCase());
      const matched = roleSkills.filter((s) =>
        memberSkills.includes(s.toLowerCase())
      );
      const matchPercent =
        roleSkills.length > 0
          ? Math.round((matched.length / roleSkills.length) * 100)
          : 0;

      return {
        id: member.id,
        name: member.full_name,
        email: member.email,
        skills: member.skills || [],
        headline: member.headline || "",
        experience: member.experience || 0,
        match: matchPercent,
        isHired: hiredIds.has(member.id),
      };
    });

    // Sort by match % descending
    scored.sort((a, b) => b.match - a.match);

    res.json(scored);
  } catch (err) {
    console.error("listCandidates error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── HIRE A CANDIDATE ─────────────────────────────────────────────────────────
// Manager hires a team member into a specific role on a project
export async function hireCandidate(req, res) {
  const { projectId } = req.params;
  const { user_id, role_id, role_title } = req.body;

  if (!user_id || !role_id || !role_title) {
    return res.status(400).json({ message: "user_id, role_id and role_title are required." });
  }

  try {
    // Verify the project belongs to this manager
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project || project.owner_id !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can hire candidates." });
    }

    // Check role capacity
    const { data: projectFull } = await supabaseAdmin
      .from("projects")
      .select("roles")
      .eq("id", projectId)
      .single();

    const roles = projectFull?.roles || [];
    const role = roles.find((r) => r.id === role_id);
    const capacity = role?.count || 1;

    const { data: currentMembers } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("role_id", role_id);

    if (currentMembers && currentMembers.length >= capacity) {
      return res.status(400).json({ message: `All ${capacity} position(s) for this role are filled.` });
    }

    const { data, error } = await supabaseAdmin
      .from("project_members")
      .insert({ project_id: projectId, user_id, role_id, role_title })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("hireCandidate error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── FIRE A CANDIDATE ─────────────────────────────────────────────────────────
export async function fireCandidate(req, res) {
  const { projectId, userId } = req.params;
  const { role_id } = req.body;

  try {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project || project.owner_id !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can remove candidates." });
    }

    const { error } = await supabaseAdmin
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role_id", role_id);

    if (error) throw error;
    res.json({ message: "Candidate removed." });
  } catch (err) {
    console.error("fireCandidate error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── LIST MEMBERS OF A PROJECT ────────────────────────────────────────────────
export async function listMembers(req, res) {
  const { projectId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("project_members")
      .select("id, user_id, role_id, role_title, hired_at, profiles(full_name, email, skills)")
      .eq("project_id", projectId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("listMembers error:", err.message);
    res.status(500).json({ error: err.message });
  }
}