import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Api/supabaseClient";
import { useAuth } from "../Context/useAuth";

// Supabase redirects here after Google/Apple login.
// We grab the session from the URL, store the token, and send the user on.
export default function AuthCallback() {
  const navigate = useNavigate();
  const { restoreFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase puts the session in the URL hash after OAuth
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("OAuth callback error:", error?.message);
          navigate("/login", { replace: true });
          return;
        }

        const token = data.session.access_token;

        // Store token and restore user in context
        await restoreFromToken(token);

        navigate("/settings/profile", { replace: true });
      } catch (err) {
        console.error("Callback error:", err.message);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, restoreFromToken]);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Completing sign in...</p>
    </div>
  );
}