import React, { useState } from "react";
import { MessageSquare, X, ChevronDown } from "lucide-react";
import ProjectChat from "../Project/ProjectChat";

export default function FloatingChat({ projects = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => projects[0]?.id || ""
  );

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* ── Expanded panel ── */}
      {open && (
        <div
          className="w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 flex flex-col overflow-hidden"
          style={{ height: "540px" }}
        >
          {/* Header with project selector */}
          <div className="bg-linear-to-r from-blue-900 to-cyan-500 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-sm">💬 Chat</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            {/* Project selector */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50 [&>option]:text-gray-900"
            >
              <option value="">— Select a project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Reuse exact same ProjectChat component */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedProjectId
              ? <ProjectChat projectId={selectedProjectId} />
              : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400 text-center px-6">
                    Select a project above to start chatting
                  </p>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── Minimized bubble ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-14 h-14 bg-linear-to-br from-blue-900 to-cyan-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-white"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageSquare className="w-6 h-6 text-white" />
        }
      </button>
    </div>
  );
}