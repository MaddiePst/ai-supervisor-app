import { supabase, supabaseAdmin } from "../supabaseClient.js";
import { sendWelcomeEmail } from "../Utils/SendEmail.js";

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate all fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // 2. Map role from frontend value to DB value
    const roleMap = { manager: "manager", "non-manager": "non_manager", "team": "team" };
    const mappedRole = roleMap[role];
    if (!mappedRole) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // 3. Create user in Supabase Auth
    //    The SQL trigger will automatically create the profiles row
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,  // trigger reads this from raw_user_meta_data
          role: mappedRole,
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered")) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }
      throw new Error(authError.message);
    }

    const userId = authData.user.id;

    // 4. Update the profile with the correct role — trigger creates it but
    //    may not set the role correctly depending on your trigger definition
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: name, role: mappedRole })
      .eq("id", userId);

    if (updateError) throw new Error(updateError.message);

    // 5. Sign in to get session token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) throw new Error(sessionError.message);

    // 6. Fetch the final profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Profile not found after registration.");

    return res.status(201).json({
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
      },
      token: sessionData.session.access_token,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !sessionData.user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", sessionData.user.id)
      .single();

    if (profileError || !profile) {
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
      token: sessionData.session.access_token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};