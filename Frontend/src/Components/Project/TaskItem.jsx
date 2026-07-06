import React from "react";
import { ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS = ["not_started", "in_progress", "complete"];

export default function TaskItem({ task, isExpanded, onToggle, canUpdateStatus, onStatusChange }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-800 block truncate">{task.title}</span>
            {task.role_title && (
              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                {task.role_title}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={task.status} />
      </button>

      {isExpanded && (
        <div className="bg-gray-50 rounded-[10px] border border-gray-100 p-3 mt-1 mx-4 mb-3 space-y-3">
          {task.what && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">What</p>
              <p className="text-sm text-gray-700">{task.what}</p>
            </div>
          )}
          {task.how && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">How</p>
              <p className="text-sm text-gray-700">{task.how}</p>
            </div>
          )}
          {task.skills?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Skills Required</p>
              <div className="flex flex-wrap gap-1.5">
                {task.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/10 text-blue-900">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Status update — only shown to users who can update this task */}
          {canUpdateStatus && onStatusChange && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Update Status</p>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(task.id, s)}
                    className={`flex-1 py-1.5 rounded-xl border-2 text-xs font-semibold transition ${
                      task.status === s ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <StatusBadge status={s} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}