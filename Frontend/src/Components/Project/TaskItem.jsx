import React, { useState, useEffect } from "react";
import { ChevronRight, User, Check, X, Pencil } from "lucide-react";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", dot: "bg-gray-400",   active: "border-gray-500 bg-gray-50 text-gray-700",    idle: "border-gray-200 text-gray-500 hover:border-gray-400" },
  { value: "in_progress", label: "In Progress", dot: "bg-yellow-400", active: "border-yellow-500 bg-yellow-50 text-yellow-700", idle: "border-yellow-200 text-yellow-600 hover:border-yellow-400" },
  { value: "delayed",     label: "Delayed",     dot: "bg-red-400",    active: "border-red-500 bg-red-50 text-red-700",          idle: "border-red-200 text-red-500 hover:border-red-400" },
  { value: "complete",    label: "Completed",   dot: "bg-green-500",  active: "border-green-500 bg-green-50 text-green-700",    idle: "border-green-200 text-green-600 hover:border-green-400" },
];

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

// Inline editable text field
function EditableField({ label, value, canEdit, onSave, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value || ""); setEditing(false); };

  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition">
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          {multiline ? (
            <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)}
              className="w-full border border-blue-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none" />
          ) : (
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
              className="w-full border border-blue-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500" />
          )}
          <div className="flex gap-1.5">
            <button onClick={commit} className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition">
              <Check className="w-2.5 h-2.5" /> Save
            </button>
            <button onClick={cancel} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition">
              <X className="w-2.5 h-2.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{value || <span className="text-gray-300 italic">Not specified</span>}</p>
      )}
    </div>
  );
}

export default function TaskItem({ task, isExpanded, onToggle, canUpdateStatus, onStatusChange, onTaskFieldUpdate, projectId, isManager }) {
  const [assignees, setAssignees] = useState([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  useEffect(() => { setLocalTask(task); }, [task]);

  useEffect(() => {
    if (!isExpanded || !task.role_id || !projectId || !isManager) return;
    setLoadingAssignees(true);
    fetch(`${API_BASE}/projects/${projectId}/members`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((members) => setAssignees((members || []).filter((m) => m.role_id === task.role_id)))
      .catch(console.error)
      .finally(() => setLoadingAssignees(false));
  }, [isExpanded, task.role_id, projectId, isManager]);

  const handleAssign = async (userId) => {
    setAssigning(true);
    try {
      await fetch(`${API_BASE}/tasks/${task.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ assigned_to: userId }),
      });
      setLocalTask((t) => ({ ...t, assigned_to: userId }));
    } catch (err) { console.error("Assign failed:", err); }
    finally { setAssigning(false); }
  };

  const handleFieldSave = (field, value) => {
    setLocalTask((t) => ({ ...t, [field]: value }));
    if (onTaskFieldUpdate) onTaskFieldUpdate(task.id, field, value);
  };

  // Can this user edit what/how?
  const canEditFields = isManager || (canUpdateStatus && task.role_id);

  return (
    <div>
      {/* Header row */}
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-800 block truncate">{localTask.title}</span>
            {localTask.role_title && (
              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{localTask.role_title}</span>
            )}
          </div>
        </div>
        <StatusBadge status={localTask.status} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mt-1 mx-4 mb-3 space-y-4">

          {/* What */}
          <EditableField
            label="What"
            value={localTask.what}
            canEdit={canEditFields}
            onSave={(v) => handleFieldSave("what", v)}
            multiline
          />

          {/* How */}
          <EditableField
            label="How"
            value={localTask.how}
            canEdit={canEditFields}
            onSave={(v) => handleFieldSave("how", v)}
            multiline
          />

          {/* Skills */}
          {localTask.skills?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Skills Required</p>
              <div className="flex flex-wrap gap-1.5">
                {localTask.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/10 text-blue-900">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Progress — 4 options */}
          {canUpdateStatus && onStatusChange && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Progress</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = localTask.status === opt.value;
                  return (
                    <button key={opt.value}
                      onClick={() => { onStatusChange(task.id, opt.value); setLocalTask((t) => ({ ...t, status: opt.value })); }}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition flex items-center gap-2 ${isActive ? opt.active : opt.idle}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                      {opt.label}
                      {isActive && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assign to — manager only, role-filtered */}
          {isManager && task.role_id && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> Assign To
                {task.role_title && <span className="font-normal text-gray-300 ml-1">· {task.role_title} only</span>}
              </p>
              {loadingAssignees ? (
                <p className="text-xs text-gray-400 animate-pulse">Loading members...</p>
              ) : assignees.length === 0 ? (
                <p className="text-xs text-gray-400">No members hired for this role yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignees.map((m) => {
                    const isAssigned = localTask.assigned_to === m.user_id;
                    return (
                      <button key={m.user_id} disabled={assigning}
                        onClick={() => handleAssign(isAssigned ? null : m.user_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition ${
                          isAssigned ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        }`}>
                        {m.profiles?.avatar_url ? (
                          <img src={m.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0">
                            <span className="text-white text-[8px] font-bold">
                              {(m.profiles?.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        )}
                        {m.profiles?.full_name || "Unknown"}
                        {isAssigned && <Check className="w-3 h-3 text-blue-500 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}