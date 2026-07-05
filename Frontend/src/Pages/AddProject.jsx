import { CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RolesEditor from "../Components/Project/RolesEditor";
import StatusBadge from "../Components/Project/StatusBadge";
import TasksEditor from "../Components/Project/TasksEditor";
import Sidebar from "../Components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const nameFromFile = (f) => f.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
const getToken = () => localStorage.getItem("token");

function PdfDropZone({ file, onFile, label }) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { alert("Please upload a PDF file"); return; }
    onFile(f);
  };

  if (file) {
    return (
      <div className="border-2 border-green-500 bg-green-50 px-6 py-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <button onClick={() => onFile(null)} className="text-sm text-red-500 font-semibold hover:text-red-700 transition">
          Remove
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
      className={`h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50"
      }`}
    >
      <input type="file" accept="application/pdf" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
      <p className="text-sm font-semibold text-gray-600">{label || "Drop your PDF here"}</p>
      <p className="text-xs text-gray-400 mt-1">or click to browse</p>
    </label>
  );
}

export default function AddProject() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create");

  // Create state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createFile, setCreateFile] = useState(null);

  // Update state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  const [loadingProjectData, setLoadingProjectData] = useState(false);

  // Shared result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createResult, setCreateResult] = useState(null); // only for create mode
  const [editedTasks, setEditedTasks] = useState([]);
  const [editedRoles, setEditedRoles] = useState([]);

  // Fetch projects for Update mode
  useEffect(() => {
    if (mode !== "update") return;
    setLoadingProjects(true);
    fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, [mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setName(""); setDescription(""); setCreateFile(null);
    setSelectedProject(null); setUpdateFile(null);
    setError(null); setCreateResult(null);
    setEditedTasks([]); setEditedRoles([]);
  };

  // ── Select project in Update mode ─────────────────────────────────────────
  // Immediately loads existing tasks + roles into editors
  const handleSelectProject = async (project) => {
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
      setUpdateFile(null);
      setEditedTasks([]);
      setEditedRoles([]);
      return;
    }
    setSelectedProject(project);
    setUpdateFile(null);
    setError(null);
    setLoadingProjectData(true);

    try {
      const r = await fetch(`${API_BASE}/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      setEditedTasks(data.tasks || []);
      setEditedRoles(data.roles || []);
    } catch {
      setError("Failed to load project details");
    } finally {
      setLoadingProjectData(false);
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate() {
    setIsProcessing(true); setError(null);
    try {
      const projRes = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name, description }),
      });
      if (!projRes.ok) { const e = await projRes.json(); throw new Error(e.error || e.message); }
      const project = await projRes.json();

      const formData = new FormData();
      if (createFile) formData.append("file", createFile);

      const uploadRes = await fetch(`${API_BASE}/uploads/${project.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) { const e = await uploadRes.json(); throw new Error(e.error || e.message); }
      const uploadData = await uploadRes.json();

      setCreateResult({ project });
      setEditedTasks(uploadData.tasks || []);
      setEditedRoles(uploadData.roles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Update — PDF upload merges with existing tasks ─────────────────────────
  async function handleUpdate() {
    if (!selectedProject || !updateFile) return;
    setIsProcessing(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("file", updateFile);

      const uploadRes = await fetch(`${API_BASE}/uploads/${selectedProject.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) { const e = await uploadRes.json(); throw new Error(e.error || e.message); }
      const uploadData = await uploadRes.json();

      const projRes = await fetch(`${API_BASE}/projects/${selectedProject.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const project = await projRes.json();

      // Update editors with merged results
      setEditedTasks(project.tasks || []);
      setEditedRoles(uploadData.roles || project.roles || []);
      setUpdateFile(null); // clear file after processing
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSaveProject() {
    setIsSaving(true); setError(null);
    const projectId = createResult?.project?.id || selectedProject?.id;
    try {
      await Promise.all(
        editedTasks.map(async (task) => {
          const skills = typeof task.skills === "string"
            ? task.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : task.skills || [];
          if (task._isNew) {
            await fetch(`${API_BASE}/tasks`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({ project_id: projectId, title: task.title, what: task.what, how: task.how, skills, status: task.status }),
            });
          } else {
            await fetch(`${API_BASE}/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({ title: task.title, what: task.what, how: task.how, skills, status: task.status }),
            });
          }
        })
      );
      await fetch(`${API_BASE}/projects/${projectId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ roles: editedRoles }),
      });
      navigate("/candidates");
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkip() {
    if (mode === "create" && createResult?.project?.id) {
      try {
        await fetch(`${API_BASE}/projects/${createResult.project.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch { /* silent */ }
    }
    navigate("/dashboard");
  }

  // ── Create mode result view ────────────────────────────────────────────────
  if (createResult) {
    return (
      <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
        <Sidebar />
        <div className="flex-1 p-8 max-w-3xl space-y-5">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {createResult.project.name}
          </h1>
          <div className="px-5 py-3.5 bg-green-100 rounded-xl flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium text-sm">
              Project created — {editedTasks.length} tasks · {editedRoles.length} roles
            </span>
          </div>
          <TasksEditor tasks={editedTasks} onSave={(u) => setEditedTasks(u)} />
          <RolesEditor roles={editedRoles} onSave={(u) => setEditedRoles(u)} />
          {error && (
            <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSaveProject} disabled={isSaving}
              className="px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg disabled:opacity-50 transition">
              {isSaving ? "Saving..." : "Save Project"}
            </button>
            <button onClick={handleSkip} disabled={isSaving}
              className="px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50">
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">
          {mode === "create" ? "Create Project" : "Update Project"}
        </h1>

        {/* MODE TOGGLE */}
        <div className="flex gap-0 mb-7 bg-gray-200 rounded-xl p-1 w-fit">
          {["create", "update"].map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={mode === m
                ? "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow-md"
                : "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-transparent text-gray-500 cursor-pointer"}>
              {m === "create" ? "Create Project" : "Update Project"}
            </button>
          ))}
        </div>

        <div className="space-y-6">

          {/* ── CREATE FORM ── */}
          {mode === "create" && (
            <>
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Project Details</p>
                <input type="text" placeholder="Project name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 outline-none" />
                <textarea placeholder="Description — more detail = better AI tasks" value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 outline-none resize-none" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Project Spec (PDF) <span className="normal-case font-normal text-gray-400">— optional</span>
                </p>
                <PdfDropZone
                  file={createFile}
                  onFile={(f) => { setCreateFile(f); if (f && !name.trim()) setName(nameFromFile(f.name)); }}
                />
              </div>
              {error && (
                <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
              <button onClick={handleCreate} disabled={!name.trim() || isProcessing}
                className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                  name.trim() && !isProcessing
                    ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                }`}>
                {isProcessing ? "Processing..." : "Upload Project"}
              </button>
            </>
          )}

          {/* ── UPDATE FORM ── */}
          {mode === "update" && (
            <>
              {/* Step 1: Project selector */}
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Select Project to Update
                </p>
                {loadingProjects ? (
                  <p className="text-sm text-gray-400">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-400">No projects found. Create one first.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {projects.map((p) => (
                      <div key={p.id} onClick={() => handleSelectProject(p)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition bg-white ${
                          selectedProject?.id === p.id ? "border-blue-500 shadow-md" : "border-transparent hover:border-gray-300"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-800">{p.name}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        {p.description && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{p.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Steps 2-4: Only show after project selected */}
              {selectedProject && (
                <>
                  {loadingProjectData ? (
                    <p className="text-sm text-gray-400 animate-pulse">Loading project data...</p>
                  ) : (
                    <>
                      {/* Step 2: PDF drop zone */}
                      <div>
                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Upload New PDF <span className="normal-case font-normal text-gray-400">— optional, merges with existing tasks</span>
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Drop a new spec to let AI add/update tasks. Or edit tasks and roles directly below.
                        </p>
                        <PdfDropZone
                          file={updateFile}
                          onFile={setUpdateFile}
                          label="Drop updated project spec here"
                        />
                      </div>

                      {/* Upload & merge button — only when PDF is selected */}
                      {updateFile && (
                        <button onClick={handleUpdate} disabled={isProcessing}
                          className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                            !isProcessing
                              ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white"
                              : "bg-gray-300 text-gray-400 cursor-not-allowed"
                          }`}>
                          {isProcessing ? "Processing..." : "Upload & Merge"}
                        </button>
                      )}

                      {/* Step 3: ✅ Editors always visible once project is selected */}
                      <TasksEditor tasks={editedTasks} onSave={(u) => setEditedTasks(u)} />
                      <RolesEditor roles={editedRoles} onSave={(u) => setEditedRoles(u)} />

                      {error && (
                        <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium">{error}</span>
                        </div>
                      )}

                      {/* Step 4: Save / Cancel */}
                      <div className="flex gap-3 pt-2">
                        <button onClick={handleSaveProject} disabled={isSaving}
                          className="px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg disabled:opacity-50 transition">
                          {isSaving ? "Saving..." : "Save Project"}
                        </button>
                        <button onClick={() => navigate("/dashboard")} disabled={isSaving}
                          className="px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}