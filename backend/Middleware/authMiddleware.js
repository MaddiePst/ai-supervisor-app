import { supabase } from "../supabaseClient.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // Verify the Supabase session token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Not authorized. Token is invalid or expired." });
    }

    req.user = { id: data.user.id };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized." });
  }
};