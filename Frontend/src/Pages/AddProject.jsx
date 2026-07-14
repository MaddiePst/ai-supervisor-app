import { CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RolesEditor from "../Components/Project/RolesEditor";
import StatusBadge from "../Components/Project/StatusBadge";
import TasksEditor from "../Components/Project/TasksEditor";
import Sidebar from "../Components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const nameFromFile = (f) => f.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
const getToken = () => localStorage.getItem("token");

// ── PDF Drop Zone ─────────────────────────────────────────────────────────────
function PdfDropZone({ file, onFile, label, removeLabel }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (f) => {
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
          {removeLabel}
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleDrop(e.dataTransfer.files[0]); }}
      className={`h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50"
      }`}>
      <input type="file" accept="application/pdf"
        onChange={(e) => handleDrop(e.target.files[0])} className="hidden" />
      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="text-xs text-gray-400 mt-1">or click to browse</p>
    </label>
  );
}

export default function AddProject() {
  const { t } = useTranslation();
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

  // Shared state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createResult, setCreateResult] = useState(null);
  const [editedTasks, setEditedTasks] = useState([]);
  const [editedRoles, setEditedRoles] = useState([]);

  useEffect(() => {
    if (mode !== "update") return;
    setLoadingProjects(true);
    fetch(`${API_BASE}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, [mode]);

  const switchMode = (newMode) => {
    setMode(newMode); setName(""); setDescription(""); setCreateFile(null);
    setSelectedProject(null); setUpdateFile(null); setError(null);
    setCreateResult(null); setEditedTasks([]); setEditedRoles([]);
  };

  const handleSelectProject = async (project) => {
    if (selectedProject?.id === project.id) {
      setSelectedProject(null); setUpdateFile(null);
      setEditedTasks([]); setEditedRoles([]);
      return;
    }
    setSelectedProject(project); setUpdateFile(null); setError(null);
    setLoadingProjectData(true);
    try {
      const r = await fetch(`${API_BASE}/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      setEditedTasks(data.tasks || []);
      setEditedRoles(data.roles || []);
    } catch { setError("Failed to load project details"); }
    finally { setLoadingProjectData(false); }
  };

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
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  }

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
      setCreateResult({ project });
      setEditedTasks(project.tasks || []);
      setEditedRoles(uploadData.roles || project.roles || []);
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  }

  async function handleSaveProject() {
    setIsSaving(true); setError(null);
    const projectId = createResult?.project?.id || selectedProject?.id;
    try {
      await Promise.all(editedTasks.map(async (task) => {
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
      }));
      await fetch(`${API_BASE}/projects/${projectId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ roles: editedRoles }),
      });
      navigate("/candidates");
    } catch (err) { setError(err.message || "Failed to save project."); }
    finally { setIsSaving(false); }
  }

  async function handleSkip() {
    if (mode === "create" && createResult?.project?.id) {
      try {
        await fetch(`${API_BASE}/projects/${createResult.project.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch { /* silent */ }
    }
    navigate("/dashboard");
  }

  // ── Result view (after processing) ────────────────────────────────────────
  if (createResult) {
    return (
      <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
        <Sidebar />
        <div className="flex-1 p-8 max-w-3xl space-y-5">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {mode === "create" ? createResult.project.name : selectedProject?.name}
          </h1>
          <div className="px-5 py-3.5 bg-green-100 rounded-xl flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium text-sm">
              {editedTasks.length} {t("projectCreated")}
            </span>
          </div>
          <TasksEditor tasks={editedTasks} onSave={(u) => setEditedTasks(u)} />
          <RolesEditor roles={editedRoles} onSave={(u) => setEditedRoles(u)} />
          {error && (
            <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
              <XCircle className="w-5 h-5 text-red-500" /><span className="text-sm font-medium">{error}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSaveProject} disabled={isSaving}
              className="px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg disabled:opacity-50 transition">
              {isSaving ? t("saving") : t("saveProject")}
            </button>
            <button onClick={handleSkip} disabled={isSaving}
              className="px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50">
              {mode === "create" ? t("skip") : t("cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">
          {mode === "create" ? t("createProject") : t("updateProject")}
        </h1>

        <div className="flex gap-0 mb-7 bg-gray-200 rounded-xl p-1 w-fit">
          {["create", "update"].map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={mode === m
                ? "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow-md"
                : "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-transparent text-gray-500 cursor-pointer"}>
              {m === "create" ? t("createProject") : t("updateProject")}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* CREATE */}
          {mode === "create" && (
            <>
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t("projectDetails")}</p>
                <input type="text" placeholder={t("projectName")} value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 outline-none" />
                <textarea placeholder={t("projectDescription")} value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 outline-none resize-none" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  {t("projectSpec")} <span className="normal-case font-normal text-gray-400">— {t("improveAI")}</span>
                </p>
                <PdfDropZone
                  file={createFile}
                  onFile={(f) => {
                    setCreateFile(f);
                    if (f && !name.trim()) setName(nameFromFile(f.name));
                  }}
                  label={t("dropPDF")}
                  removeLabel={t("remove")}
                />
              </div>
              {error && (
                <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                  <XCircle className="w-5 h-5 text-red-500" /><span className="text-sm font-medium">{error}</span>
                </div>
              )}
              <button onClick={handleCreate} disabled={!name.trim() || isProcessing}
                className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                  name.trim() && !isProcessing
                    ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                }`}>
                {isProcessing ? t("processing") : t("uploadProject")}
              </button>
            </>
          )}

          {/* UPDATE */}
          {mode === "update" && (
            <>
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">{t("selectProjectUpdate")}</p>
                {loadingProjects ? (
                  <p className="text-sm text-gray-400">{t("loadingProjects")}</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("noProjectsFound")}</p>
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
                        {p.description && <p className="text-xs text-gray-400 mt-1 truncate">{p.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedProject && (
                <>
                  {loadingProjectData ? (
                    <p className="text-sm text-gray-400 animate-pulse">{t("loading")}</p>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">
                          {t("uploadNewPDF")} <span className="text-blue-900">{selectedProject.name}</span>
                          <span className="normal-case font-normal text-gray-400 ml-1">— {t("mergeAI")}</span>
                        </p>
                        <PdfDropZone
                          file={updateFile}
                          onFile={setUpdateFile}
                          label="Drop updated project spec here"
                          removeLabel={t("remove")}
                        />
                      </div>

                      {updateFile && (
                        <button onClick={handleUpdate} disabled={isProcessing}
                          className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                            !isProcessing
                              ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white"
                              : "bg-gray-300 text-gray-400 cursor-not-allowed"
                          }`}>
                          {isProcessing ? t("processing") : t("uploadMerge")}
                        </button>
                      )}

                      <TasksEditor tasks={editedTasks} onSave={(u) => setEditedTasks(u)} />
                      <RolesEditor roles={editedRoles} onSave={(u) => setEditedRoles(u)} />

                      {error && (
                        <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                          <XCircle className="w-5 h-5 text-red-500" /><span className="text-sm font-medium">{error}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button onClick={handleSaveProject} disabled={isSaving}
                          className="px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg disabled:opacity-50 transition">
                          {isSaving ? t("saving") : t("saveProject")}
                        </button>
                        <button onClick={() => navigate("/dashboard")} disabled={isSaving}
                          className="px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                          {t("cancel")}
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