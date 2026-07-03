import { supabaseAdmin } from "../lib/supabaseClient.js";

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    console.error("getMe error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── LIST USERS ───────────────────────────────────────────────────────────────
export const listUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role");

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query.order("full_name", { ascending: true });

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error("listUsers error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── COMPLETE PROFILE ─────────────────────────────────────────────────────────
// Called by OAuth users (Google/LinkedIn) who need to pick a role
export const completeProfile = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const roleMap = {
      manager: "manager",
      "non-manager": "non_manager",
      team: "team",
    };
    const mappedRole = roleMap[role];

    if (!mappedRole) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ role: mappedRole })
      .eq("id", req.user.id)
      .select("id, full_name, email, role, created_at")
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    return res.json({
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    console.error("completeProfile error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE OAUTH USER ────────────────────────────────────────────────────────
// Called to roll back invalid OAuth login/register attempts
export const deleteOAuthUser = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);
    if (error) throw new Error(error.message);
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteOAuthUser error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};