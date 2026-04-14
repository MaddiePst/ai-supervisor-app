import React, { useState } from "react";

export default function Appearance() {
  const [settings, setSettings] = useState({
    language: "English",
    dateFormat: "MM/DD/YYYY",
  });

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Español" },
    { value: "French", label: "Français" },
    { value: "German", label: "Deutsch" },
  ];

  const dateFormatOptions = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saved settings:", settings);
  };

  return (
    <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold">Appearance</h2>

        <button
  type="submit"
  className="ml-auto flex items-center gap-2 px-6 py-2 bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow rounded-lg font-medium hover:text-gray-700 transition"
>
  <ion-icon name="save" className="w-5 h-5"></ion-icon>
  <span>Save Changes</span>
</button>
      </div>

      {/* LANGUAGE */}
      <div className="mb-5">
        <label className="block text-md font-medium mb-1">Language</label>

        <select
          name="language"
          value={settings.language}
          onChange={handleChange}
          className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-black"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* DATE FORMAT */}
      <div className="mb-5">
        <label className="block text-md font-medium mb-1">
          Date Format
        </label>

        <select
          name="dateFormat"
          value={settings.dateFormat}
          onChange={handleChange}
          className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-black"
        >
          {dateFormatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}