import { supabaseAdmin } from "../supabaseClient.js";

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