import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import CandidateSuggestions from "../Components/Candidate/CandidateSuggestion";

export default function Candidate() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [hiredMap, setHiredMap] = useState({});
  // structure: { [roleId]: [candidateIds] }

  const activeStyle =
    "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";

  const roles = [
    {
      id: 1,
      name: "Frontend Developer",
      count: 2,
      skills: ["React", "CSS", "JavaScript"],
    },
    {
      id: 2,
      name: "Backend Developer",
      count: 1,
      suggestions: ["Node.js Developer", "API Engineer", "Database Engineer"],
    },
    {
      id: 3,
      name: "AI Engineer",
      count: 1,
      suggestions: ["ML Engineer", "Data Scientist", "NLP Specialist"],
    },
  ];

  const handleRoleClick = (role) => {
    if (selectedRole?.id === role.id) {
      setSelectedRole(null); // toggle off
    } else {
      setSelectedRole(role);
    }
  };
  const handleHire = (roleId, candidateId) => {
    setHiredMap((prev) => {
      const roleHires = prev[roleId] || [];

      // already hired → remove
      if (roleHires.includes(candidateId)) {
        return {
          ...prev,
          [roleId]: roleHires.filter((id) => id !== candidateId),
        };
      }

      // hire new
      return {
        ...prev,
        [roleId]: [...roleHires, candidateId],
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />

      <div className="p-3 w-5xl">
        <h2 className="text-2xl font-bold mb-6">Project Roles & Candidates</h2>

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
                    (Positions: {remaining})
                  </span>
                </h3>

                {/* ✅ SHOW CANDIDATES UNDER SELECTED ROLE */}
                {isActive && (
                  <CandidateSuggestions
                    role={role}
                    hiredIds={hiredMap[role.id] || []}
                    onHire={handleHire}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
