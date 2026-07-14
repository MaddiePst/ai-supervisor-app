import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "../Components/Sidebar";
import CandidateCard from "../Components/Candidate/CandidateCard";
import { useAuth } from "../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");
const PAGE_SIZE = 4;

export default function Candidates() {
  const { t } = useTranslation();
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
    fetch(`${API_BASE}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  const fetchRoles = useCallback(async (projectId) => {
    setLoadingRoles(true); setError(null);
    try {
      const [projRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${projectId}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_BASE}/projects/${projectId}/members`, { headers: { Authorization: `Bearer ${getToken()}` } }),
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
        hiredMembers: (members || []).filter((m) => m.role_id === role.id)
          .map((m) => ({ userId: m.user_id, name: m.profiles?.full_name || "Unknown" })),
      })));
      autoAssignRoles(projectId);
    } catch { setError("Failed to load project roles"); }
    finally { setLoadingRoles(false); }
  }, []);

  const autoAssignRoles = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/assign-roles/${projectId}`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.updated > 0) {
        setSelectedRole((currentRole) => {
          if (currentRole) fetchCandidates(projectId, currentRole.id);
          return currentRole;
        });
      }
    } catch { /* silent */ }
  };

  const fetchCandidates = useCallback(async (projectId, roleId) => {
    setLoadingCandidates(true);
    try {
      // First ensure role assignments are up to date
      await fetch(`${API_BASE}/tasks/assign-roles/${projectId}`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` },
      }).catch(() => {});

      const r = await fetch(`${API_BASE}/projects/${projectId}/candidates?role_id=${roleId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await r.json();
      setCandidates(Array.isArray(data) ? data : []);
      setVisibleCount(PAGE_SIZE);
    } catch { setError("Failed to load candidates"); }
    finally { setLoadingCandidates(false); }
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
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) { setSelectedProjectId(null); setRoles([]); setSelectedRole(null); setCandidates([]); }
    } catch { setError("Failed to delete project"); }
  };

  const handleRoleClick = async (role) => {
    if (selectedRole?.id === role.id) { setSelectedRole(null); setCandidates([]); return; }
    setSelectedRole(role);
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

  const handleHire = async () => {
    if (!selectedRole || !selectedProjectId) return;
    const roleId = selectedRole.id;
    const selected = Array.from(selectedMap[roleId] || []);
    if (selected.length === 0) return;

    setHiring(true); setError(null);
    const succeeded = []; const failed = [];

    await Promise.all(selected.map(async (userId) => {
      try {
        const r = await fetch(`${API_BASE}/projects/${selectedProjectId}/hire`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ user_id: userId, role_id: roleId, role_title: selectedRole.name }),
        });
        if (!r.ok) { const err = await r.json(); failed.push(err.message || "Failed"); }
        else succeeded.push(userId);
      } catch { failed.push("Network error"); }
    }));

    if (failed.length > 0) setError(`Some hires failed: ${failed.join(", ")}`);

    if (succeeded.length > 0) {
      setCandidates((prev) => prev.map((c) => succeeded.includes(c.id) ? { ...c, isHired: true } : c));
      setRoles((prev) => prev.map((r) => {
        if (r.id !== roleId) return r;
        const newHiredUserIds = [...(r.hiredUserIds || []), ...succeeded];
        const newHiredMembers = [...(r.hiredMembers || []),
          ...succeeded.map((uid) => { const c = candidates.find((c) => c.id === uid); return { userId: uid, name: c?.name || "Unknown" }; })];
        return { ...r, hiredCount: newHiredUserIds.length, hiredUserIds: newHiredUserIds, hiredMembers: newHiredMembers };
      }));
      setSelectedRole((prev) => ({ ...prev, hiredCount: (prev.hiredCount || 0) + succeeded.length, hiredUserIds: [...(prev.hiredUserIds || []), ...succeeded] }));
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
      setRoles((prev) => prev.map((r) => r.id !== roleId ? r : {
        ...r,
        hiredCount: r.hiredCount - 1,
        hiredUserIds: r.hiredUserIds.filter((id) => id !== userId),
        hiredMembers: r.hiredMembers.filter((m) => m.userId !== userId),
      }));
      setCandidates((prev) => prev.map((c) => (c.id === userId ? { ...c, isHired: false } : c)));
    } catch { setError("Failed to remove candidate."); }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">{t("candidatesTitle")}</h2>

        {/* PROJECT SELECTOR */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">{t("selectProject")}</p>
          {loadingProjects ? (
            <p className="text-sm text-gray-400">{t("loadingProjects")}</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noProjectsCandidates")}</p>
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
                    <button onClick={(e) => handleDeleteProject(e, p.id)} title={t("delete")}
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
                {t("rolesFor")} {selectedProject?.name}
              </p>
              <p className="text-xs text-gray-400">{t("clickRoleHint")}</p>
            </div>

            {loadingRoles ? (
              <p className="text-sm text-gray-400">{t("loadingRoles")}</p>
            ) : roles.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow">
                <p className="text-sm text-gray-400">{t("noRolesDefined")}</p>
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
                    <div key={role.id} className={`rounded-xl transition ${isActive ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow-lg" : "bg-white shadow"}`}>
                      <div onClick={() => handleRoleClick(role)} className="p-4 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            {role.name}
                            <span className="text-sm ml-2 opacity-80">
                              ({remaining} {t("remaining")})
                            </span>
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                            {role.hiredCount}/{role.count} {t("hiredLabel")}
                          </span>
                        </div>
                        {role.hiredMembers?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {role.hiredMembers.map((m) => (
                              <div key={m.userId} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-green-100 text-green-800"}`}>
                                <span>{m.name}</span>
                                {isManager && (
                                  <button onClick={(e) => handleFireMember(e, m.userId, role.id)} className="hover:text-red-400 transition">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isActive && isManager && (
                        <div className="px-4 pb-4">
                          {loadingCandidates ? (
                            <p className="text-sm text-white/70 animate-pulse">{t("loadingCandidates")}</p>
                          ) : candidates.length === 0 ? (
                            <p className="text-sm text-white/70">{t("noTeamMembers")}</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                {visibleCandidates.map((c) => (
                                  <CandidateCard key={c.id} candidate={c}
                                    isSelected={selectedForRole.has(c.id)}
                                    isHired={c.isHired}
                                    canSelect={canSelectMore || selectedForRole.has(c.id)}
                                    onToggle={handleToggleSelect} />
                                ))}
                              </div>

                              {(hasMore || isExpanded) && (
                                <div className="mt-3 text-center">
                                  <button onClick={() => isExpanded ? setVisibleCount(PAGE_SIZE) : setVisibleCount((prev) => prev + PAGE_SIZE)}
                                    className="flex items-center gap-1.5 mx-auto text-xs text-white/80 hover:text-white transition font-semibold">
                                    {isExpanded
                                      ? <><ChevronUp className="w-4 h-4" />{t("showLess")}</>
                                      : <><ChevronDown className="w-4 h-4" />{t("showMore")} ({candidates.length - visibleCount} {t("showMoreCount")})</>}
                                  </button>
                                </div>
                              )}

                              {pendingCount > 0 && (
                                <div className="mt-4 flex justify-end">
                                  <button onClick={handleHire} disabled={hiring}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 rounded-xl font-bold text-sm shadow hover:bg-cyan-50 transition disabled:opacity-50">
                                    <UserCheck className="w-4 h-4" />
                                    {hiring ? t("hiring") : `${t("hireBtn")} ${pendingCount}`}
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
                  {roles.length} {t("rolesTitle").toLowerCase()} · {roles.reduce((s, r) => s + r.count, 0)} {t("totalPositions")}
                </p>
                <p className="text-sm text-gray-500">{roles.reduce((s, r) => s + r.hiredCount, 0)} {t("hiredLabel")}</p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-100 rounded-xl text-red-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline ml-2">{t("dismiss")}</button>
          </div>
        )}
      </div>
    </div>
  );
}