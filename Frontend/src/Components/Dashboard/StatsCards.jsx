import React from "react";

export default function StatsCards({ projects = [] }) {
  const allTasks = projects.flatMap((p) => p.tasks || []);
  const activeProjects = projects.filter((p) => p.status !== "complete").length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "complete").length;
  const assignedTasks = allTasks.filter((t) => t.assigned_to).length;
  const utilization = totalTasks > 0 ? Math.round((assignedTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: "Active Projects", value: activeProjects },
    { label: "Total Tasks", value: totalTasks },
    { label: "Completed Tasks", value: completedTasks },
    { label: "Team Utilization", value: `${utilization}%` },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`rounded-2xl p-5 shadow ${
            i % 2 === 0
              ? "bg-white/60"
              : "bg-gradient-to-r from-blue-900 to-cyan-500 text-white"
          }`}
        >
          <p className={`text-sm ${i % 2 === 0 ? "text-gray-500" : "text-blue-100"}`}>
            {s.label}
          </p>
          <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
        </div>
      ))}
    </div>
  );
}
