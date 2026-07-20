import React from "react";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", classes: "bg-gray-100 text-gray-500" },
  in_progress:  { label: "In Progress", classes: "bg-yellow-100 text-yellow-700" },
  delayed:      { label: "Delayed",     classes: "bg-red-100 text-red-600" },
  complete:     { label: "Complete",    classes: "bg-green-100 text-green-700" },
  // project-level statuses
  active:       { label: "Active",      classes: "bg-blue-100 text-blue-700" },
  archived:     { label: "Archived",    classes: "bg-gray-100 text-gray-400" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${config.classes}`}>
      {config.label}
    </span>
  );
}