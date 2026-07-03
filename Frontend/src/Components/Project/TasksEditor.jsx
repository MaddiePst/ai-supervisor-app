import { Edit2, Plus, Save, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState, useMemo } from "react";
import StatusBadge from "./StatusBadge";

const STATUSES = ["not_started", "in_progress", "complete"];

const emptyTask = () => ({
  id: `task-${Date.now()}`,
  title: "",
  what: "",
  how: "",
  skills: "",
  status: "not_started",
  _isNew: true,
});

export default function TasksEditor({ tasks = [], onSave }) {
  const initial = useMemo(
    () =>
      tasks.map((t, i) => ({
        id: t.id || `task-${i}`,
        title: t.title || "",
        what: t.what || "",
        how: t.how || "",
        skills: Array.isArray(t.skills) ? t.skills.join(", ") : t.skills || "",
        status: t.status || "not_started",
      })),
    [tasks]
  );

  const [editableTasks, setEditableTasks] = useState(initial);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [saved, setSaved] = useState(false);

  const update = (id, field, value) =>
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

  const addTask = () => {
    const t = emptyTask();
    setEditableTasks((prev) => [...prev, t]);
    setEditingId(t.id);
    setExpandedId(null);
  };

  const removeTask = (id) => {
    setEditableTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSave = async () => {
    const normalized = editableTasks.map((t) => ({
      ...t,
      skills: typeof t.skills === "string"
        ? t.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : t.skills,
    }));
    await onSave(normalized);
    setSaved(true);
    setEditingId(null);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white/70 rounded-2xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Tasks</h3>
          <p className="text-xs text-gray-400 mt-0.5">AI-generated — edit as needed</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-blue-900 to-cyan-400 text-white transition"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved!" : "Save Tasks"}
          </button>
        </div>
      </div>

      {/* TASK LIST */}
      <div className="divide-y divide-gray-100">
        {editableTasks.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No tasks yet — add one manually or upload a PDF</p>
          </div>
        ) : (
          editableTasks.map((task) => (
            <div key={task.id} className="px-6 py-4">
              {editingId === task.id ? (
                /* ── EDIT MODE ── */
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={task.title}
                      onChange={(e) => update(task.id, "title", e.target.value)}
                      placeholder="Task title"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => update(task.id, "status", s)}
                        className={`flex-1 py-1.5 rounded-xl border-2 text-xs font-semibold transition ${
                          task.status === s
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>

                  {/* What */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">What</label>
                    <textarea
                      value={task.what}
                      onChange={(e) => update(task.id, "what", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* How */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">How</label>
                    <textarea
                      value={task.how}
                      onChange={(e) => update(task.id, "how", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Skills (comma separated)</label>
                    <input
                      value={task.skills}
                      onChange={(e) => update(task.id, "skills", e.target.value)}
                      placeholder="React, Node.js, PostgreSQL"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                /* ── VIEW MODE ── */
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => setExpandedId((p) => p === task.id ? null : task.id)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        {expandedId === task.id
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {task.title || <span className="text-gray-400 italic">Untitled task</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <StatusBadge status={task.status} />
                      <button
                        onClick={() => { setEditingId(task.id); setExpandedId(null); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === task.id && (
                    <div className="mt-3 ml-6 space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      {task.what && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">What</p>
                          <p className="text-sm text-gray-700 mt-0.5">{task.what}</p>
                        </div>
                      )}
                      {task.how && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">How</p>
                          <p className="text-sm text-gray-700 mt-0.5">{task.how}</p>
                        </div>
                      )}
                      {task.skills && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(typeof task.skills === "string"
                            ? task.skills.split(",").map((s) => s.trim()).filter(Boolean)
                            : task.skills
                          ).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/10 text-blue-900">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      {editableTasks.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            {editableTasks.length} task{editableTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}