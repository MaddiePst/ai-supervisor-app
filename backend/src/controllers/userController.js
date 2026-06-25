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
  } catch (error) {
    console.error("getMe error:", error.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── COMPLETE PROFILE ─────────────────────────────────────────────────────────
// Called by OAuth users (Google/LinkedIn) who need to pick a role
// after signing in for the first time
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
  } catch (error) {
    console.error("completeProfile error:", error.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE OAUTH USER (mode mismatch) ────────────────────────────────────────
// Called when someone tries to "log in" via OAuth with no existing account,
// or tries to "register" via OAuth with an account that already exists.
// Removes the auth.users row — profiles row cascades automatically.
export const deleteOAuthUser = async (req, res) => {
  try {
    console.log("deleteOAuthUser called for user:", req.user.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);
    console.log("deleteUser result:", error ? error.message : "success");
    if (error) throw new Error(error.message);
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteOAuthUser error:", error.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
