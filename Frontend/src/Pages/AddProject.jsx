import { CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RolesEditor from "../Components/Project/RolesEditor";
import StatusBadge from "../Components/Project/StatusBadge";
import TasksEditor from "../Components/Project/TasksEditor";
import Sidebar from "../Components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

const nameFromFile = (filename) =>
  filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

const getToken = () => localStorage.getItem("token");

export default function AddProject() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null);
  const [editedTasks, setEditedTasks] = useState([]);
  const [editedRoles, setEditedRoles] = useState([]);

  useEffect(() => {
    if (mode === "update") {
      fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((r) => r.json())
        .then((data) => setProjects(Array.isArray(data) ? data : []))
        .catch(() => setError("Failed to load projects"));
    }
  }, [mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setName("");
    setDescription("");
    setFile(null);
    setSelectedProjectId(null);
    setError(null);
    setResult(null);
    setEditedTasks([]);
    setEditedRoles([]);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    setFile(selectedFile);
    if (!name.trim()) setName(nameFromFile(selectedFile.name));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  async function handleCreate() {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create the project
      const projRes = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name, description }),
      });
      if (!projRes.ok) {
        const err = await projRes.json();
        throw new Error(err.error || err.message || "Failed to create project");
      }
      const project = await projRes.json();

      // 2. Always call the upload endpoint — with or without a PDF
      //    If no PDF, backend uses name+description as the AI prompt
      const formData = new FormData();
      if (file) formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE}/uploads/${project.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || err.message || "Failed to generate tasks");
      }
      const uploadData = await uploadRes.json();

      setResult({ project, tasks: uploadData.tasks || [], roles: uploadData.roles || [] });
      setEditedTasks(uploadData.tasks || []);
      setEditedRoles(uploadData.roles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdate() {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE}/uploads/${selectedProjectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || err.message || "Failed to process upload");
      }
      const uploadData = await uploadRes.json();

      const projRes = await fetch(`${API_BASE}/projects/${selectedProjectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const project = await projRes.json();

      const tasks = project.tasks || [];
      const roles = uploadData.roles || project.roles || [];

      setResult({ project, tasks, roles });
      setEditedTasks(tasks);
      setEditedRoles(roles);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveProject() {
    setIsSaving(true);
    setError(null);

    try {
      const projectId = result.project.id;

      // Save edited tasks
      await Promise.all(
        editedTasks.map(async (task) => {
          const skills =
            typeof task.skills === "string"
              ? task.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : task.skills || [];

          if (task._isNew) {
            await fetch(`${API_BASE}/tasks`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({
                project_id: projectId,
                title: task.title,
                what: task.what,
                how: task.how,
                skills,
                status: task.status,
              }),
            });
          } else {
            await fetch(`${API_BASE}/tasks/${task.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({
                title: task.title,
                what: task.what,
                how: task.how,
                skills,
                status: task.status,
              }),
            });
          }
        })
      );

      // Save edited roles
      await fetch(`${API_BASE}/projects/${projectId}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
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
    if (result?.project?.id) {
      try {
        await fetch(`${API_BASE}/projects/${result.project.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch {
        // Silent cleanup
      }
    }
    navigate("/dashboard");
  }

  const canSubmitCreate = name.trim();
  const canSubmitUpdate = selectedProjectId;

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
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={
                mode === m
                  ? "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-linear-to-r from-blue-900 to-cyan-300 text-white shadow-md"
                  : "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-transparent text-gray-500 cursor-pointer"
              }
            >
              {m === "create" ? "Create Project" : "Update Project"}
            </button>
          ))}
        </div>

        {/* RESULT VIEW */}
        {result ? (
          <div className="space-y-5">
            <div className="px-5 py-3.5 bg-green-100 rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium text-sm">
                {mode === "create"
                  ? `Project created — ${editedTasks.length} tasks · ${editedRoles.length} roles`
                  : `Project updated — ${editedTasks.length} tasks · ${editedRoles.length} roles`}
              </span>
            </div>

            <TasksEditor
              tasks={editedTasks}
              onSave={(updated) => setEditedTasks(updated)}
            />

            <RolesEditor
              roles={editedRoles}
              onSave={(updated) => setEditedRoles(updated)}
            />

            {error && (
              <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg disabled:opacity-50 transition"
              >
                {isSaving ? "Saving..." : "Save Project"}
              </button>
              <button
                onClick={handleSkip}
                disabled={isSaving}
                className="px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CREATE FORM */}
            {mode === "create" && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Project Details
                </p>
                <input
                  type="text"
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                />
                <textarea
                  placeholder="Description — the more detail you add, the better the AI-generated tasks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none"
                />
              </div>
            )}

            {/* UPDATE — PROJECT SELECTOR */}
            {mode === "update" && (
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Select Project
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {projects.length === 0 ? (
                    <p className="text-sm text-gray-400">No projects found</p>
                  ) : (
                    projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition bg-white ${
                          selectedProjectId === p.id
                            ? "border-blue-500 shadow-md"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-800">
                            {p.name}
                          </span>
                          <StatusBadge status={p.status} />
                        </div>
                        {p.description && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {p.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PDF UPLOAD — optional */}
            <div>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Project Spec (PDF){" "}
                <span className="normal-case font-normal text-gray-400">
                  — optional, improves AI accuracy
                </span>
              </p>

              {file ? (
                <div className="border-2 border-green-500 bg-green-50 px-6 py-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-500 font-semibold hover:text-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="pdfUpload"
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
                    dragActive ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFile(e.target.files[0])}
                    className="hidden"
                    id="pdfUpload"
                  />
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Drop your PDF here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                </label>
              )}
            </div>

            {error && (
              <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={mode === "create" ? handleCreate : handleUpdate}
              disabled={mode === "create" ? !canSubmitCreate : !canSubmitUpdate}
              className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                (mode === "create" ? canSubmitCreate : canSubmitUpdate)
                  ? "bg-linear-to-r from-blue-900 to-cyan-300 text-white"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : mode === "create"
                  ? "Upload Project"
                  : "Update Project"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}