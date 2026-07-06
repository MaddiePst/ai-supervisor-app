import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import Sidebar from "../Components/Sidebar";
import { useAuth } from "../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function Candidates() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState(null);

  // Fetch projects on mount
  useEffect(() => {
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Fetch roles + hired members when project selected
  const fetchRoles = useCallback(async (projectId) => {
    setLoadingRoles(true);
    setError(null);
    try {
      // Get project roles
      const r = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      const projectRoles = (data.roles || []).map((role) => ({
        id: role.id,
        name: role.title || role.name || "Unnamed Role",
        count: role.count || 1,
        skills: role.skills || [],
      }));

      // Get hired members
      const mr = await fetch(`${API_BASE}/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const members = await mr.json();

      // Attach hired count to each role
      const rolesWithHired = projectRoles.map((role) => ({
        ...role,
        hiredCount: (members || []).filter((m) => m.role_id === role.id).length,
        hiredMembers: (members || [])
          .filter((m) => m.role_id === role.id)
          .map((m) => ({
            memberId: m.id,
            userId: m.user_id,
            name: m.profiles?.full_name || "Unknown",
            email: m.profiles?.email || "",
          })),
      }));

      setRoles(rolesWithHired);
    } catch {
      setError("Failed to load project roles");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Fetch candidates for a role
  const fetchCandidates = useCallback(async (projectId, roleId) => {
    setLoadingCandidates(true);
    try {
      const r = await fetch(
        `${API_BASE}/projects/${projectId}/candidates?role_id=${roleId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await r.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  const handleProjectClick = (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      setRoles([]);
      setSelectedRole(null);
      setCandidates([]);
    } else {
      setSelectedProjectId(projectId);
      setSelectedRole(null);
      setCandidates([]);
      fetchRoles(projectId);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setRoles([]);
        setSelectedRole(null);
        setCandidates([]);
      }
    } catch {
      setError("Failed to delete project");
    }
  };

  const handleRoleClick = (role) => {
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setCandidates([]);
    } else {
      setSelectedRole(role);
      fetchCandidates(selectedProjectId, role.id);
    }
  };

  const handleHire = async (candidate) => {
    if (!selectedRole || !selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/hire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          user_id: candidate.id,
          role_id: selectedRole.id,
          role_title: selectedRole.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to hire candidate.");
        return;
      }

      // Refresh roles and candidates
      await fetchRoles(selectedProjectId);
      await fetchCandidates(selectedProjectId, selectedRole.id);
    } catch {
      setError("Failed to hire candidate.");
    }
  };

  const handleFire = async (userId, roleId) => {
    if (!selectedProjectId) return;
    try {
      await fetch(`${API_BASE}/projects/${selectedProjectId}/fire/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ role_id: roleId }),
      });
      await fetchRoles(selectedProjectId);
      if (selectedRole?.id === roleId) {
        await fetchCandidates(selectedProjectId, roleId);
      }
    } catch {
      setError("Failed to remove candidate.");
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const activeStyle = "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Project Roles & Candidates</h2>

        {/* PROJECT SELECTOR */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Select Project</p>
          {loadingProjects ? (
            <p className="text-sm text-gray-400">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">No projects found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <div key={p.id} className="relative group">
                  <button
                    onClick={() => handleProjectClick(p.id)}
                    className={`pl-4 pr-8 py-2 rounded-xl text-sm font-semibold transition ${
                      selectedProjectId === p.id
                        ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow"
                        : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                    }`}
                  >
                    {p.name}
                  </button>
                  {isManager && (
                    <button
                      onClick={(e) => handleDeleteProject(e, p.id)}
                      title="Delete"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROLES */}
        {selectedProjectId && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                Roles — {selectedProject?.name}
              </p>
              <p className="text-xs text-gray-400">Click a role to see candidates</p>
            </div>

            {loadingRoles ? (
              <p className="text-sm text-gray-400">Loading roles...</p>
            ) : roles.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow">
                <p className="text-sm text-gray-400">No roles defined for this project yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => {
                  const isActive = selectedRole?.id === role.id;
                  const remaining = role.count - role.hiredCount;

                  return (
                    <div key={role.id} className={`rounded-xl transition ${isActive ? activeStyle : "bg-white shadow"}`}>
                      {/* Role header */}
                      <div
                        onClick={() => handleRoleClick(role)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            {role.name}
                            <span className="text-sm ml-2 opacity-80">
                              ({remaining} position{remaining !== 1 ? "s" : ""} remaining)
                            </span>
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                            {role.hiredCount}/{role.count} hired
                          </span>
                        </div>

                        {/* Hired members */}
                        {role.hiredMembers?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {role.hiredMembers.map((m) => (
                              <div key={m.userId}
                                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                                  isActive ? "bg-white/20 text-white" : "bg-green-100 text-green-800"
                                }`}>
                                <span>{m.name}</span>
                                {isManager && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleFire(m.userId, role.id); }}
                                    className="hover:text-red-400 transition"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Candidates list */}
                      {isActive && isManager && (
                        <div className="px-4 pb-4">
                          {loadingCandidates ? (
                            <p className="text-sm text-white/70 animate-pulse">Loading candidates...</p>
                          ) : candidates.length === 0 ? (
                            <p className="text-sm text-white/70">No team members found.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              {candidates.map((c) => (
                                <div key={c.id}
                                  className={`p-3 rounded-xl ${c.isHired ? "bg-cyan-50 border border-cyan-300" : "bg-white/90"}`}>
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-800 text-sm truncate">{c.name}</p>
                                      {c.headline && <p className="text-xs text-gray-400 truncate">{c.headline}</p>}
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        c.match >= 70 ? "bg-green-100 text-green-700"
                                        : c.match >= 40 ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-500"
                                      }`}>
                                        {c.match}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {(c.skills || []).slice(0, 3).map((s) => (
                                      <span key={s} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] rounded font-medium">
                                        {s}
                                      </span>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => c.isHired ? handleFire(c.id, role.id) : handleHire(c)}
                                    disabled={!c.isHired && remaining <= 0}
                                    className={`mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition ${
                                      c.isHired
                                        ? "border border-red-300 text-red-600 hover:bg-red-50"
                                        : remaining > 0
                                          ? "border border-cyan-700 text-cyan-800 hover:bg-cyan-50"
                                          : "border border-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                  >
                                    {c.isHired ? "Remove" : remaining > 0 ? "Hire" : "Full"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {roles.length > 0 && (
              <div className="mt-4 bg-white rounded-xl px-5 py-3 shadow flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {roles.length} role{roles.length !== 1 ? "s" : ""} ·{" "}
                  {roles.reduce((s, r) => s + r.count, 0)} total positions
                </p>
                <p className="text-sm text-gray-500">
                  {roles.reduce((s, r) => s + r.hiredCount, 0)} hired
                </p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-100 rounded-xl text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}