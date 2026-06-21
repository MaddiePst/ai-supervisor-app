import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Api/supabaseClient";
import { useAuth } from "../Context/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile, logout } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const isOAuthRedirect = hash.includes("access_token") || search.includes("code=");

        if (!isOAuthRedirect) {
          navigate("/login", { replace: true });
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("OAuth callback error:", error?.message);
          navigate("/login", { replace: true });
          return;
        }

        localStorage.setItem("token", data.session.access_token);

        const profile = await refreshProfile();
        const mode = sessionStorage.getItem("oauth_mode"); // "login" | "register"
        sessionStorage.removeItem("oauth_mode");

        // A profile with no role yet means this is a brand-new OAuth signup
        const isNewUser = !profile || !profile.role;

        if (mode === "login" && isNewUser) {
          // Tried to log in but no account exists — reject and sign out
          await supabase.auth.signOut();
          logout();
          navigate("/login?error=no_account", { replace: true });
          return;
        }

        if (mode === "register" && !isNewUser) {
          // Tried to register but account already exists — reject and sign out
          await supabase.auth.signOut();
          logout();
          navigate("/register?error=account_exists", { replace: true });
          return;
        }

        // Valid flow — continue normally
        if (isNewUser) {
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
  }, [navigate, refreshProfile, logout]);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Completing sign in...</p>
    </div>
  );
}