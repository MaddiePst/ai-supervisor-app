import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Api/supabaseClient";
import { deleteMe } from "../Api/auth";
import { useAuth } from "../Context/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile, logout } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

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

        // Read mode before any async calls
        const mode = sessionStorage.getItem("oauth_mode");
        sessionStorage.removeItem("oauth_mode");

        // Check profile with override token — doesn't store in localStorage yet
        const profile = await refreshProfile(accessToken);
        const isNewUser = !profile || !profile.role;

        if (mode === "login" && isNewUser) {
          try { await deleteMe(accessToken); } catch { /* best effort */ }
          await supabase.auth.signOut();
          logout();
          navigate("/login?error=no_account", { replace: true });
          return;
        }

        if (mode === "register" && !isNewUser) {
          await supabase.auth.signOut();
          logout();
          navigate("/register?error=account_exists", { replace: true });
          return;
        }

        // ✅ Valid flow — store token in localStorage first
        localStorage.setItem("token", accessToken);

        // ✅ Now call refreshProfile WITHOUT override so it updates context state
        // This sets user + token in AuthProvider so ProtectedRoute lets us through
        await refreshProfile();

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
  }, []);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Completing sign in...</p>
    </div>
  );
}