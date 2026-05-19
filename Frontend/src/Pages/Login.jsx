import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../Components/Login/Register/AuthLayout.jsx";
import InputField from "../Components/Login/Register/InputField.jsx";
import { useAuth } from "../Context/useAuth";
 
export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
 
  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);
 
  const handleLogin = async () => {
    setError("");
 
    // Client-side validation before hitting the backend
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
 
    try {
      setSubmitting(true);
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Error message comes straight from the backend (e.g. "Invalid credentials.")
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  // Allow submitting with Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };
 
  // Don't render the form until we know the auth state
  // (avoids a flash of the login page for already-logged-in users)
  if (loading) return null;

  return (
    <AuthLayout>
      {/* Right Panel */}
      <div className="w-full max-w-md p-3 flex flex-col justify-center text-gray-300" onKeyDown={handleKeyDown}>
        <h2 className="text-3xl font-bold mb-1">Welcome!!</h2>
        <p className=" mb-4">Access your AI control panel</p>

        <div className="space-y-4 ">
        <InputField label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <InputField label="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

         {/* Inline error — no more alert() */}
         {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:translate-y-px transition transform py-3 rounded-xl font-semibold text-white"
          onClick={handleLogin}
          disabled={submitting}
        >
          {submitting ? "Accessing..." : "Access Control Panel"}
          </button>
        </div>

        <p className="text-white text-sm mt-2 text-center">
          Don’t have an account? {" "}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Initialize Profile
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
