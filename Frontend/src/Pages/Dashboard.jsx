import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import StatsCards from "../Components/Dashboard/StatsCards";
import DonutChart from "../Components/Dashboard/DonutChart";
import DeadlineCalendar from "../Components/Dashboard/DeadlineCalendar";
import ProjectList from "../Components/Dashboard/ProjectList";
import { useAuth } from "../Context/useAuth";

const API_BASE = import.meta.env.VITE_API + "/api";

export default function Dashboard() {
  const { session } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [session]);

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

        <div className="flex gap-6 h-[700px]">
          <div className="w-2/5 h-full overflow-y-auto pr-1">
            <ProjectList
              projects={projects}
              selectedId={selectedProject?.id}
              onSelect={setSelectedProject}
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
