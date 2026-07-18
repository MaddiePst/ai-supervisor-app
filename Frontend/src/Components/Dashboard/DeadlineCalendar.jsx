import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, X, Plus, Calendar, Users, Clock, ArrowLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const EVENT_COLORS = { meeting: "bg-blue-500", deadline: "bg-red-500" };
const EVENT_BG = { meeting: "bg-blue-50 border-blue-200", deadline: "bg-red-50 border-red-200" };
const EVENT_TEXT = { meeting: "text-blue-700", deadline: "text-red-600" };

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${hour}:${m} ${ampm}` };
});

function Avatar({ name, avatarUrl, size = 24 }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />;
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0">
      <span className="text-white text-[9px] font-bold">{initials}</span>
    </div>
  );
}

// ── Day Panel ─────────────────────────────────────────────────────────────────
function DayPanel({ dateKey, events, projects, onCreateEvent, onDeleteEvent, onClose }) {
  const { t } = useTranslation();
  const [view, setView] = useState("events");
  const [type, setType] = useState("meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]); // hired members + manager for selected project
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);

  const selectedProject = projects.find((p) => p.id === projectId);
  // ✅ Tasks from the selected project — now includes title since we fixed the query
  const projectTasks = (selectedProject?.tasks || []).filter((t) => t.title);

  // ✅ When project changes, fetch hired members + manager for THAT project only
  useEffect(() => {
    if (!projectId) {
      setProjectMembers([]);
      setSelectedParticipants([]);
      return;
    }

    setLoadingMembers(true);
    setSelectedParticipants([]);

    // Fetch hired members for this specific project
    fetch(`${API_BASE}/projects/${projectId}/members`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(async (members) => {
        const memberProfiles = (members || []).map((m) => ({
          id: m.user_id,
          full_name: m.profiles?.full_name || "Unknown",
          email: m.profiles?.email || "",
          avatar_url: m.profiles?.avatar_url || null,
          roleLabel: m.role_title || "Team Member",
        }));

        // Also fetch the project owner (manager)
        const projRes = await fetch(`${API_BASE}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const proj = await projRes.json();

        const ownerRes = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const { profile: currentUser } = await ownerRes.json();

        // Get owner profile if it's not the current user
        let ownerProfile = null;
        if (proj.owner_id && proj.owner_id !== currentUser?.id) {
          const ownerData = await fetch(`${API_BASE}/users`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then((r) => r.json()).catch(() => []);
          ownerProfile = (Array.isArray(ownerData) ? ownerData : [])
            .find((u) => u.id === proj.owner_id);
        }

        const allParticipants = [];

        // Add manager first if not current user
        if (ownerProfile) {
          allParticipants.push({
            id: ownerProfile.id,
            full_name: ownerProfile.full_name,
            email: ownerProfile.email,
            avatar_url: ownerProfile.avatar_url || null,
            roleLabel: "Manager",
          });
        }

        // Add hired members (deduplicated)
        memberProfiles.forEach((m) => {
          if (!allParticipants.find((p) => p.id === m.id)) {
            allParticipants.push(m);
          }
        });

        setProjectMembers(allParticipants);
      })
      .catch(() => setProjectMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [projectId]);

  const toggleParticipant = (id) =>
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreateEvent({
        type,
        title: title.trim(),
        description: description.trim(),
        event_date: dateKey,
        event_time: eventTime || null,
        project_id: projectId || null,
        task_id: taskId || null,
        participants: selectedParticipants,
      });
      setTitle(""); setDescription(""); setEventTime("09:00");
      setProjectId(""); setTaskId(""); setSelectedParticipants([]);
      setView("events");
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setSaving(false);
    }
  };

  const dayEvents = events
    .filter((e) => e.event_date?.slice(0, 10) === dateKey)
    .sort((a, b) => (a.event_time || "00:00").localeCompare(b.event_time || "00:00"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {view === "create" && (
              <button onClick={() => setView("events")} className="text-gray-400 hover:text-gray-600 mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <h3 className="text-base font-bold text-gray-900">
                {new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── EVENTS VIEW ── */}
          {view === "events" && (
            <div className="p-5">
              {dayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t("noEventsThisDay")}</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {dayEvents.map((ev) => (
                    <div key={ev.id}>
                      <div
                        className={`border rounded-xl p-3 cursor-pointer transition ${EVENT_BG[ev.type]} ${expandedEvent === ev.id ? "shadow-md" : "hover:shadow-sm"}`}
                        onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${EVENT_COLORS[ev.type]}`} />
                              <span className={`text-xs font-bold uppercase ${EVENT_TEXT[ev.type]}`}>{ev.type}</span>
                              {ev.event_time && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatTime(ev.event_time)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                            {ev.projects?.name && (
                              <p className="text-xs text-gray-400">{ev.projects.name}</p>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                            className="shrink-0 text-gray-300 hover:text-red-400 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {expandedEvent === ev.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {ev.description && (
                              <p className="text-sm text-gray-600 leading-relaxed">{ev.description}</p>
                            )}
                            {ev.participantProfiles?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 font-semibold mb-1.5 flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {t("participants")} ({ev.participantProfiles.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {ev.participantProfiles.map((p) => (
                                    <div key={p.id} className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5 border border-gray-200">
                                      <Avatar name={p.full_name} avatarUrl={p.avatar_url} size={18} />
                                      <span className="text-xs text-gray-700">{p.full_name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setView("create")}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-semibold hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />{t("addEvent")}
              </button>
            </div>
          )}

          {/* ── CREATE VIEW ── */}
          {view === "create" && (
            <div className="p-5 space-y-4">
              {/* Type */}
              <div className="flex gap-2">
                {["meeting", "deadline"].map((tp) => (
                  <button key={tp} onClick={() => setType(tp)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                      type === tp ? "bg-linear-to-r from-blue-900 to-cyan-400 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                    {tp === "meeting" ? `📅 ${t("meeting")}` : `⏰ ${t("deadline")}`}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t("eventTitle")}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === "meeting" ? t("meetingTitlePlaceholder") : t("deadlineTitlePlaceholder")}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  {t("timeSlot")} <span className="font-normal text-gray-400">— {t("optional")}</span>
                </label>
                <select value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">{t("noSpecificTime")}</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t("description")}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("eventDescriptionPlaceholder")} rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              {/* Project — required to show participants */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  {t("project")}
                  {!projectId && <span className="font-normal text-gray-400 ml-1">— {t("selectToSeeParticipants")}</span>}
                </label>
                <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">{t("selectProject")}</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* ✅ Task — only for deadline, only when project selected, shows actual task titles */}
              {type === "deadline" && projectId && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t("taskOptional")}</label>
                  {projectTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1">{t("noTasksYet")}</p>
                  ) : (
                    <select value={taskId} onChange={(e) => setTaskId(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                      <option value="">— {t("noSpecificTask")}</option>
                      {projectTasks.map((task) => (
                        <option key={task.id} value={task.id}>{task.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* ✅ Participants — only hired members + manager of selected project */}
              {projectId && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                    {t("invite")}
                    {selectedParticipants.length > 0 && (
                      <span className="ml-1 text-blue-600 font-normal">({selectedParticipants.length} {t("selected")})</span>
                    )}
                  </label>
                  {loadingMembers ? (
                    <p className="text-xs text-gray-400 animate-pulse px-1">{t("loading")}</p>
                  ) : projectMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1">{t("noMembersYet")}</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto border rounded-xl divide-y divide-gray-50">
                      {projectMembers.map((c) => (
                        <div key={c.id} onClick={() => toggleParticipant(c.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition ${
                            selectedParticipants.includes(c.id) ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}>
                          <Avatar name={c.full_name} avatarUrl={c.avatar_url} size={28} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{c.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{c.roleLabel}</p>
                          </div>
                          {selectedParticipants.includes(c.id) && (
                            <span className="text-blue-500 text-sm font-bold">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {view === "create" && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button onClick={handleSave} disabled={!title.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-blue-900 to-cyan-400 text-white font-bold text-sm disabled:opacity-50 transition">
              {saving ? t("saving") : t("createEvent")}
            </button>
            <button onClick={() => setView("events")}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition">
              {t("cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function DeadlineCalendar({ projects = [] }) {
  const { t } = useTranslation();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/calendar`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreateEvent = async (eventData) => {
    const res = await fetch(`${API_BASE}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error("Failed to create event");
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId) => {
    await fetch(`${API_BASE}/calendar/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const eventsByDate = {};
  events.forEach((e) => {
    const key = e.event_date?.slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });

  return (
    <div className="bg-white/60 p-5 rounded-2xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
            className="px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition">
            {t("today") || "Today"}
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = formatDateKey(year, month, day);
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = dateKey === todayKey;

          return (
            <div key={day} onClick={() => setSelectedDate(dateKey)}
              className={`relative min-h-11 rounded-lg p-1 cursor-pointer transition group ${
                isToday ? "bg-blue-900 text-white" : dayEvents.length > 0 ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"
              }`}>
              <span className={`text-xs font-semibold ${isToday ? "text-white" : "text-gray-700"}`}>{day}</span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.type]}`} />
                ))}
                {dayEvents.length > 2 && (
                  <span className={`text-[8px] font-bold ${isToday ? "text-white/70" : "text-gray-400"}`}>+{dayEvents.length - 2}</span>
                )}
              </div>
              {dayEvents.length === 0 && (
                <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className={`w-2.5 h-2.5 ${isToday ? "text-white/50" : "text-gray-300"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs text-gray-500">{t("meeting")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-gray-500">{t("deadline")}</span>
        </div>
        <p className="text-xs text-gray-300 ml-auto">{t("clickDateToAdd")}</p>
      </div>

      {selectedDate && (
        <DayPanel
          dateKey={selectedDate}
          events={events}
          projects={projects}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}