import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import TaskItem from "./TaskItem";

function deriveStatus(tasks) {
  if (!tasks || tasks.length === 0) return "not_started";
  const complete = tasks.filter((t) => t.status === "complete").length;
  if (complete === tasks.length) return "complete";
  if (complete > 0 || tasks.some((t) => t.status === "in_progress"))
    return "in_progress";
  return "not_started";
}

export default function ProjectCard({ project, tasks = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const progressPercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const overallStatus = deriveStatus(tasks);

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white/70 rounded-2xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">
                {project.description}
              </p>
            )}
          </div>
          <StatusBadge status={overallStatus} />
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-semibold text-gray-600">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-900 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* TASK LIST */}
      <div>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No tasks yet — upload a project spec to generate tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isExpanded={expandedId === task.id}
              onToggle={() => handleToggle(task.id)}
            />
          ))
        )}
      </div>

      {/* FOOTER */}
      {tasks.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {completedCount} of {tasks.length} tasks complete
          </span>
          <span className="text-xs text-gray-500">
            {inProgressCount} in progress
          </span>
        </div>
      )}
    </div>
  );
}
