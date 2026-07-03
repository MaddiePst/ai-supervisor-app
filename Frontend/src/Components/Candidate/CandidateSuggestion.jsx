import React, { useState, useCallback, useRef } from "react";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const INITIAL_COUNT = 4;
const LOAD_MORE_COUNT = 4;

export default function CandidateSuggestions({ role, hiredIds, onHire, projectId }) {
  const { session } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loading, setLoading] = useState(false);

  // Track the last role we fetched for — avoids useEffect entirely
  const lastFetchedRole = useRef(null);

  // ✅ Fetch candidates as a callback — called imperatively, no useEffect needed
  const fetchCandidates = useCallback(async () => {
    if (!role || !projectId) return;

    setLoading(true);
    setVisibleCount(INITIAL_COUNT);

    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/candidates?role=${encodeURIComponent(role.name)}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setCandidates(data);
      } else {
        // Backend not ready — use mock data so UI works
        setCandidates(
          Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            name: `Candidate ${i + 1}`,
            match: 80 + i,
            skills: role.skills || [],
          }))
        );
      }
    } catch {
      // Fallback to mock data on error
      setCandidates(
        Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          name: `Candidate ${i + 1}`,
          match: 80 + i,
          skills: role.skills || [],
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [role, projectId, session]);

  // ✅ Trigger fetch when role changes — using a ref to detect change
  //    without calling setState synchronously inside useEffect
  if (role?.id !== lastFetchedRole.current) {
    lastFetchedRole.current = role?.id;
    fetchCandidates();
  }

  const visibleCandidates = candidates.slice(0, visibleCount);
  const hasMore = visibleCount < candidates.length;

  const handleLoadToggle = (e) => {
    e.stopPropagation();
    setVisibleCount((prev) =>
      hasMore
        ? Math.min(prev + LOAD_MORE_COUNT, candidates.length)
        : INITIAL_COUNT
    );
  };

  if (loading) {
    return (
      <div className="mt-3 text-sm text-white/70 animate-pulse">
        Loading candidates...
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        {visibleCandidates.map((candidate) => {
          const isHired = hiredIds.includes(candidate.id);

          return (
            <div
              key={candidate.id}
              className={`p-3 rounded-xl shadow transition ${
                isHired ? "bg-cyan-50 border border-cyan-300" : "bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800 text-sm">
                  {candidate.name}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHire(role.id, candidate.id);
                  }}
                  disabled={!isHired && hiredIds.length >= role.count}
                  className={`border-2 rounded-2xl px-3 py-1 text-xs font-semibold transition ${
                    isHired
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-cyan-700 text-cyan-800 hover:bg-cyan-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isHired ? "Remove" : "Hire"}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Match: {candidate.match}%
              </p>

              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(candidate.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded-xl font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {hiredIds.length >= role.count && (
        <p className="text-sm text-white mt-3 text-center font-medium">
          ✓ All positions filled
        </p>
      )}

      {candidates.length > INITIAL_COUNT && (
        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 text-sm rounded-lg text-white/80 hover:text-white transition flex items-center gap-2 justify-center mx-auto"
            onClick={handleLoadToggle}
          >
            {hasMore ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                </svg>
                Show More
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
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