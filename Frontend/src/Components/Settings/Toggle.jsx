import React from "react";

export default function Toggle({ enabled, setEnabled }) {
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
        enabled ? "bg-linear-to-r from-blue-900 to-cyan-300" : "bg-gray-500"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}