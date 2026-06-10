import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../Components/Login/Register/AuthLayout";
import { useAuth } from "../Context/useAuth";
import { completeProfile } from "../Services/auth";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { session, isAuthenticated, loading, refreshProfile } = useAuth();

  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async () => {
    setError("");
    if (!role) return setError("Please select a role.");

    try {
      setSubmitting(true);
      await completeProfile(session.access_token, role);
      await refreshProfile();
      navigate("/settings/profile", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-[#111827] p-2 mt-2 text-gray-300">
        <h2 className="text-2xl font-bold mb-1">One last step</h2>
        <p className="mb-4">Choose your role to complete your profile.</p>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Select your role</label>
            <select
              className="w-full rounded-xl bg-gray-300 border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[#111827]"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select role</option>
              <option value="manager">Manager</option>
              <option value="team">Team member</option>
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:-translate-y-px transition transform py-3 rounded-xl font-semibold text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
