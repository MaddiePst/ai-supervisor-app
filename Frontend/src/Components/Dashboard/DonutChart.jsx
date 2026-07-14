import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#FDD835", "#f97316", "#ef4444"];

function buildSkillData(tasks) {
  const counts = {};
  tasks.forEach((t) => {
    (t.skills || []).forEach((skill) => {
      counts[skill] = (counts[skill] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export default function DonutChart({ project, projects = [] }) {
  const { t } = useTranslation();

  const tasks = project
    ? project.tasks || []
    : projects.flatMap((p) => p.tasks || []);

  const data = useMemo(() => buildSkillData(tasks), [tasks]);

  return (
    <div className="bg-white/60 backdrop-blur-md p-4 pr-0 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-1">
        {project ? `${project.name} — ${t("skillsProject")}` : t("skillsBreakdown")}
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {project ? t("skillsThisProject") : t("skillsAllProjects")}
      </p>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t("noSkillData")}</p>
      ) : (
        <div className="grid grid-cols-2">
          <PieChart width={250} height={200}>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
              paddingAngle={3} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          <div className="text-center">
            <p className="text-gray-800 text-sm">{t("topSkills")}</p>
            <p className="text-2xl font-bold text-green-600">{data.length}</p>
            {data.map((entry, index) => (
              <div className="ml-10 m-2 flex items-center gap-2" key={entry.name}>
                <span className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm">{entry.name} — {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}