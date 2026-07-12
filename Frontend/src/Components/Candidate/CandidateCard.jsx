import React, { useState } from "react";

function matchColor(pct) {
  if (pct >= 70) return "bg-green-100 text-green-700";
  if (pct >= 40) return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function Avatar({ name, avatarUrl, size = 36 }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0"
    >
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function CandidateCard({ candidate, isSelected, isHired, canSelect, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  const borderClass = isHired
    ? "border-2 border-cyan-400 bg-cyan-50"
    : isSelected
    ? "border-2 border-blue-500 bg-blue-50"
    : "border-2 border-transparent bg-white";

  return (
    <div className={`p-3 rounded-xl transition ${borderClass}`}>
      {/* Top row — avatar, name, match % */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={candidate.name} avatarUrl={candidate.avatar_url} size={36} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{candidate.name}</p>
            {candidate.headline && (
              <p className="text-xs text-blue-700 font-medium truncate">{candidate.headline}</p>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${matchColor(candidate.match)}`}>
          {candidate.match}%
        </span>
      </div>

      {/* Description — expandable */}
      {candidate.description && (
        <div className="mt-2">
          <p className={`text-xs text-gray-500 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {candidate.description}
          </p>
          {candidate.description.length > 80 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
              className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5 font-medium"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Skills */}
      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {candidate.skills.slice(0, 3).map((s) => (
            <span key={s} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] rounded font-medium">
              {s}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="text-[10px] text-gray-400">+{candidate.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Select / Hired button */}
      <button
        onClick={() => !isHired && onToggle(candidate)}
        disabled={isHired || (!isSelected && !canSelect)}
        className={`mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition ${
          isHired
            ? "bg-cyan-100 text-cyan-700 cursor-default"
            : isSelected
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : canSelect
            ? "border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
            : "border border-gray-200 text-gray-300 cursor-not-allowed"
        }`}
      >
        {isHired ? "✓ Hired" : isSelected ? "✓ Selected" : "Select"}
      </button>
    </div>
  );
}