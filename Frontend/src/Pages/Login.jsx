// src/Pages/Login.jsx
import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../Components/InputField"; 

export default function Login() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md p-7 flex flex-col justify-centerctext-gray-300">
        <h2 className="text-3xl font-bold mb-2">Welcome!!</h2>
        <p className=" mb-8">Access your AI control panel</p>

        <div className="space-y-6">
          <InputField label="Email Address" type="email" />
          <InputField label="Password" type="password" />

          <button className="w-full bg-linear-to-r from-blue-900 to-cyan-300 hover:-translate-y-px active:translate-y-px transition transform py-3 rounded-xl font-semibold text-white">
            Access Control Panel
          </button>
        </div>

        <p className="text-white text-sm mt-8 text-center">
          Don’t have an account? {" "}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Initialize Profile
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
