import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import ProjectCard from "./ProjectCard";
import ProjectChat from "./ProjectChat";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function ProjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userRoleIds, setUserRoleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      setProject(data);
      setTasks(data.tasks || []);
    } catch {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserMembership = useCallback(async () => {
    if (isManager) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/members`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const members = await res.json();
      setUserRoleIds(
        (members || []).filter((m) => m.user_id === user?.id).map((m) => m.role_id)
      );
    } catch { /* silent */ }
  }, [id, isManager, user?.id]);

  React.useEffect(() => {
    fetchProject();
    fetchUserMembership();
  }, [fetchProject, fetchUserMembership]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) { console.error(err); }
  };

  const handleTaskFieldUpdate = async (taskId, field, value) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ [field]: value }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)));
    } catch (err) { console.error(err); }
  };

  const handleTasksUpdated = useCallback((updates) => {
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((x) => x.task_id === t.id);
        if (!u) return t;
        return { ...t, ...(u.status && { status: u.status }), ...(u.what && { what: u.what }), ...(u.how && { how: u.how }) };
      })
    );
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#c5c7ca] flex items-center justify-center">
      <p className="text-gray-500">Loading project...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-[#c5c7ca] flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    /* ✅ Full viewport height, no overflow on root */
    <div className="h-screen bg-[#c5c7ca] text-gray-800 flex overflow-hidden">
      <Sidebar />

      {/* Content area — fixed height, flex row */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">

        {/* Left — scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{project?.name}</h1>
          <ProjectCard
            project={project}
            tasks={tasks}
            isManager={isManager}
            userRoleIds={userRoleIds}
            onStatusChange={handleStatusChange}
            onTaskFieldUpdate={handleTaskFieldUpdate}
            projectId={id}
          />
        </div>

        {/* ✅ Right — chat fills full height of flex container, never scrolls */}
        <div className="w-80 shrink-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/30">
          {/* Gradient header */}
          <div className="bg-linear-to-r from-blue-900 to-cyan-500 px-4 py-3 shrink-0">
            <h3 className="text-white font-bold text-sm tracking-wide">💬 Project Chat</h3>
            <p className="text-blue-100 text-xs mt-0.5 truncate">{project?.name}</p>
          </div>
          {/* Chat fills remaining height */}
          <div className="flex-1 min-h-0 bg-white overflow-hidden">
            <ProjectChat projectId={id} onTasksUpdated={handleTasksUpdated} />
          </div>
        </div>

      </div>
    </div>
  );
}