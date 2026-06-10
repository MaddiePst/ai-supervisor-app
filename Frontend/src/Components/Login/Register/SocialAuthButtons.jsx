import React, { useState } from "react";
import googleIcon from "../../../assets/google.svg";
import linkedinIcon from "../../../assets/linkedin.svg";
import { supabase } from "../../../Api/supabaseClient";

export default function SocialAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider) => {
    setError("");
    setLoadingProvider(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw new Error(error.message);

      // Browser redirects to provider — no further code runs here
    } catch (err) {
      setError(err.message || `Failed to connect with ${provider}.`);
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <div className="mt-2 flex flex-col gap-3">
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-5">
          {/* Google */}
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

          {/* LinkedIn */}
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