import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import ProjectCard from "../../Components/Project/ProjectCard";
import ProjectChat from "../../Components/Project/ProjectChat";
import TaskDrawer from "../../Components/Project/TaskDrawer";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API + "/api";

export default function ProjectView() {
  const { id } = useParams();
  const { session } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchProject() {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      setProject(data);
      setTasks(data.tasks || []);
    } catch (err) {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#c5c7ca] flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#c5c7ca] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex gap-4 p-6 min-h-0">

        {/* LEFT — PROJECT CARD */}
        <div className="flex-1 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">
            {project?.name}
          </h1>
          <ProjectCard
            project={project}
            tasks={tasks}
            editable
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </div>

        {/* RIGHT — CHAT */}
        <div className="w-1/3 min-w-[300px] flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
          <ProjectChat projectId={id} />
        </div>

      </div>

      {/* TASK DRAWER */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={fetchProject}
        />
      )}
    </div>
  );
}