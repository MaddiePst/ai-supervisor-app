import React, { useState, useEffect } from "react";

export default function CandidateSuggestions({ role, hiredIds, onHire }) {
  const INITIAL_COUNT = 4;
  const LOAD_MORE_COUNT = 4;

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Mock candidates (replace with real data later)
  const candidates = Array.from({ length: 12 }, (_, i) => i + 1);

  const visibleCandidates = candidates.slice(0, visibleCount);
  const hasMore = visibleCount < candidates.length;

  // ✅ Reset when role changes
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [role]);

  const handleClick = () => {
    if (hasMore) {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, candidates.length),
      );
    } else {
      setVisibleCount(INITIAL_COUNT);
    }
  };

  return (
    <div className="mt-3">
      {/* CANDIDATES */}
      <div className="grid grid-cols-2 gap-3 transition-all duration-300">
        {visibleCandidates.map((id) => {
          const isHired = hiredIds.includes(id);

          return (
            <div
              key={id}
              className={`p-3 rounded-xl shadow transition ${
                isHired
                  ? "bg-taupe-400 text-gray-800"
                  : "bg-gray-300 text-gray-800"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold">Candidate {id}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHire(role.id, id);
                  }}
                  disabled={!isHired && hiredIds.length >= role.count}
                  className={`border-2 rounded-2xl px-3 py-1 transition ${
                    isHired
                      ? "border-gray-700 text-gray-700"
                      : "border-cyan-800 text-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isHired ? "✕" : "Hire"}
                </button>
              </div>

              <p className="text-sm text-gray-700">Match: {80 + id}%</p>

              <div className="flex gap-2 mt-2 flex-wrap">
                {(role.skills || role.suggestions || []).map((item) => (
                  <span
                    key={item}
                    className="bg-blue-300 px-2 py-1 text-xs rounded-xl"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {hiredIds.length >= role.count && (
        <p className="text-sm text-white mt-3 text-center">
          All positions filled
        </p>
      )}

      {/* BUTTON (only if needed) */}
      {candidates.length > INITIAL_COUNT && (
        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 text-sm rounded-lg  text-white transition flex items-center gap-2 justify-center mx-auto"
            onClick={(e) => {
              e.stopPropagation(); // 🔥 THIS FIXES IT
              handleClick();
            }}
          >
            {hasMore ? (
              <>
                {/* DOWN ICON */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
                  />
                </svg>
                Show More
              </>
            ) : (
              <>
                {/* UP ICON */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
                  />
                </svg>
                Show Less
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
