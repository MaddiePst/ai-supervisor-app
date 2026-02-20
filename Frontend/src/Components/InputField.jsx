import React from "react";

export default function InputField({ label, type = "text", ...props }) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder=" "
        className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-gray-300 border border-gray-900 focus:border-cyan-500 focus:ring-3 focus:ring-cyan-500 focus:text-[#1E3A8A] *:outline-none transition"
        {...props}
      />  
      <label className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
        peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-600
        peer-focus:top-2 peer-focus:text-[#111827]">
        {label}
      </label>
    </div>
  );
}

