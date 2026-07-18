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

  // ✅ 5th stat: tasks still not_started on projects that have passed their deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = projects
    .filter((p) => p.deadline && new Date(p.deadline) < today)
    .flatMap((p) => (p.tasks || []).filter((t) => t.status === "not_started"))
    .length;

  const stats = [
    { label: t("activeProjects"), value: activeProjects, dark: false },
    { label: t("totalTasks"), value: totalTasks, dark: true },
    { label: t("completedTasks"), value: completedTasks, dark: false },
    { label: t("teamUtilization"), value: `${utilization}%`, dark: true },
    {
      label: t("overdueTasks"),
      value: overdueTasks,
      dark: false,
      alert: overdueTasks > 0,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-2xl p-5 shadow ${
            s.dark
              ? "bg-linear-to-r from-blue-900 to-cyan-500 text-white"
              : s.alert
              ? "bg-red-50 border-2 border-red-200"
              : "bg-white/60"
          }`}
        >
          <p className={`text-sm ${s.dark ? "text-blue-100" : s.alert ? "text-red-500" : "text-gray-500"}`}>
            {s.label}
          </p>
          <h3 className={`text-2xl font-bold mt-1 ${s.alert ? "text-red-600" : ""}`}>
            {s.value}
          </h3>
          {s.alert && (
            <p className="text-xs text-red-400 mt-1">{t("overdueWarning")}</p>
          )}
        </div>
      ))}
    </div>
  );
}