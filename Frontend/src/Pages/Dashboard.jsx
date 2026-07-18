import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../Components/Sidebar";
import StatsCards from "../Components/Dashboard/StatsCards";
import DonutChart from "../Components/Dashboard/DonutChart";
import DeadlineCalendar from "../Components/Dashboard/DeadlineCalendar";
import ProjectList from "../Components/Dashboard/ProjectList";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = () => {
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (projectId) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    } catch {
      console.error("Failed to delete project");
    }
  };

  return (
    <div key={i18n.language} className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 gap-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {t("dashboardTitle")}
        </h1>

        <StatsCards projects={projects} />

        <div className="flex gap-6">
          {/* Left: Project List */}
          <div className="w-2/5 overflow-y-auto pr-1 max-h-[600px]">
            <ProjectList
              projects={projects}
              selectedId={selectedProject?.id}
              onSelect={setSelectedProject}
              onDelete={handleDelete}
            />
          </div>

          {/* Right: Charts + Calendar */}
          <div className="flex-1 flex flex-col gap-6">
            <DonutChart project={selectedProject} projects={projects} />
            {/* ✅ Pass projects so calendar modal can link events to projects */}
            <DeadlineCalendar projects={projects} />
          </div>
        </div>
      </div>
    </div>
  );
}