import React, { useState, useEffect, useRef } from "react";
import { Save, User, Upload } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TIME_ZONES = [
  "UTC−12:00", "UTC−08:00 (Pacific Time)", "UTC−07:00 (Mountain Time)",
  "UTC−06:00 (Central Time)", "UTC−05:00 (Eastern Time)",
  "UTC−04:00 (Atlantic Time)", "UTC+00:00 (GMT)",
  "UTC+01:00 (Central European Time)", "UTC+02:00 (Eastern European Time)",
  "UTC+03:00 (Moscow Time)", "UTC+05:30 (India Standard Time)",
  "UTC+08:00 (China / Singapore)", "UTC+09:00 (Japan / Korea)",
  "UTC+10:00 (Australia Eastern)",
];

const AVAILABILITY_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "not_available", label: "Not Available" },
];

export default function Profile() {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    full_name: "", email: "", company: "", industry: "",
    country: "", time_zone: "", experience: "", headline: "",
    description: "", skills: "", availability: "", avatar_url: "", role: "",
  });

  const [preview, setPreview] = useState(null);
  // ✅ useRef instead of useState — persists across re-renders without causing them
  const avatarFileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return;
        setForm({
          full_name: profile.full_name || "",
          email: profile.email || "",
          company: profile.company || "",
          industry: profile.industry || "",
          country: profile.country || "",
          time_zone: profile.time_zone || "",
          experience: profile.experience ?? "",
          headline: profile.headline || "",
          description: profile.description || "",
          skills: Array.isArray(profile.skills)
            ? profile.skills.join(", ")
            : profile.skills || "",
          availability: profile.availability || "",
          avatar_url: profile.avatar_url || "",
          role: profile.role || "",
        });
        if (profile.avatar_url) setPreview(profile.avatar_url);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // ✅ Store file in ref — won't be lost on re-render
    avatarFileRef.current = file;
    // Show preview immediately using local object URL
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let avatar_url = form.avatar_url;

      // ✅ Read from ref, not state
      const fileToUpload = avatarFileRef.current;
      console.log("File to upload:", fileToUpload);

      if (fileToUpload) {
        const fileName = `avatars/${Date.now()}_${fileToUpload.name}`;
        console.log("Uploading to:", fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, fileToUpload, { upsert: true });

        console.log("Upload result:", { uploadData, uploadError });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          avatar_url = urlData.publicUrl;
          console.log("Avatar URL:", avatar_url);
        } else {
          console.error("Upload failed:", uploadError.message);
          setError(`Avatar upload failed: ${uploadError.message}`);
        }
      }

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...form, avatar_url }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save profile");
      }

      const { profile } = await res.json();

      // Update context so avatar shows everywhere immediately
      updateUser({
        name: profile.full_name,
        avatar_url: profile.avatar_url,
      });

      setForm((prev) => ({ ...prev, avatar_url: profile.avatar_url || "" }));
      if (profile.avatar_url) setPreview(profile.avatar_url);

      // Clear the ref after successful save
      avatarFileRef.current = null;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400 p-6 animate-pulse">Loading profile...</p>;
  }

  return (
    <div className="max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-6">Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <label className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer flex items-center justify-center group bg-gray-200">
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <User className="w-8 h-8 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <div className="flex flex-col items-center text-white">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-xs font-semibold">Change</span>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
          <div>
            <p className="font-semibold text-gray-800">{form.full_name || "Your Name"}</p>
            <p className="text-sm text-gray-400 capitalize">{form.role || "No role set"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click the circle to change your photo</p>
          </div>
        </div>

        {/* Full Name + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        {/* Company + Industry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company" name="company" value={form.company} onChange={handleChange} />
          <Field label="Industry" name="industry" value={form.industry} onChange={handleChange} />
        </div>

        {/* Country + Time Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Country" name="country" value={form.country} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium mb-1">Time Zone</label>
            <select name="time_zone" value={form.time_zone} onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select time zone</option>
              {TIME_ZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        {/* Experience */}
        <Field label="Experience (years)" name="experience" type="number" value={form.experience} onChange={handleChange} />

        {/* Headline */}
        <Field label="Headline" name="headline" value={form.headline} onChange={handleChange} placeholder="Short professional headline" />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" rows={4} value={form.description} onChange={handleChange}
            placeholder="Tell us about yourself..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Skills */}
        <Field label="Skills (comma separated)" name="skills" value={form.skills} onChange={handleChange}
          placeholder="e.g. React, Node.js, UX Design" />

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium mb-1">Availability</label>
          <select name="availability" value={form.availability} onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select availability</option>
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Profile saved successfully!
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-blue-900 to-cyan-300 text-white rounded-lg font-medium hover:-translate-y-px active:translate-y-px transition transform disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
    </div>
  );
}