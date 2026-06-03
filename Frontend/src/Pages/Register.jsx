import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../Components/Login/Register/AuthLayout";
import InputField from "../Components/Login/Register/InputField";
import { useAuth } from "../Context/useAuth";
 
export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, loading } = useAuth();
 
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
 
  // If already logged in, skip straight to profile
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/settings/profile", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);
 
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
 
  const handleRegister = async () => {
    setError("");
 
    // Client-side validation
    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.role) {
      setError("Please select a role.");
      return;
    }
    if (!form.password) {
      setError("Please enter a password.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
 
    try {
      setSubmitting(true);
      await register(form);
      navigate("/settings/profile", { replace: true });
    } catch (err) {
      // Error message comes straight from the backend (e.g. "An account with this email already exists.")
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };
 
  if (loading) return null;

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-[#111827] p-2 mt-2 text-gray-300" onKeyDown={handleKeyDown}>
        <h2 className="text-2xl font-bold mb-1">Create Profile</h2>
        <p className=" mb-2">
          Initialize your AI-powered workspace
        </p>

        <div className="space-y-2">
        <InputField
        label="Full Name"
        value={form.full_name}
        onChange={update("full_name")}
      />
      {/* Role selector */}
          <div className="flex flex-col text-gray-300">
            <label className="mb-1 text-sm font-medium ">Select your role</label>
            <select className="w-full rounded-xl bg-gray-300 border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[#111827]"
            value={form.role}
            onChange={update("role")}
            >
              <option value="">Select role</option>
              <option value="manager">Manager</option>
              <option value="team">Team</option>
            </select>
          </div>
          <InputField
        label="Email"
        type="email"
        value={form.email}
        onChange={update("email")}
           />

      <InputField
         label="Password"
         type="password"
         value={form.password}
         onChange={update("password")}
      />
       {/* Inline error */}
       {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:-translate-y-px transition transform py-3 rounded-xl font-semibold text-white"
          onClick={handleRegister}
          disabled={submitting}>
            {submitting ? "Initializing..." : "Initialize Profile"}
          </button>
        </div>

        <p className="text-gray-400 text-sm mt-2 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Access Control Panel
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
