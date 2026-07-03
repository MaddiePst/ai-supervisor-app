import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Components/Sidebar";
import CandidateSuggestions from "../Components/Candidate/CandidateSuggestion";
import { useAuth } from "../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export default function Candidates() {
  const { session } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hiredMap, setHiredMap] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all projects on mount
  useEffect(() => {
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, [session]);

  // ✅ Fetch roles as a callback — called imperatively from the click handler
  const fetchRoles = useCallback(
    async (projectId) => {
      setLoadingRoles(true);
      setError(null);
      try {
        const r = await fetch(`${API_BASE}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const data = await r.json();
        const projectRoles = (data.roles || []).map((role, i) => ({
          id: role.id || `role-${i}`,
          name: role.title || role.name || "Unnamed Role",
          count: role.count || role.positions || 1,
          skills: role.skills || [],
        }));
        setRoles(projectRoles);
      } catch {
        setError("Failed to load project roles");
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    },
    [session]
  );

  // ✅ All state updates happen in the click handler — no useEffect needed for roles
  const handleProjectClick = (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      setRoles([]);
      setSelectedRole(null);
      setHiredMap({});
    } else {
      setSelectedProjectId(projectId);
      setSelectedRole(null);
      setHiredMap({});
      fetchRoles(projectId);
    }
  };

  const handleRoleClick = (role) => {
    setSelectedRole((prev) => (prev?.id === role.id ? null : role));
  };

  const handleHire = (roleId, candidateId) => {
    setHiredMap((prev) => {
      const roleHires = prev[roleId] || [];
      if (roleHires.includes(candidateId)) {
        return { ...prev, [roleId]: roleHires.filter((id) => id !== candidateId) };
      }
      return { ...prev, [roleId]: [...roleHires, candidateId] };
    });
  };

  const activeStyle = "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />

      <div className="flex-1 p-6 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Project Roles & Candidates</h2>

        {/* PROJECT SELECTOR */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
            Select Project
          </p>
          {loadingProjects ? (
            <p className="text-sm text-gray-400">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">
              No projects found. Create a project first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProjectClick(p.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    selectedProjectId === p.id
                      ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow"
                      : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ROLES FOR SELECTED PROJECT */}
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
                <p className="text-sm text-gray-400">
                  No roles defined for this project yet.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload a project spec on the Add Project page to generate
                  roles automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => {
                  const isActive = selectedRole?.id === role.id;
                  const hiredCount = hiredMap[role.id]?.length || 0;
                  const remaining = role.count - hiredCount;

                  return (
                    <div
                      key={role.id}
                      onClick={() => handleRoleClick(role)}
                      className={`p-4 rounded-xl cursor-pointer transition ${
                        isActive ? activeStyle : "bg-white hover:bg-gray-100 shadow"
                      }`}
                    >
                      <h3 className="font-semibold">
                        {role.name}
                        <span className="text-sm ml-2 opacity-80">
                          ({remaining} position{remaining !== 1 ? "s" : ""} remaining)
                        </span>
                      </h3>

                      {isActive && (
                        <CandidateSuggestions
                          role={role}
                          hiredIds={hiredMap[role.id] || []}
                          onHire={handleHire}
                          projectId={selectedProjectId}
                        />
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
                  {Object.values(hiredMap).flat().length} hired
                </p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}