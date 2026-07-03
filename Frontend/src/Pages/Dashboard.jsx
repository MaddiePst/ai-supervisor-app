import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import StatsCards from "../Components/Dashboard/StatsCards";
import DonutChart from "../Components/Dashboard/DonutChart";
import DeadlineCalendar from "../Components/Dashboard/DeadlineCalendar";
import ProjectList from "../Components/Dashboard/ProjectList";

// ✅ Fixed: VITE_API_URL matches .env, removed session dependency
const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function Dashboard() {
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (projectId) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      // Remove from state and clear selection if it was selected
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    } catch {
      console.error("Failed to delete project");
    }
  };

  const deadlineEvents = projects
    .filter((p) => p.deadline)
    .map((p) => ({
      title: p.name,
      start: new Date(p.deadline),
      end: new Date(p.deadline),
    }));

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 gap-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          AI Supervisor Assistant
        </h1>

        <StatsCards projects={projects} />

        <div className="flex gap-6 h-175">
          <div className="w-2/5 h-full overflow-y-auto pr-1">
            <ProjectList
              projects={projects}
              selectedId={selectedProject?.id}
              onSelect={setSelectedProject}
              onDelete={handleDelete}
            />
          </div>

          <div className="flex-1 h-full flex flex-col gap-6">
            <DonutChart project={selectedProject} projects={projects} />
            <DeadlineCalendar events={deadlineEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}