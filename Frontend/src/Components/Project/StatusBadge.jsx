import React from "react";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
  in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  complete:    { label: "Complete",    bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </span>
  );
}