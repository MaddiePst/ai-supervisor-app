import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import ProjectCard from "./ProjectCard";
import ProjectChat from "./ProjectChat";
import TaskDrawer from "./TaskDrawer";
import RolesEditor from "./RolesEditor";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export default function ProjectView() {
  const { id } = useParams();
  const { session } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ useCallback so fetchProject is stable — safe to include in useEffect deps
  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      setProject(data);
      setTasks(data.tasks || []);
      setRoles(data.roles || []);
    } catch {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  // ✅ fetchProject is now stable so including it in deps is safe
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSaveRoles = async (updatedRoles) => {
    try {
      await fetch(`${API_BASE}/projects/${id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ roles: updatedRoles }),
      });
      setRoles(updatedRoles);
    } catch {
      console.error("Failed to save roles");
    }
  };

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

      <div className="flex-1 flex gap-4 p-6 min-h-0">
        {/* LEFT — PROJECT CARD + ROLES */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {project?.name}
          </h1>

          <ProjectCard
            project={project}
            tasks={tasks}
            editable
            onTaskClick={(task) => setSelectedTask(task)}
          />

          <RolesEditor
            roles={roles}
            onSave={handleSaveRoles}
          />
        </div>

        {/* RIGHT — CHAT */}
        <div
          className="w-1/3 min-w-75 flex flex-col"
          style={{ height: "calc(100vh - 48px)" }}
        >
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