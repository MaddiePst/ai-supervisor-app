import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#FDD835", "#f97316", "#ef4444", "#10b981", "#f43f5e"];

// ── Build role data from tasks ────────────────────────────────────────────────
// For each role: count completed tasks vs total tasks assigned to that role
function buildRoleData(tasks, roles = []) {
  const roleMap = {};

  // Seed from known roles (so roles with 0 tasks still appear)
  roles.forEach((r) => {
    const key = r.id || r.title;
    roleMap[key] = { name: r.title || r.name || "Unknown", total: 0, completed: 0 };
  });

  // Count tasks per role
  tasks.forEach((t) => {
    const key = t.role_id || t.role_title || "unassigned";
    const label = t.role_title || "Unassigned";
    if (!roleMap[key]) roleMap[key] = { name: label, total: 0, completed: 0 };
    roleMap[key].total += 1;
    if (t.status === "complete") roleMap[key].completed += 1;
  });

  return Object.values(roleMap)
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((r) => ({
      ...r,
      // Chart value = completed tasks (so chart fills based on work done)
      value: r.completed > 0 ? r.completed : r.total,
      pct: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
    }));
}

// ── Project completion: % of tasks marked complete out of total tasks
function calcCompletion(tasks) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "complete").length;
  return Math.round((done / tasks.length) * 100);
}

export default function DonutChart({ project, projects = [] }) {
  const { t } = useTranslation();

  const tasks = useMemo(
    () => project ? project.tasks || [] : projects.flatMap((p) => p.tasks || []),
    [project, projects]
  );

  const roles = useMemo(
    () => project ? project.roles || [] : projects.flatMap((p) => p.roles || []),
    [project, projects]
  );

  const data = useMemo(() => buildRoleData(tasks, roles), [tasks, roles]);
  const completion = useMemo(() => calcCompletion(tasks), [tasks]);

  // Usage color
  const completionColor =
    completion >= 70 ? "text-green-600" :
    completion >= 40 ? "text-yellow-500" :
    "text-red-500";

  return (
    <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-0.5">
        {project ? `${project.name} — ${t("rolesBreakdown")}` : t("rolesBreakdown")}
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {project ? t("rolesThisProject") : t("rolesAllProjects")}
      </p>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t("noRoleData")}</p>
      ) : (
        <div className="grid grid-cols-2 items-center">
          {/* Donut chart */}
          <div className="min-w-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${props.payload.completed}/${props.payload.total} tasks`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right panel */}
          <div className="pl-2 pr-4 min-w-0">
            {/* Completion stat */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                {project ? t("projectCompletion") : t("overallCompletion")}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${completionColor}`}>{completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    completion >= 70 ? "bg-green-500" :
                    completion >= 40 ? "bg-yellow-400" :
                    "bg-red-400"
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {tasks.filter(t => t.status === "complete").length}/{tasks.length} {t("tasksComplete")}
              </p>
            </div>

            {/* Role list */}
            <div className="space-y-2">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 truncate font-medium">{entry.name}</span>
                      <span className="text-xs text-gray-400 ml-1 shrink-0">
                        {entry.completed}/{entry.total}
                      </span>
                    </div>
                    {/* Per-role progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${entry.pct}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 shrink-0 w-7 text-right">
                    {entry.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}