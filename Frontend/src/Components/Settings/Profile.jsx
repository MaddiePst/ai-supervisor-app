import React from "react";
import { useState } from "react";

export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: "",
    industry: "",
    role: "",
    country: "",
    timeZone: "",
    experience: "",
    headline: "",
    description: "",
    skills: "",
    availability: "",
    image: null,
    preview: null,
  });

  const timeZones = [
    "UTC−12:00",
    "UTC−08:00 (Pacific Time)",
    "UTC−07:00 (Mountain Time)",
    "UTC−06:00 (Central Time)",
    "UTC−05:00 (Eastern Time)",
    "UTC−04:00 (Atlantic Time)",
    "UTC+00:00 (GMT)",
    "UTC+01:00 (Central European Time)",
    "UTC+02:00 (Eastern European Time)",
    "UTC+03:00 (Moscow Time)",
    "UTC+05:30 (India Standard Time)",
    "UTC+08:00 (China / Singapore)",
    "UTC+09:00 (Japan / Korea)",
    "UTC+10:00 (Australia Eastern)",
  ];

  const availabilityOptions = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "not_available", label: "Not Available" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile Data:", formData);
    // TODO: send to backend
  };

  return (
    <div className="max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-6">Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          <label className="relative w-24 h-24 rounded-full bg-gray-200 overflow-hidden cursor-pointer flex items-center justify-center">
            {formData.preview ? (
              <img
                src={formData.preview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                {/* ICON */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 mb-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>

                {/* TEXT */}
                <span className="text-xs">Add</span>
              </div>
            )}

            {/* HIDDEN INPUT */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Full Name */}
        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        {/* Industry */}
        <Input
          label="Industry"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          required
        />

        {/* Role */}
        <Input
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        />

        {/*Country & Time Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Time Zone <span className="text-red-500">*</span>
            </label>

            <select
              name="time"
              value={formData.time || ""}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select Time Zone</option>

              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Experience */}
        <Input
          label="Experience (years)"
          name="experience"
          type="number"
          value={formData.experience}
          onChange={handleChange}
          required
        />

        {/* Headline */}
        <Input
          label="Headline"
          name="headline"
          value={formData.headline}
          onChange={handleChange}
          placeholder="Short professional headline"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Tell us about yourself..."
            required
          />
        </div>

        {/* Skills */}
        <Input
          label="Skills"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          placeholder="e.g. React, Node.js, UX Design"
          required
        />

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Availability <span className="text-red-500">*</span>
          </label>

          <select
            name="availability"
            value={formData.availability || ""}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select Availability</option>

            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <div className="flex">

        <button
  type="submit"
  className="ml-auto flex items-center gap-2 px-6 py-2 bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow rounded-lg font-medium hover:text-gray-700 transition"
>
  <ion-icon name="save" className="w-5 h-5"></ion-icon>
  <span>Save Changes</span>
</button>
          </div>
      </form>
    </div>
  );
}

/* Reusable Input Component */
function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false, 
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
