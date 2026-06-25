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

        // ✅ Pass token directly to refreshProfile — don't store in localStorage yet
        // This way if we need to delete the user, localStorage is still clean
        const profile = await refreshProfile(accessToken);
        const mode = sessionStorage.getItem("oauth_mode");
        sessionStorage.removeItem("oauth_mode");

        const isNewUser = !profile || !profile.role;

        if (mode === "login" && isNewUser) {
          // No existing account — delete the auto-created user and reject
          try {
            await deleteMe(accessToken);
          } catch (delErr) {
            console.error("Failed to roll back OAuth user:", delErr.message);
          }
          await supabase.auth.signOut();
          logout();
          navigate("/login?error=no_account", { replace: true });
          return;
        }

        if (mode === "register" && !isNewUser) {
          // Account already exists — reject but don't delete
          await supabase.auth.signOut();
          logout();
          navigate("/register?error=account_exists", { replace: true });
          return;
        }

        // ✅ Valid flow — now store the token
        localStorage.setItem("token", accessToken);

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
      <p className="text-gray-400 text-sm animate-pulse">
        Completing sign in...
      </p>
    </div>
  );
}
