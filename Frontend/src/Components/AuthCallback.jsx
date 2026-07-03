import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Api/supabaseClient";
import { deleteMe } from "../Api/auth";
import { useAuth } from "../Context/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile, logout } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const isOAuthRedirect =
          hash.includes("access_token") || search.includes("code=");

        if (!isOAuthRedirect) {
          navigate("/login", { replace: true });
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          navigate("/login", { replace: true });
          return;
        }

        const accessToken = data.session.access_token;

        // Check profile WITHOUT storing token yet — so we can roll back cleanly
        const profile = await refreshProfile(accessToken);
        const mode = sessionStorage.getItem("oauth_mode"); // "login" | "register"
        sessionStorage.removeItem("oauth_mode");

        // New user = no role set yet (trigger creates profile with role=null)
        const isNewUser = !profile || !profile.role;

        if (mode === "login" && isNewUser) {
          // Tried to log in but no account existed — delete and reject
          try { await deleteMe(accessToken); } catch { /* best effort */ }
          await supabase.auth.signOut();
          logout();
          navigate("/login?error=no_account", { replace: true });
          return;
        }

        if (mode === "register" && !isNewUser) {
          // Tried to register but account already exists — reject without deleting
          await supabase.auth.signOut();
          logout();
          navigate("/register?error=account_exists", { replace: true });
          return;
        }

        // ✅ Valid flow — store the token now
        localStorage.setItem("token", accessToken);

        if (isNewUser) {
          // New OAuth user — needs to pick a role
          navigate("/complete-profile", { replace: true });
        } else {
          // Existing user — go straight to dashboard
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