import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, MessageSquare, Plus, Users, Trash2, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "../../Context/useAuth";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

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

// Render message text — no ReactMarkdown so prose can't override color
function MsgText({ content, isUser }) {
  return (
    <span style={{ color: isUser ? "#ffffff" : undefined, whiteSpace: "pre-wrap" }}>
      {content}
    </span>
  );
}

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
          setMessages([{ role: "assistant", content: "Hi! I'm your AI project supervisor. Ask me about tasks, progress, or blockers — or tell me what you've completed and I'll update the project automatically.", senderName: "AI" }]);
        }
      })
      .catch(() => setMessages([{ role: "assistant", content: "Hi! How can I help?", senderName: "AI" }]))
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
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!historyLoaded ? (
          <p className="text-xs text-gray-400 text-center animate-pulse mt-6">Loading...</p>
        ) : messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant"
              ? <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-3 h-3 text-white" /></div>
              : <Avatar name={msg.senderName} avatarUrl={msg.avatarUrl} size={24} />
            }
            {msg.role === "user" ? (
              <div
                className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed"
                style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" }}
              >
                <MsgText content={msg.content} isUser={true} />
              </div>
            ) : (
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed bg-gray-100 text-gray-800">
                <MsgText content={msg.content} isUser={false} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-900 to-cyan-400 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-white" /></div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
              {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-gray-100 flex gap-2 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask AI or report progress..."
          style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" }}
          className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/40 transition placeholder-white/60" />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)" }}
          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const poll = setInterval(() => {
      fetch(`${API_BASE}/chat/channels/${channel.id}/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMessages(data); })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [channel.id]);

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
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const deleteMsg = async (id) => {
    await fetch(`${API_BASE}/chat/messages/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition"><ArrowLeft className="w-4 h-4" /></button>
        {channel.is_group
          ? <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0"><Users className="w-3.5 h-3.5 text-white" /></div>
          : <Avatar name={channel.name} avatarUrl={channel.avatarUrl} size={28} />
        }
        <p className="text-xs font-semibold text-gray-800 truncate">{channel.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.length === 0 && <p className="text-xs text-gray-400 text-center mt-8">No messages yet. Start the conversation!</p>}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id || i} className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
              <Avatar name={msg.profiles?.full_name} avatarUrl={msg.profiles?.avatar_url} size={22} />
              <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <p className="text-[9px] text-gray-400 mb-0.5 ml-1">{msg.profiles?.full_name}</p>}
                {isMe ? (
                  <div className="relative rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed"
                    style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" }}>
                    {msg.content}
                    <button onClick={() => deleteMsg(msg.id)}
                      className="absolute -left-5 top-1 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed bg-gray-100 text-gray-800">
                    {msg.content}
                  </div>
                )}
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
          style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" }}
          className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/40 transition placeholder-white/60" />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)" }}
          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

function MessagesInbox({ projectId, onOpenChannel }) {
  const [channels, setChannels] = useState([]);
  const [coworkers, setCoworkers] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("dm");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  // const loadChannels = () => {
  //   fetch(`${API_BASE}/chat/${projectId}/channels`, {
  //     headers: { Authorization: `Bearer ${getToken()}` },
  //   })
  //     .then((r) => r.json())
  //     .then((data) => setChannels(Array.isArray(data) ? data : []))
  //     .catch(console.error);
  // };
  
  useEffect(() => {
    fetch(`${API_BASE}/chat/${projectId}/channels`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setChannels(Array.isArray(data) ? data : []))
      .catch(console.error);
  
    fetch(`${API_BASE}/chat/${projectId}/coworkers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setCoworkers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [projectId]);

  const toggle = (id) => setSelectedMembers((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const create = async () => {
    if (newType === "dm" && selectedMembers.length !== 1) return;
    if (newType === "group" && !newName.trim()) return;
    setCreating(true);
    try {
      const dmPartner = newType === "dm" ? coworkers.find((c) => c.id === selectedMembers[0]) : null;
      const name = newType === "dm" ? (dmPartner?.full_name || "DM") : newName.trim();
      const res = await fetch(`${API_BASE}/chat/${projectId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name, members: selectedMembers, isGroup: newType === "group" }),
      });
      const ch = await res.json();
      const enriched = { ...ch, avatarUrl: dmPartner?.avatar_url || null, is_group: newType === "group" };
      setChannels((prev) => [...prev, enriched]);
      setShowNew(false); setNewName(""); setSelectedMembers([]);
      onOpenChannel(enriched);
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const deleteChannel = async (e, id) => {
    e.stopPropagation();
    await fetch(`${API_BASE}/chat/channels/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Messages</p>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {showNew && (
        <div className="p-3 border-b border-gray-100 bg-gray-50 space-y-2 shrink-0">
          <div className="flex gap-2">
            {["dm", "group"].map((t) => (
              <button key={t} onClick={() => { setNewType(t); setSelectedMembers([]); }}
                style={newType === t ? { background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" } : {}}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${newType !== t ? "bg-gray-100 text-gray-500" : ""}`}>
                {t === "dm" ? "Direct" : "Group"}
              </button>
            ))}
          </div>
          {newType === "group" && (
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name..."
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
          )}
          <div className="max-h-36 overflow-y-auto border rounded-lg divide-y divide-gray-50 bg-white [&::-webkit-scrollbar]:hidden">
            {coworkers.map((c) => (
              <div key={c.id} onClick={() => newType === "dm" ? setSelectedMembers([c.id]) : toggle(c.id)}
                className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer transition ${selectedMembers.includes(c.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <Avatar name={c.full_name} avatarUrl={c.avatar_url} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{c.full_name}</p>
                  {c.isManager && <p className="text-[9px] text-blue-600 font-semibold">Manager</p>}
                </div>
                {selectedMembers.includes(c.id) && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
              </div>
            ))}
            {coworkers.length === 0 && <p className="text-xs text-gray-400 px-3 py-3 text-center">No coworkers on this project yet.</p>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={create}
              disabled={creating || (newType === "dm" && selectedMembers.length !== 1) || (newType === "group" && !newName.trim())}
              style={{ background: "linear-gradient(to right, #1e3a8a, #06b6d4)", color: "#ffffff" }}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition">
              {creating ? "Creating..." : "New Chat"}
            </button>
            <button onClick={() => { setShowNew(false); setNewName(""); setSelectedMembers([]); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            {ch.is_group
              ? <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-white" /></div>
              : <Avatar name={ch.name} avatarUrl={ch.avatarUrl} size={32} />
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{ch.name}</p>
              <p className="text-[9px] text-gray-400">{ch.is_group ? "Group" : "Direct message"}</p>
            </div>
            <button onClick={(e) => deleteChannel(e, ch.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectChat({ projectId, onTasksUpdated }) {
  const [tab, setTab] = useState("ai");
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex shrink-0 border-b border-gray-100">
        <button onClick={() => { setTab("ai"); setActiveChannel(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${tab === "ai" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
          <Bot className="w-3.5 h-3.5" /> AI
        </button>
        <button onClick={() => { setTab("messages"); setActiveChannel(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${tab === "messages" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
          <MessageSquare className="w-3.5 h-3.5" /> Messages
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "ai" && <AiChat projectId={projectId} onTasksUpdated={onTasksUpdated} />}
        {tab === "messages" && !activeChannel && <MessagesInbox projectId={projectId} onOpenChannel={(ch) => setActiveChannel(ch)} />}
        {tab === "messages" && activeChannel && <ConversationChat channel={activeChannel} projectId={projectId} onBack={() => setActiveChannel(null)} />}
      </div>
    </div>
  );
}