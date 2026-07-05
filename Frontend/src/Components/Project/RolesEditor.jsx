import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

export default function RolesEditor({ roles = [], onSave, readOnly = false }) {
  const normalizedRoles = useMemo(
    () =>
      roles.map((r, i) => ({
        id: r.id || `role-${i}`,
        title: r.title || r.name || "",
        count: r.count || r.positions || 1,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only initialize once
  );

  const [editableRoles, setEditableRoles] = useState(normalizedRoles);
  const [editingId, setEditingId] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);

  // ✅ Sync to parent on every change — Save Project always has the latest state
  useEffect(() => {
    onSave(editableRoles);
  }, [editableRoles]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRole = (id, field, value) =>
    setEditableRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

  const addRole = () => {
    const newRole = { id: `role-${Date.now()}`, title: "", count: 1 };
    setEditableRoles((prev) => [...prev, newRole]);
    setEditingId(newRole.id);
  };

  const removeRole = (id) => {
    setEditableRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveRoles = () => {
    setEditingId(null);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  if (editableRoles.length === 0 && readOnly) return null;

  return (
    <div className="bg-white/70 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Staffing Requirements</h3>
          <p className="text-xs text-gray-400 mt-0.5">Changes are saved automatically when you press Save Project</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={addRole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </button>
            <button onClick={handleSaveRoles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-blue-900 to-cyan-400 text-white transition">
              <Save className="w-3.5 h-3.5" />
              {savedMsg ? "Done!" : "Save Roles"}
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {editableRoles.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No roles yet — add one manually or upload a PDF</p>
          </div>
        ) : (
          editableRoles.map((role) => (
            <div key={role.id} className="px-6 py-4">
              {editingId === role.id && !readOnly ? (
                <div className="flex items-center gap-3">
                  <input autoFocus value={role.title}
                    onChange={(e) => updateRole(role.id, "title", e.target.value)}
                    placeholder="Job title (e.g. Frontend Developer)"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500" />
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-400 whitespace-nowrap">Positions</label>
                    <input type="number" min={1} max={99} value={role.count}
                      onChange={(e) => updateRole(role.id, "count", parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-blue-500" />
                  </div>
                  <button onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeRole(role.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-900">{role.count}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {role.title || <span className="text-gray-400 italic">Untitled role</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {role.count === 1 ? "1 position" : `${role.count} positions`}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingId(role.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeRole(role.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editableRoles.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            {editableRoles.length} role{editableRoles.length !== 1 ? "s" : ""} ·{" "}
            {editableRoles.reduce((sum, r) => sum + r.count, 0)} total positions
          </p>
        </div>
      )}
    </div>
  );
}