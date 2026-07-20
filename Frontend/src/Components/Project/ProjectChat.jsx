import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, MessageSquare, Plus, Users, Trash2, X, Check, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

// ── Avatar ────────────────────────────────────────────────────────────────────
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

// ── AI Chat ───────────────────────────────────────────────────────────────────
function AiChat({ projectId, onTasksUpdated }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/chat/${projectId}/history`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data.map((m) => ({
            role: m.role,
            content: m.content,
            senderName: m.profiles?.full_name || "AI",
            avatarUrl: m.profiles?.avatar_url || null,
          })));
        } else {
          setMessages([{
            role: "assistant",
            content: "Hi! I'm your AI project supervisor. Ask me about tasks, progress, or blockers — or tell me what you've completed and I'll update the project automatically.",
            senderName: "AI",
          }]);
        }
      })
      .catch(() => setMessages([{ role: "assistant", content: "Hi! How can I help with this project?", senderName: "AI" }]))
      .finally(() => setHistoryLoaded(true));
  }, [projectId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, senderName: user?.name || "You" }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || "I couldn't process that.", senderName: "AI" }]);
      if (data.taskUpdates?.length > 0 && onTasksUpdated) onTasksUpdated(data.taskUpdates);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong.", senderName: "AI" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {!historyLoaded ? (
          <p className="text-xs text-gray-400 text-center animate-pulse mt-6">Loading...</p>
        ) : messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant"
              ? <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-3 h-3 text-white" /></div>
              : <Avatar name={msg.senderName} avatarUrl={msg.avatarUrl} size={24} />
            }
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user" ? "bg-blue-900 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
            }`}>
              <ReactMarkdown className="prose prose-xs max-w-none [&>p]:m-0 [&>p+p]:mt-1">{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-gray-100 flex gap-2 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask AI or report progress..."
          className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 transition" />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-8 h-8 bg-linear-to-r from-blue-900 to-cyan-500 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Single conversation (DM or group) ────────────────────────────────────────
function ConversationChat({ channel, projectId, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/chat/channels/${channel.id}/messages`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [channel.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ content: text, projectId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const deleteMsg = async (msgId) => {
    try {
      await fetch(`${API_BASE}/chat/messages/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0 bg-gray-50">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar name={channel.name} avatarUrl={channel.avatarUrl} size={22} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{channel.name}</p>
          {channel.isGroup && <p className="text-[9px] text-gray-400">{(channel.members || []).length} members</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && <p className="text-xs text-gray-400 text-center mt-8">No messages yet. Start the conversation!</p>}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id || i} className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
              <Avatar name={msg.profiles?.full_name || "?"} avatarUrl={msg.profiles?.avatar_url} size={22} />
              <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <p className="text-[9px] text-gray-400 mb-0.5 ml-1">{msg.profiles?.full_name}</p>}
                <div className={`relative rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  isMe ? "bg-blue-900 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}>
                  {msg.content}
                  {isMe && (
                    <button onClick={() => deleteMsg(msg.id)}
                      className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-gray-100 flex gap-2 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${channel.name}...`}
          className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 transition" />
        <button onClick={send} disabled={!input.trim() || sending}
          className="w-8 h-8 bg-linear-to-r from-blue-900 to-cyan-500 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Messages Inbox ────────────────────────────────────────────────────────────
function MessagesInbox({ projectId, onOpenChannel }) {
  const [channels, setChannels] = useState([]);
  const [coworkers, setCoworkers] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("dm"); // "dm" | "group"
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const loadChannels = () => {
    fetch(`${API_BASE}/chat/${projectId}/channels`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setChannels(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    loadChannels();
    fetch(`${API_BASE}/chat/${projectId}/coworkers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setCoworkers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [projectId]);

  const toggle = (id) => setSelectedMembers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const createConversation = async () => {
    if (newType === "dm" && selectedMembers.length !== 1) return;
    if (newType === "group" && !newName.trim()) return;
    setCreating(true);
    try {
      const name = newType === "dm"
        ? (coworkers.find((c) => c.id === selectedMembers[0])?.full_name || "DM")
        : newName.trim();
      const res = await fetch(`${API_BASE}/chat/${projectId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name, members: selectedMembers, isGroup: newType === "group" }),
      });
      const ch = await res.json();
      setChannels((prev) => [...prev, ch]);
      setShowNew(false);
      setNewName(""); setSelectedMembers([]);
      onOpenChannel({ ...ch, avatarUrl: newType === "dm" ? coworkers.find((c) => c.id === selectedMembers[0])?.avatar_url : null });
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const deleteChannel = async (e, channelId) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/chat/channels/${channelId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Messages</p>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* New conversation form */}
      {showNew && (
        <div className="p-3 border-b border-gray-100 bg-gray-50 space-y-2 shrink-0">
          <div className="flex gap-2">
            {["dm", "group"].map((t) => (
              <button key={t} onClick={() => { setNewType(t); setSelectedMembers([]); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${newType === t ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                {t === "dm" ? "Direct" : "Group"}
              </button>
            ))}
          </div>
          {newType === "group" && (
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name..."
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
          )}
          <div className="max-h-32 overflow-y-auto border rounded-lg divide-y divide-gray-50 bg-white">
            {coworkers.map((c) => (
              <div key={c.id} onClick={() => newType === "dm" ? setSelectedMembers([c.id]) : toggle(c.id)}
                className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer transition ${selectedMembers.includes(c.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <Avatar name={c.full_name} avatarUrl={c.avatar_url} size={22} />
                <p className="text-xs font-medium text-gray-800 flex-1 truncate">{c.full_name}</p>
                {selectedMembers.includes(c.id) && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
              </div>
            ))}
            {coworkers.length === 0 && <p className="text-xs text-gray-400 px-3 py-2 text-center">No coworkers on this project.</p>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={createConversation}
              disabled={creating || (newType === "dm" && selectedMembers.length !== 1) || (newType === "group" && !newName.trim())}
              className="flex-1 py-1.5 rounded-lg bg-linear-to-r from-blue-900 to-cyan-400 text-white text-xs font-bold disabled:opacity-40 transition">
              {creating ? "Creating..." : "Start"}
            </button>
            <button onClick={() => { setShowNew(false); setNewName(""); setSelectedMembers([]); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {channels.length === 0 && !showNew && (
          <div className="text-center py-10">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No conversations yet.</p>
            <button onClick={() => setShowNew(true)} className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-semibold">Start one</button>
          </div>
        )}
        {channels.map((ch) => (
          <div key={ch.id} onClick={() => onOpenChannel(ch)}
            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition group border-b border-gray-50 last:border-0">
            {ch.isGroup
              ? <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-white" /></div>
              : <Avatar name={ch.name} avatarUrl={ch.avatarUrl} size={32} />
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{ch.name}</p>
              <p className="text-[9px] text-gray-400">{ch.isGroup ? "Group" : "Direct message"}</p>
            </div>
            <button onClick={(e) => deleteChannel(e, ch.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ProjectChat({ projectId, onTasksUpdated }) {
  const [tab, setTab] = useState("ai"); // "ai" | "messages"
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-gray-100">
        <button onClick={() => { setTab("ai"); setActiveChannel(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
            tab === "ai" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          <Bot className="w-3.5 h-3.5" /> AI
        </button>
        <button onClick={() => { setTab("messages"); setActiveChannel(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
            tab === "messages" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          <MessageSquare className="w-3.5 h-3.5" /> Messages
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "ai" && <AiChat projectId={projectId} onTasksUpdated={onTasksUpdated} />}
        {tab === "messages" && !activeChannel && (
          <MessagesInbox projectId={projectId} onOpenChannel={(ch) => setActiveChannel(ch)} />
        )}
        {tab === "messages" && activeChannel && (
          <ConversationChat
            channel={activeChannel}
            projectId={projectId}
            onBack={() => setActiveChannel(null)}
          />
        )}
      </div>
    </div>
  );
}