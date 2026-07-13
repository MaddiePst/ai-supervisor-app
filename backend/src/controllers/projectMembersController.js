import { supabaseAdmin } from "../lib/supabaseClient.js";
import { sendHiringEmail } from "../Utils/SendHiringEmail.js";

// ─── LIST CANDIDATES FOR A ROLE ───────────────────────────────────────────────
export async function listCandidates(req, res) {
  const { projectId } = req.params;
  const { role_id } = req.query;

  try {
    // 1. Fetch project roles and all tasks in parallel
    const [projectRes, allTasksRes, teamMembersRes] = await Promise.all([
      supabaseAdmin.from("projects").select("roles").eq("id", projectId).single(),
      supabaseAdmin.from("tasks").select("skills, role_id").eq("project_id", projectId),
      supabaseAdmin.from("profiles").select("id, full_name, email, skills, headline, description, experience, avatar_url").eq("role", "team"),
    ]);

    if (teamMembersRes.error) throw teamMembersRes.error;

    const roles = projectRes.data?.roles || [];
    const role = roles.find((r) => r.id === role_id);
    const allTasks = allTasksRes.data || [];
    const teamMembers = teamMembersRes.data || [];

    // 2. Build skill pool for matching
    // Priority: role-level skills → role title keyword map → all project skills
    const roleLevelSkills = (role?.skills || []).map((s) => s.toLowerCase());

    // Common role title → expected skills mapping (10-15 skills per role for accurate matching)
    const ROLE_SKILL_MAP = {
      "backend": ["node.js", "express", "python", "java", "postgresql", "mysql", "mongodb", "rest apis", "graphql", "supabase", "database", "sql", "api", "microservices", "authentication"],
      "frontend": ["react", "vue", "angular", "javascript", "typescript", "html", "css", "tailwind", "next.js", "vite", "redux", "webpack", "responsive design", "accessibility", "ui"],
      "fullstack": ["react", "node.js", "javascript", "typescript", "postgresql", "rest apis", "html", "css", "express", "mongodb", "supabase", "git", "docker", "api", "authentication"],
      "full stack": ["react", "node.js", "javascript", "typescript", "postgresql", "rest apis", "html", "css", "express", "mongodb", "supabase", "git", "docker", "api", "authentication"],
      "devops": ["docker", "kubernetes", "aws", "azure", "google cloud", "ci/cd", "terraform", "linux", "nginx", "deployment", "vercel", "railway", "ansible", "monitoring", "bash"],
      "ai": ["python", "langchain", "tensorflow", "pytorch", "machine learning", "nlp", "llm", "rag", "groq", "openai", "hugging face", "vector database", "embeddings", "prompt engineering", "langchain"],
      "ml": ["python", "tensorflow", "pytorch", "machine learning", "data science", "pandas", "numpy", "scikit-learn", "deep learning", "nlp", "computer vision", "statistics", "jupyter", "mlflow", "feature engineering"],
      "ux": ["figma", "sketch", "wireframing", "prototyping", "user research", "usability testing", "accessibility", "design systems", "adobe xd", "information architecture", "interaction design", "typography", "color theory", "wcag", "user flows"],
      "designer": ["figma", "sketch", "wireframing", "prototyping", "user research", "usability testing", "accessibility", "design systems", "adobe xd", "information architecture", "interaction design", "typography", "color theory", "wcag", "user flows"],
      "qa": ["testing", "jest", "cypress", "selenium", "test automation", "quality assurance", "manual testing", "postman", "api testing", "regression testing", "test planning", "bug tracking", "jira", "performance testing", "load testing"],
      "quality": ["testing", "jest", "cypress", "selenium", "test automation", "quality assurance", "manual testing", "postman", "api testing", "regression testing", "test planning", "bug tracking", "jira", "performance testing", "load testing"],
      "security": ["cybersecurity", "penetration testing", "encryption", "hipaa", "gdpr", "soc 2", "network security", "owasp", "vulnerability assessment", "siem", "firewall", "identity management", "zero trust", "threat modeling", "incident response"],
      "cybersecurity": ["cybersecurity", "penetration testing", "encryption", "hipaa", "gdpr", "soc 2", "network security", "owasp", "vulnerability assessment", "siem", "firewall", "identity management", "zero trust", "threat modeling", "incident response"],
      "project manager": ["agile", "scrum", "jira", "project planning", "stakeholder management", "waterfall", "risk management", "budgeting", "resource allocation", "roadmapping", "confluence", "kanban", "sprint planning", "reporting", "communication"],
      "manager": ["agile", "scrum", "jira", "project planning", "stakeholder management", "waterfall", "risk management", "budgeting", "resource allocation", "roadmapping", "confluence", "kanban", "sprint planning", "reporting", "communication"],
      "data": ["sql", "python", "tableau", "power bi", "data analysis", "reporting", "excel", "statistics", "data visualization", "etl", "data warehousing", "bigquery", "snowflake", "pandas", "machine learning"],
      "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile development", "xcode", "android studio", "push notifications", "app store", "offline storage", "ux design", "performance optimization", "cross-platform"],
    };

    // Match role title against ALL matching keywords in the map
    // e.g. "Backend Developer" matches both "backend" AND "developer" if present
    const roleTitleLower = (role?.title || "").toLowerCase();
    const titleMappedSkillsSet = new Set();
    for (const [keyword, skills] of Object.entries(ROLE_SKILL_MAP)) {
      if (roleTitleLower.includes(keyword)) {
        skills.forEach((s) => titleMappedSkillsSet.add(s));
      }
    }
    const titleMappedSkills = Array.from(titleMappedSkillsSet);

    // Collect all project task skills as final fallback
    const allProjectSkillsSet = new Set();
    allTasks.forEach((t) => (t.skills || []).forEach((s) => allProjectSkillsSet.add(s.toLowerCase())));

    let skillsToMatch = [];
    if (titleMappedSkills.length > 0) {
      // ✅ Always prefer the title map — it has 15 skills per role for accurate matching
      // Merge with role-level skills if defined, deduplicated
      const merged = new Set([...titleMappedSkills, ...roleLevelSkills]);
      skillsToMatch = Array.from(merged);
    } else if (roleLevelSkills.length > 0) {
      skillsToMatch = roleLevelSkills;
    } else {
      skillsToMatch = Array.from(allProjectSkillsSet);
    }

    console.log("role:", role?.title, "| skillsToMatch:", skillsToMatch.slice(0, 5));

    // 3. Get all hired members for this project
    const { data: allHired } = await supabaseAdmin
      .from("project_members")
      .select("user_id, role_id")
      .eq("project_id", projectId);

    const hiredInThisRole = new Set(
      (allHired || []).filter((h) => h.role_id === role_id).map((h) => h.user_id)
    );
    const hiredAnywhereOnProject = new Set((allHired || []).map((h) => h.user_id));

    // 4. Split into available and hired-in-this-role
    const availableMembers = teamMembers.filter((m) => !hiredAnywhereOnProject.has(m.id));
    const hiredMembers = teamMembers.filter((m) => hiredInThisRole.has(m.id));

    // 5. Score candidates
    const scoreCandidate = (member) => {
      const memberSkills = (member.skills || []).map((s) => s.toLowerCase());
      const matched = skillsToMatch.filter((s) => memberSkills.includes(s));
      const matchPercent =
        skillsToMatch.length > 0
          ? Math.round((matched.length / skillsToMatch.length) * 100)
          : Math.min(Math.round((member.experience || 0) * 10), 100);

      return {
        id: member.id,
        name: member.full_name,
        email: member.email,
        skills: member.skills || [],
        headline: member.headline || "",
        description: member.description || "",
        matchedSkills: matched,
        experience: member.experience || 0,
        avatar_url: member.avatar_url || null,
        match: matchPercent,
        isHired: hiredInThisRole.has(member.id),
      };
    };

    // Hired in this role always at top, then by match % descending
    const scored = [
      ...hiredMembers.map(scoreCandidate),
      ...availableMembers.map(scoreCandidate).sort((a, b) => b.match - a.match),
    ];
    res.json(scored);
  } catch (err) {
    console.error("listCandidates error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── HIRE A CANDIDATE ─────────────────────────────────────────────────────────
export async function hireCandidate(req, res) {
  const { projectId } = req.params;
  const { user_id, role_id, role_title } = req.body;

  if (!user_id || !role_id || !role_title) {
    return res.status(400).json({ message: "user_id, role_id and role_title are required." });
  }

  try {
    // Verify project belongs to this manager
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("owner_id, name, roles")
      .eq("id", projectId)
      .single();

    if (!project || project.owner_id !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can hire candidates." });
    }

    // Check role capacity
    const roles = project.roles || [];
    const role = roles.find((r) => r.id === role_id);
    const capacity = role?.count || 1;
    const roleSkills = role?.skills || [];

    const { data: currentMembers } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("role_id", role_id);

    if (currentMembers && currentMembers.length >= capacity) {
      return res.status(400).json({
        message: `All ${capacity} position(s) for this role are filled.`,
      });
    }

    // Insert member
    const { data: member, error } = await supabaseAdmin
      .from("project_members")
      .insert({ project_id: projectId, user_id, role_id, role_title })
      .select()
      .single();

    if (error) throw error;

    // ✅ Fetch candidate and manager details for the email
    const { data: candidate } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, skills")
      .eq("id", user_id)
      .single();

    const { data: manager } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", req.user.id)
      .single();

    // ✅ Find matched skills between candidate and role
    const candidateSkills = (candidate?.skills || []).map((s) => s.toLowerCase());
    const matchedSkills = roleSkills.filter((s) =>
      candidateSkills.includes(s.toLowerCase())
    );

    // ✅ Send hiring email — non-blocking
    await sendHiringEmail({
      candidateEmail: candidate?.email,
      candidateName: candidate?.full_name || "Team Member",
      managerName: manager?.full_name || "Your Manager",
      projectName: project.name,
      roleTitle: role_title,
      skills: matchedSkills.length > 0 ? matchedSkills : roleSkills,
      positionsCount: capacity,
    });

    res.status(201).json(member);
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

// ─── LIST MEMBERS ─────────────────────────────────────────────────────────────
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