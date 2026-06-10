import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Api/supabaseClient";
import { useAuth } from "../Context/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("OAuth callback error:", error?.message);
          navigate("/login", { replace: true });
          return;
        }

        // onAuthStateChange fires automatically; we just need to know if
        // the user already has a profile with a role.
        const profile = await refreshProfile();

        if (!profile || !profile.role) {
          navigate("/complete-profile", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Callback error:", err.message);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Completing sign in...</p>
    </div>
  );
}
