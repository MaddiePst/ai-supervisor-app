import { CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import ProjectCard from "../Components/Project/ProjectCard";
import StatusBadge from "../Components/Project/StatusBadge";
import Sidebar from "../Components/Sidebar";

const API_BASE = "http://localhost:3000/api";

export default function AddProject() {
  const [mode, setMode] = useState("create"); // "create" | "update"

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // update mode
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // async state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { project, tasks }

  // fetch projects for update mode
  useEffect(() => {
    if (mode === "update") {
      fetch(`${API_BASE}/projects`)
        .then((r) => r.json())
        .then(setProjects)
        .catch(() => setError("Failed to load projects"));
    }
  }, [mode]);

  // reset when switching modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setName("");
    setDescription("");
    setFile(null);
    setSelectedProjectId(null);
    setError(null);
    setResult(null);
  };

  //file handling
  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  // create/update project
  async function handleCreate() {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create project
      const projRes = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });
      if (!projRes.ok) throw new Error("Failed to create project");
      const project = await projRes.json();

      // 2. Upload file
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE}/uploads/${project.id}`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");
      const { tasks } = await uploadRes.json();

      setResult({ project, tasks });
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
      // 1. Upload PDF to existing project
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(
        `${API_BASE}/uploads/${selectedProjectId}`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!uploadRes.ok) throw new Error("Failed to process upload");

      // 2. Fetch full project with merged tasks
      const projRes = await fetch(`${API_BASE}/projects/${selectedProjectId}`);
      const project = await projRes.json();

      setResult({ project, tasks: project.tasks });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const canSubmitCreate = name.trim() && file;
  const canSubmitUpdate = selectedProjectId && file;

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />

      <div className="flex-1 p-8 max-w-3xl">
        {/* PAGE TITLE */}
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">
          {mode === "create" ? "Create Project" : "Update Project"}
        </h1>

        {/* MODE TOGGLE */}
        <div className="flex gap-0 mb-7 bg-gray-200 rounded-xl p-1 w-fit">
          <button
            onClick={() => switchMode("create")}
            className={
              mode === "create"
                ? "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow-md"
                : "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-transparent text-gray-500 cursor-pointer"
            }
          >
            Create Project
          </button>
          <button
            onClick={() => switchMode("update")}
            className={
              mode === "update"
                ? "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow-md"
                : "px-6 py-2.5 rounded-[10px] text-sm font-semibold bg-transparent text-gray-500 cursor-pointer"
            }
          >
            Update Project
          </button>
        </div>

        {/* RESULT VIEW */}
        {result ? (
          <div className="space-y-5">
            {/* SUCCESS BANNER */}
            <div className="px-5 py-3.5 bg-green-100 rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium text-sm">
                {mode === "create"
                  ? `Project created with ${result.tasks?.length || 0} tasks`
                  : `Project updated — ${result.tasks?.length || 0} tasks`}
              </span>
            </div>

            {/* PROJECT CARD */}
            <ProjectCard project={result.project} tasks={result.tasks || []} />

            {/* RESET BUTTON */}
            <button
              onClick={() => switchMode(mode)}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-900 to-cyan-300 text-white font-bold shadow-lg"
            >
              {mode === "create" ? "Create Another" : "Upload Another Update"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CREATE FORM */}
            {mode === "create" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Project Details
                  </p>
                  <input
                    type="text"
                    placeholder="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none mb-3"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none"
                  />
                </div>
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

            {/* PDF UPLOAD ZONE */}
            <div>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Project Spec (PDF)
              </p>

              {file ? (
                <div className="h-auto border-2 border-green-500 bg-green-50 px-6 py-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {file.name}
                      </p>
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-400 bg-slate-50"
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
                  <p className="text-sm font-semibold text-gray-600">
                    Drop your PDF here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or click to browse
                  </p>
                </label>
              )}
            </div>

            {/* ERROR BANNER */}
            {error && (
              <div className="px-5 py-3.5 bg-red-100 rounded-xl flex items-center gap-2.5 text-red-800">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              onClick={mode === "create" ? handleCreate : handleUpdate}
              disabled={mode === "create" ? !canSubmitCreate : !canSubmitUpdate}
              className={`w-full px-8 py-3.5 rounded-xl font-bold shadow-lg transition ${
                (mode === "create" ? canSubmitCreate : canSubmitUpdate)
                  ? "bg-gradient-to-r from-blue-900 to-cyan-300 text-white"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : mode === "create"
                  ? "Create Project"
                  : "Update Project"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
