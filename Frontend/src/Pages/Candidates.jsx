import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import Sidebar from "../Components/Sidebar";
import { useAuth } from "../Context/useAuth";
import CandidateCard from "../Components/Candidate/CandidateCard";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");
const PAGE_SIZE = 4;

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
  const [hiring, setHiring] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMap, setSelectedMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  const fetchRoles = useCallback(async (projectId) => {
    setLoadingRoles(true);
    setError(null);
    try {
      const [projRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${API_BASE}/projects/${projectId}/members`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);
      const project = await projRes.json();
      const members = await membersRes.json();

      setRoles((project.roles || []).map((role) => ({
        id: role.id,
        name: role.title || role.name || "Unnamed Role",
        count: role.count || 1,
        skills: role.skills || [],
        hiredCount: (members || []).filter((m) => m.role_id === role.id).length,
        hiredUserIds: (members || []).filter((m) => m.role_id === role.id).map((m) => m.user_id),
        hiredMembers: (members || [])
          .filter((m) => m.role_id === role.id)
          .map((m) => ({ userId: m.user_id, name: m.profiles?.full_name || "Unknown" })),
      })));

      // ✅ Seamlessly assign roles to tasks in the background if any are unassigned
      // This fixes match % for existing projects without blocking the UI
      autoAssignRoles(projectId);
    } catch {
      setError("Failed to load project roles");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Runs silently in background — no loading state, no UI interruption
  const autoAssignRoles = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/assign-roles/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      // If tasks were updated, refresh the currently open role's candidates
      if (data.updated > 0) {
        setSelectedRole((currentRole) => {
          if (currentRole) {
            fetchCandidates(projectId, currentRole.id);
          }
          return currentRole;
        });
      }
    } catch {
      // Silent — never surface this error to the user
    }
  };

  const fetchCandidates = useCallback(async (projectId, roleId) => {
    setLoadingCandidates(true);
    try {
      const r = await fetch(
        `${API_BASE}/projects/${projectId}/candidates?role_id=${roleId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await r.json();
      setCandidates(Array.isArray(data) ? data : []);
      // Add this temporarily in Candidates.jsx inside fetchCandidates after setCandidates
console.log("candidates:", data[0]);
      setVisibleCount(PAGE_SIZE);
    } catch {
      setError("Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  const handleProjectClick = (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null); setRoles([]); setSelectedRole(null);
      setCandidates([]); setSelectedMap({});
    } else {
      setSelectedProjectId(projectId); setSelectedRole(null);
      setCandidates([]); setSelectedMap({});
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
        setSelectedProjectId(null); setRoles([]); setSelectedRole(null); setCandidates([]);
      }
    } catch {
      setError("Failed to delete project");
    }
  };

  const handleRoleClick = async (role) => {
    if (selectedRole?.id === role.id) {
      setSelectedRole(null); setCandidates([]);
      return;
    }
    setSelectedRole(role);
    setLoadingCandidates(true);

    // ✅ First ensure all tasks have role_id assigned (seamless, no UI disruption)
    // This guarantees match % is accurate before candidates are fetched
    try {
      await fetch(`${API_BASE}/tasks/assign-roles/${selectedProjectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {
      // Silent — still fetch candidates even if this fails
    }

    // Now fetch candidates — tasks have role_id so match % will be correct
    fetchCandidates(selectedProjectId, role.id);
  };

  const handleToggleSelect = (candidate) => {
    const roleId = selectedRole?.id;
    if (!roleId) return;
    setSelectedMap((prev) => {
      const current = new Set(prev[roleId] || []);
      current.has(candidate.id) ? current.delete(candidate.id) : current.add(candidate.id);
      return { ...prev, [roleId]: current };
    });
  };

  // ✅ Issue 3 fix: update state locally — no refetch, no page reload
  const handleHire = async () => {
    if (!selectedRole || !selectedProjectId) return;
    const roleId = selectedRole.id;
    const selected = Array.from(selectedMap[roleId] || []);
    if (selected.length === 0) return;

    setHiring(true);
    setError(null);

    const succeeded = [];
    const failed = [];

    await Promise.all(
      selected.map(async (userId) => {
        try {
          const r = await fetch(`${API_BASE}/projects/${selectedProjectId}/hire`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              user_id: userId,
              role_id: roleId,
              role_title: selectedRole.name,
            }),
          });
          if (!r.ok) {
            const err = await r.json();
            failed.push(err.message || "Failed to hire");
          } else {
            succeeded.push(userId);
          }
        } catch {
          failed.push("Network error");
        }
      })
    );

    if (failed.length > 0) {
      setError(`Some hires failed: ${failed.join(", ")}`);
    }

    if (succeeded.length > 0) {
      // ✅ Update candidates list locally — mark hired ones, remove from future roles
      setCandidates((prev) =>
        prev.map((c) =>
          succeeded.includes(c.id) ? { ...c, isHired: true } : c
        )
      );

      // ✅ Update role hired count + hiredUserIds locally
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          const newHiredUserIds = [...(r.hiredUserIds || []), ...succeeded];
          const newHiredMembers = [
            ...(r.hiredMembers || []),
            ...succeeded.map((uid) => {
              const c = candidates.find((c) => c.id === uid);
              return { userId: uid, name: c?.name || "Unknown" };
            }),
          ];
          return {
            ...r,
            hiredCount: newHiredUserIds.length,
            hiredUserIds: newHiredUserIds,
            hiredMembers: newHiredMembers,
          };
        })
      );

      // Also update selectedRole so Hire button uses fresh data
      setSelectedRole((prev) => ({
        ...prev,
        hiredCount: (prev.hiredCount || 0) + succeeded.length,
        hiredUserIds: [...(prev.hiredUserIds || []), ...succeeded],
      }));

      // Clear selections for this role
      setSelectedMap((prev) => ({ ...prev, [roleId]: new Set() }));
    }

    setHiring(false);
  };

  const handleFireMember = async (e, userId, roleId) => {
    e.stopPropagation();
    if (!selectedProjectId) return;
    try {
      await fetch(`${API_BASE}/projects/${selectedProjectId}/fire/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role_id: roleId }),
      });
      // Update locally
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          return {
            ...r,
            hiredCount: r.hiredCount - 1,
            hiredUserIds: r.hiredUserIds.filter((id) => id !== userId),
            hiredMembers: r.hiredMembers.filter((m) => m.userId !== userId),
          };
        })
      );
      setCandidates((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, isHired: false } : c))
      );
    } catch {
      setError("Failed to remove candidate.");
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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
                  <button onClick={() => handleProjectClick(p.id)}
                    className={`pl-4 pr-8 py-2 rounded-xl text-sm font-semibold transition ${
                      selectedProjectId === p.id
                        ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow"
                        : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                    }`}>
                    {p.name}
                  </button>
                  {isManager && (
                    <button onClick={(e) => handleDeleteProject(e, p.id)} title="Delete"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-500">
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
                  const selectedForRole = selectedMap[role.id] || new Set();
                  const pendingCount = selectedForRole.size;
                  const canSelectMore = pendingCount < remaining;
                  const visibleCandidates = candidates.slice(0, visibleCount);
                  const hasMore = visibleCount < candidates.length;
                  const isExpanded = visibleCount > PAGE_SIZE;

                  return (
                    <div key={role.id}
                      className={`rounded-xl transition ${isActive ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow-lg" : "bg-white shadow"}`}>

                      {/* Role header */}
                      <div onClick={() => handleRoleClick(role)} className="p-4 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            {role.name}
                            <span className="text-sm ml-2 opacity-80">
                              ({remaining} position{remaining !== 1 ? "s" : ""} remaining)
                            </span>
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                            {role.hiredCount}/{role.count} hired
                          </span>
                        </div>

                        {role.hiredMembers?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {role.hiredMembers.map((m) => (
                              <div key={m.userId}
                                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-green-100 text-green-800"}`}>
                                <span>{m.name}</span>
                                {isManager && (
                                  <button onClick={(e) => handleFireMember(e, m.userId, role.id)}
                                    className="hover:text-red-400 transition">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Candidates panel */}
                      {isActive && isManager && (
                        <div className="px-4 pb-4">
                          {loadingCandidates ? (
                            <p className="text-sm text-white/70 animate-pulse">Loading candidates...</p>
                          ) : candidates.length === 0 ? (
                            <p className="text-sm text-white/70">No available team members found.</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                {visibleCandidates.map((c) => (
                                  <CandidateCard
                                    key={c.id}
                                    candidate={c}
                                    isSelected={selectedForRole.has(c.id)}
                                    isHired={c.isHired}
                                    canSelect={canSelectMore || selectedForRole.has(c.id)}
                                    onToggle={handleToggleSelect}
                                  />
                                ))}
                              </div>

                              {/* Show more / Show less */}
                              {(hasMore || isExpanded) && (
                                <div className="mt-3 text-center">
                                  <button
                                    onClick={() => isExpanded
                                      ? setVisibleCount(PAGE_SIZE)
                                      : setVisibleCount((prev) => prev + PAGE_SIZE)
                                    }
                                    className="flex items-center gap-1.5 mx-auto text-xs text-white/80 hover:text-white transition font-semibold">
                                    {isExpanded
                                      ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                                      : <><ChevronDown className="w-4 h-4" /> Show More ({candidates.length - visibleCount} more)</>
                                    }
                                  </button>
                                </div>
                              )}

                              {/* Hire button */}
                              {pendingCount > 0 && (
                                <div className="mt-4 flex justify-end">
                                  <button onClick={handleHire} disabled={hiring}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 rounded-xl font-bold text-sm shadow hover:bg-cyan-50 transition disabled:opacity-50">
                                    <UserCheck className="w-4 h-4" />
                                    {hiring ? "Hiring..." : `Hire ${pendingCount} candidate${pendingCount !== 1 ? "s" : ""}`}
                                  </button>
                                </div>
                              )}
                            </>
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
          <div className="mt-4 px-4 py-3 bg-red-100 rounded-xl text-red-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline ml-2">dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}