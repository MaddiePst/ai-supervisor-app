import { X } from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export default function TaskDrawer({ task, onClose, onSave }) {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);

  // ✅ useMemo derives the form value from the task prop — no useEffect needed
  const initialForm = useMemo(
    () => ({
      title: task?.title || "",
      what: task?.what || "",
      how: task?.how || "",
      skills: task?.skills?.join(", ") || "",
      status: task?.status || "not_started",
      assigned_to: task?.assigned_to || null,
    }),
    [task]
  );

  const [form, setForm] = useState(initialForm);

  // Keep form in sync when task changes (e.g. drawer opened for a different task)
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  // Fetch team members — this is a genuine external data fetch, fine in useEffect
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users?role=team`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [session]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: form.title,
          what: form.what,
          how: form.how,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          status: form.status,
        }),
      });

      await fetch(`${API_BASE}/tasks/${task.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ assigned_to: form.assigned_to }),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  if (!task) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-105 bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <div className="flex gap-2">
              {["not_started", "in_progress", "complete"].map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                  className={`flex-1 py-2 rounded-xl border-2 transition text-xs font-semibold ${
                    form.status === s
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              Assigned To
            </label>
            <select
              name="assigned_to"
              value={form.assigned_to || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              What
            </label>
            <textarea
              name="what"
              value={form.what}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              How
            </label>
            <textarea
              name="how"
              value={form.how}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              Skills (comma separated)
            </label>
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, Node.js, PostgreSQL"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}