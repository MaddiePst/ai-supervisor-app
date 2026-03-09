import React from "react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-purple-600">Settings</h1>
      <p className="text-gray-600">
        Manage your account preferences and application settings.
      </p>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow">
        <h2 className="text-xl font-semibold mb-6">Profile</h2>

        <div className="grid grid-cols-2 gap-6">
          <input
            placeholder="Full Name"
            className="p-3 rounded-xl border border-gray-300"
            />
          <input
            placeholder="Email Address"
            className="p-3 rounded-xl border border-gray-300"
            />
          <input
            placeholder="Company"
            className="p-3 rounded-xl border border-gray-300"
            />
          <input
            placeholder="Role"
            className="p-3 rounded-xl border border-gray-300"
            />
        </div>

        <button className="mt-6 px-6 py-3 rounded-xl bg-linear-to-r from-purple-500 to-teal-400 text-white font-semibold">
          Save Changes
        </button>
      </div>
    </div>
    
  );
}
