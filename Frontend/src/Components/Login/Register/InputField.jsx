import React from "react";

export default function InputField({ label, type = "text", value, onChange }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer w-full px-2 pt-5 pb-2 rounded-xl bg-gray-300 border border-gray-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:text-gray-800 outline-none transition text-gray-800"
      />

      <label
        className="
          absolute left-2 top-2 text-gray-500 text-sm transition-all
          peer-placeholder-shown:top-3.5
          peer-placeholder-shown:text-gray-600
          peer-placeholder-shown:text-base
          peer-focus:top-1
          peer-focus:text-sm
          peer-focus:text-gray-800
        "
      >
        {label}
      </label>
    </div>
  );
}