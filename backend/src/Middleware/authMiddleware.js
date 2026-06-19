import { supabase } from "../lib/supabaseClient.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    console.log("AUTH MIDDLEWARE — token received:", token.substring(0, 40));

    const { data, error } = await supabase.auth.getUser(token);

    console.log("AUTH MIDDLEWARE — getUser result:", { 
      userId: data?.user?.id, 
      errorMsg: error?.message 
    });

    if (error || !data.user) {
      return res.status(401).json({ message: "Not authorized. Token is invalid or expired." });
    }

    req.user = { id: data.user.id };
    next();
  } catch (err) {
    console.log("AUTH MIDDLEWARE — caught exception:", err.message);
    return res.status(401).json({ message: "Not authorized." });
  }
};