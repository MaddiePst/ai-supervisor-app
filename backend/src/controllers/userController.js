import { supabaseAdmin } from "../lib/supabaseClient.js";

// ─── GET CURRENT USER (used by AuthContext) ───────────────────────────────────
// ✅ Now includes avatar_url so the rest of the app can show the profile image
export const getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
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
        avatar_url: profile.avatar_url || null,
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    console.error("getMe error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET FULL PROFILE (Settings page) ────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    return res.json({ profile });
  } catch (err) {
    console.error("getProfile error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      company,
      industry,
      country,
      time_zone,
      experience,
      headline,
      description,
      skills,
      availability,
      avatar_url,
      preferred_language,
      preferred_date_format,
    } = req.body;

    let normalizedSkills = skills;
    if (typeof skills === "string") {
      normalizedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const updateData = {
      full_name,
      company,
      industry,
      country,
      time_zone,
      experience: experience ? parseInt(experience) : null,
      headline,
      description,
      skills: normalizedSkills,
      availability,
      avatar_url,
    };

    if (preferred_language) updateData.preferred_language = preferred_language;
    if (preferred_date_format) updateData.preferred_date_format = preferred_date_format;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select("*")
      .single();

    if (error || !profile) {
      return res.status(400).json({ message: error?.message || "Update failed." });
    }

    return res.json({ profile });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── LIST USERS ───────────────────────────────────────────────────────────────
export const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = supabaseAdmin.from("profiles").select("id, full_name, email, role, avatar_url, skills, headline");
    if (role) query = query.eq("role", role);
    const { data, error } = await query.order("full_name", { ascending: true });
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error("listUsers error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── COMPLETE PROFILE (OAuth users picking a role) ───────────────────────────
export const completeProfile = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required." });

    const roleMap = { manager: "manager", "non-manager": "team", team: "team" };
    const mappedRole = roleMap[role];
    if (!mappedRole) return res.status(400).json({ message: "Invalid role." });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ role: mappedRole })
      .eq("id", req.user.id)
      .select("id, full_name, email, role, avatar_url, created_at")
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
        avatar_url: profile.avatar_url || null,
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    console.error("completeProfile error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE OAUTH USER ────────────────────────────────────────────────────────
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

// ─── SAVE PREFERENCES ────────────────────────────────────────────────────────
export const savePreferences = async (req, res) => {
  try {
    const { preferred_language, preferred_date_format } = req.body;
    const update = {};
    if (preferred_language) update.preferred_language = preferred_language;
    if (preferred_date_format) update.preferred_date_format = preferred_date_format;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("id", req.user.id)
      .select("preferred_language, preferred_date_format")
      .single();

    if (error) throw error;
    return res.json({ profile });
  } catch (err) {
    console.error("savePreferences error:", err.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};