import React, { useState } from "react";
import googleIcon from "../../../assets/google.svg";
import linkedinIcon from "../../../assets/linkedin.svg";
import { supabase } from "../../../Api/supabaseClient";

// mode = "login" | "register"
// Stored before redirecting so AuthCallback knows which flow to enforce
export default function SocialAuthButtons({ mode }) {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider) => {
    setError("");
    setLoadingProvider(provider);

    try {
      // Store intent so AuthCallback can enforce login-only or register-only
      sessionStorage.setItem("oauth_mode", mode);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw new Error(error.message);
    } catch (err) {
      setError(err.message || `Failed to connect with ${provider}.`);
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex items-center my-1">
          <hr className="grow border-gray-600" />
          <span className="px-2 text-gray-400 text-sm">OR</span>
          <hr className="grow border-gray-600" />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={() => handleOAuth("google")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === "google" ? (
              <span className="text-sm text-gray-400">Connecting...</span>
            ) : (
              <>
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleOAuth("linkedin_oidc")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === "linkedin_oidc" ? (
              <span className="text-sm text-gray-400">Connecting...</span>
            ) : (
              <>
                <img src={linkedinIcon} alt="LinkedIn" className="w-5 h-5" />
                <span>Continue with LinkedIn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}