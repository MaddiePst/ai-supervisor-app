import { ArrowRight, X } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StatusBadge from "../Project/StatusBadge";

function getProgress(tasks = []) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === "complete").length / tasks.length) * 100);
}

export default function ProjectList({ projects = [], selectedId, onSelect, onDelete }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-gray-900">{t("projectsHeading")}</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-400">{t("noProjects")}</p>
      ) : (
        projects.map((p) => {
          const tasks = p.tasks || [];
          const progress = getProgress(tasks);
          const tasksLeft = tasks.filter((task) => task.status !== "complete").length;
          const isSelected = p.id === selectedId;

          return (
            <div key={p.id} onClick={() => onSelect(isSelected ? null : p)}
              className={`relative group bg-white/70 rounded-2xl p-4 shadow cursor-pointer transition border-2 ${
                isSelected ? "border-blue-500" : "border-transparent hover:border-gray-200"
              }`}>
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  title={t("delete")}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-500 z-10">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 pr-6">
                  <span className="font-semibold text-gray-900 text-sm truncate">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                  className="text-blue-800 hover:text-cyan-600 transition ml-2 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div className="bg-linear-to-r from-blue-900 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{progress}% {t("complete")}</span>
                <span>·</span>
                <span>{tasksLeft} {t("left")}</span>
                <span>·</span>
                <span>{tasks.length} {t("total")}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}