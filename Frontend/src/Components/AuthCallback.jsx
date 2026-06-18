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
        // ✅ Only run this if we actually came from an OAuth redirect
        // Supabase puts a "code" or "access_token" in the URL after OAuth
        const hash = window.location.hash;
        const search = window.location.search;
        const isOAuthRedirect =
          hash.includes("access_token") ||
          search.includes("code=");

        if (!isOAuthRedirect) {
          // Not an OAuth redirect — someone navigated here directly
          // Send them to login instead
          navigate("/login", { replace: true });
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("OAuth callback error:", error?.message);
          navigate("/login", { replace: true });
          return;
        }

        // Store token so fetchMe() inside refreshProfile() can use it
        localStorage.setItem("token", data.session.access_token);

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