import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../Context/useAuth";

export default function StatsCards({ projects = [] }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const allTasks = projects.flatMap((p) => p.tasks || []);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "complete").length;
  const assignedTasks = allTasks.filter((t) => t.assigned_to).length;
  const utilization = totalTasks > 0 ? Math.round((assignedTasks / totalTasks) * 100) : 0;

  // ✅ Overdue = any task marked as "delayed"
  const overdueTasks = allTasks.filter((t) => t.status === "delayed").length;

  // ✅ Team members don't see Team Utilization
  const stats = [
    { label: t("activeProjects"), value: activeProjects, dark: false },
    { label: t("totalTasks"), value: totalTasks, dark: true },
    { label: t("completedTasks"), value: completedTasks, dark: false },
    ...(isManager ? [{ label: t("teamUtilization"), value: `${utilization}%`, dark: true }] : []),
    { label: t("overdueTasks"), value: overdueTasks, dark: isManager ? false : true },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${isManager ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
      {stats.map((s) => (
        <div
          key={s.label}
          className={`min-w-0 rounded-2xl p-5 shadow ${
            s.dark
              ? "bg-linear-to-r from-blue-900 to-cyan-500 text-white"
              : "bg-white/60"
          }`}
        >
          <p className={`text-md truncate ${s.dark ? "text-blue-100" : "text-gray-500"}`}>
            {s.label}
          </p>
          <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
        </div>
      ))}
    </div>
  );
}