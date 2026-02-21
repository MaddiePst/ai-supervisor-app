import { useState } from "react";

export default function EditProfile() {
  const [formData, setFormData] = useState({
    fullName: "",
    pronouns: "",
    industry: "",
    role: "",
    country: "",
    city: "",
    experience: "",
    headline: "",
    description: "",
    skills: "",
    availability: "",
    image: null,
    preview: null,
  });

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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
            {formData.preview ? (
              <img
                src={formData.preview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>

          <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Full Name */}
        <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />

        {/* Pronouns */}
        <Input label="Pronouns" name="pronouns" value={formData.pronouns} onChange={handleChange} placeholder="e.g. she/her, he/him, they/them" />

        {/* Industry */}
        <Input label="Industry" name="industry" value={formData.industry} onChange={handleChange} />

        {/* Country & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Country / Region" name="country" value={formData.country} onChange={handleChange} />
          <Input label="City" name="city" value={formData.city} onChange={handleChange} />
        </div>

        {/* Experience */}
        <Input
          label="Experience (years)"
          name="experience"
          type="number"
          value={formData.experience}
          onChange={handleChange}
        />

        {/* Headline */}
        <Input label="Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="Short professional headline" />

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
          />
        </div>

        {/* Skills */}
        <Input
          label="Skills"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          placeholder="e.g. React, Node.js, UX Design"
        />

        {/* Availability */}
        <Input
          label="Availability"
          name="availability"
          value={formData.availability}
          onChange={handleChange}
          placeholder="e.g. Open to work, Freelance, Part-time"
        />

        {/* Save Button */}
        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

/* Reusable Input Component */
function Input({ label, name, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
