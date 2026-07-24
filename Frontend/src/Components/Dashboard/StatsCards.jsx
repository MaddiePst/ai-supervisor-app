import React from "react";
import { useTranslation } from "react-i18next";

export default function StatsCards({ projects = [] }) {
  const { t } = useTranslation();

  const allTasks = projects.flatMap((p) => p.tasks || []);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "complete").length;
  const assignedTasks = allTasks.filter((t) => t.assigned_to).length;
  const utilization = totalTasks > 0 ? Math.round((assignedTasks / totalTasks) * 100) : 0;

  // ✅ 5th stat: tasks marked as delayed
const overdueTasks = allTasks.filter((t) => t.status === "delayed").length;

  const stats = [
    { label: t("activeProjects"), value: activeProjects, dark: false },
    { label: t("totalTasks"), value: totalTasks, dark: true },
    { label: t("completedTasks"), value: completedTasks, dark: false },
    { label: t("teamUtilization"), value: `${utilization}%`, dark: true },
    { label: t("overdueTasks"), value: overdueTasks, dark: false },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-2xl p-5 shadow ${
            s.dark
              ? "bg-linear-to-r from-blue-900 to-cyan-500 text-white"
              : "bg-white/60"
          }`}
        >
          <p className={`text-md ${s.dark ? "text-blue-100" : "text-gray-500"}`}>
            {s.label}
          </p>
          <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
        </div>
      ))}
    </div>
  );
}