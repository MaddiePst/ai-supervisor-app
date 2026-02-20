import { Link } from "react-router-dom";
import React from "react";
import AuthLayout from "../components/AuthLayout";
import InputField from "../Components/InputField";

export default function Register() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-[#111827] p-8 text-gray-300">
        <h2 className="text-2xl font-bold mb-2">Create Profile</h2>
        <p className=" mb-6">
          Initialize your AI-powered workspace
        </p>

        <div className="space-y-4">
          <InputField label="Full Name" />
          <div className="flex flex-col text-gray-300">
  <label className="mb-2 text-sm font-medium ">Select your role</label>
  <select
    className="w-full rounded-xl bg-gray-300 border border-gray-700 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[#111827]"
  >
    <option value="">Select your role</option>
    <option value="employer">Employer</option>
    <option value="employee">Employee</option>
  </select>
</div>
          <InputField label="Email Address" type="email" />
          <InputField label="Password" type="password" />
          <InputField label="Confirm Password" type="password" />

          <button className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:-translate-y-px transition transform py-3 rounded-xl font-semibold text-white">
            Initialize Profile
          </button>
        </div>

        <p className="text-gray-400 text-sm mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Access Control Panel
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
