import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import ProjectCard from "./ProjectCard";
import ProjectChat from "./ProjectChat";
import TaskDrawer from "./TaskDrawer";
import RolesEditor from "./RolesEditor";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function ProjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoleIds, setUserRoleIds] = useState([]); // roles this user is hired into
  const [selectedTask, setSelectedTask] = useState(null);
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
      setRoles(data.roles || []);
    } catch {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch which roles this user is hired into (for team members)
  const fetchUserMembership = useCallback(async () => {
    if (isManager) return; // managers can update all tasks
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/members`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const members = await res.json();
      const myRoles = (members || [])
        .filter((m) => m.user_id === user?.id)
        .map((m) => m.role_id);
      setUserRoleIds(myRoles);
    } catch {
      console.error("Failed to fetch membership");
    }
  }, [id, isManager, user?.id]);

  useEffect(() => {
    fetchProject();
    fetchUserMembership();
  }, [fetchProject, fetchUserMembership]);

  // ✅ Status update — enforced on backend too, but also gated in UI
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Status update failed:", err.message);
        return;
      }

      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Status update error:", err.message);
    }
  };

  const handleSaveRoles = async (updatedRoles) => {
    try {
      await fetch(`${API_BASE}/projects/${id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
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
        <div className="flex-1 overflow-y-auto space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{project?.name}</h1>

          <ProjectCard
            project={project}
            tasks={tasks}
            editable={isManager}
            onTaskClick={isManager ? (task) => setSelectedTask(task) : undefined}
            isManager={isManager}
            userRoleIds={userRoleIds}
            onStatusChange={handleStatusChange}
          />

          {/* Roles only editable by managers */}
          <RolesEditor
            roles={roles}
            onSave={handleSaveRoles}
            readOnly={!isManager}
          />
        </div>

        <div className="w-1/3 min-w-75 flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
          <ProjectChat projectId={id} />
        </div>
      </div>

      {selectedTask && isManager && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={fetchProject}
        />
      )}
    </div>
  );
}