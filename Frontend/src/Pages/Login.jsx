import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../Components/Login/Register/AuthLayout.jsx";
import InputField from "../Components/Login/Register/InputField.jsx";
import SocialAuthButtons from "../Components/Login/Register/SocialAuthButtons.jsx";
import { useAuth } from "../Context/useAuth";
import { signInWithEmail } from "../Services/auth";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(user?.role ? "/dashboard" : "/complete-profile", { replace: true });
    }
  }, [isAuthenticated, loading, navigate, user]);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!password.trim()) return setError("Please enter your password.");

    try {
      setSubmitting(true);
      await signInWithEmail(email.trim(), password);
      // onAuthStateChange in AuthProvider handles the rest
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  if (loading) return null;

  return (
    <AuthLayout>
      <div className="w-full max-w-md p-3 flex flex-col justify-center text-gray-300" onKeyDown={handleKeyDown}>
        <h2 className="text-3xl font-bold mb-1">Welcome!</h2>
        <p className="mb-4">Access your AI control panel</p>

        <div className="space-y-4">
          <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:translate-y-px transition transform py-3 rounded-xl font-semibold text-white"
            onClick={handleLogin}
            disabled={submitting}
          >
            {submitting ? "Accessing..." : "Access Control Panel"}
          </button>
        </div>

        <p className="text-white text-sm mt-3 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Initialize Profile
          </Link>
        </p>

        <SocialAuthButtons />
      </div>
    </AuthLayout>
  );
}
