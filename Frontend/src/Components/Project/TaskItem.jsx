import React from "react";
import { ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function TaskItem({ task, isExpanded, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <span className="text-sm font-medium text-gray-800">
            {task.title}
          </span>
        </div>
        <StatusBadge status={task.status} />
      </button>

      {isExpanded && (
        <div className="bg-gray-50 rounded-[10px] border border-gray-100 p-3 mt-1 mx-4 mb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            What
          </p>
          <p className="text-sm text-gray-700 mb-3">{task.what}</p>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            How
          </p>
          <p className="text-sm text-gray-700 mb-3">{task.how}</p>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Skills Required
          </p>
          <div className="flex flex-wrap gap-1.5">
            {task.skills?.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/10 text-blue-900"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
