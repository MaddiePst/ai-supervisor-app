import { supabaseAdmin } from "../lib/supabaseClient.js";
import { model } from "../lib/aiConfig.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const getToken = (req) => req.headers.authorization?.split(" ")[1];

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
export async function aiChat(req, res) {
  const { projectId } = req.params;
  const { message, history = [] } = req.body;
  const userId = req.user.id;
  const userName = req.user.full_name || req.user.email;

  try {
    // Load project + tasks for context
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("*, tasks(*)")
      .eq("id", projectId)
      .single();

    if (!project) return res.status(404).json({ error: "Project not found" });

    const tasks = project.tasks || [];
    const tasksSummary = tasks
      .map((t) => `- [ID:${t.id}] Title: "${t.title}" | Status: ${t.status} | Role: ${t.role_title || "unassigned"}`)
      .join("\n");

    const systemPrompt = `You are an AI project supervisor assistant for the project "${project.name}".
Project description: ${project.description || "N/A"}

Current tasks (IDs are internal — NEVER show IDs to users, only use task titles and role names):
${tasksSummary || "No tasks yet."}

Your job:
1. Answer questions about the project, tasks, roles, and progress clearly and helpfully.
2. Give concrete directions and guidance to team members based on the project context.
3. When a team member reports real progress or changes (e.g. "I finished the login page", "the API is delayed", "we changed the approach"), detect which task it refers to by matching the title, and include task updates in your response.

CRITICAL RULES:
- NEVER mention or display any UUIDs or IDs in your response to the user. Only use task titles and role names.
- Only update tasks where you can confidently match the user's message to a specific task title.
- Be concise, friendly, and action-oriented.

If you detect task updates from the conversation, end your response with a JSON block (this is internal only, never shown to user):
<task_updates>
[
  {"task_id": "the-actual-uuid", "status": "in_progress|complete|delayed|not_started", "what": "updated description or null", "how": "updated approach or null"}
]
</task_updates>

Only include fields that actually changed. Match tasks by title only.`;

    // Build message history
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...history.slice(-10).map((m) =>
        m.role === "user"
          ? new HumanMessage(`${m.senderName || "User"}: ${m.content}`)
          : new HumanMessage({ role: "assistant", content: m.content })
      ),
      new HumanMessage(`${userName}: ${message}`),
    ];

    const response = await model.invoke(langchainMessages);
    let fullResponse = response.content;

    // Extract and apply task updates if present
    const taskUpdateMatch = fullResponse.match(/<task_updates>([\s\S]*?)<\/task_updates>/);
    let taskUpdates = [];
    let cleanResponse = fullResponse.replace(/<task_updates>[\s\S]*?<\/task_updates>/g, "").trim();

    if (taskUpdateMatch) {
      try {
        taskUpdates = JSON.parse(taskUpdateMatch[1].trim());
        // Apply updates to DB
        await Promise.all(taskUpdates.map(async ({ task_id, status, what, how }) => {
          if (!task_id) return;
          const update = { updated_at: new Date() };
          if (status) update.status = status;
          if (what) update.what = what;
          if (how) update.how = how;
          await supabaseAdmin.from("tasks").update(update).eq("id", task_id);
        }));
      } catch { /* malformed JSON from AI — skip */ }
    }

    // Save to DB
    await supabaseAdmin.from("chat_messages").insert([
      { project_id: projectId, channel: "ai", sender_id: userId, role: "user", content: message },
      { project_id: projectId, channel: "ai", sender_id: null, role: "assistant", content: cleanResponse },
    ]);

    res.json({
      response: cleanResponse,
      taskUpdates: taskUpdates.length > 0 ? taskUpdates : null,
    });
  } catch (err) {
    console.error("aiChat error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── LOAD AI CHAT HISTORY ─────────────────────────────────────────────────────
export async function getAiHistory(req, res) {
  const { projectId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, role, content, created_at, sender_id, profiles(full_name, avatar_url)")
      .eq("project_id", projectId)
      .eq("channel", "ai")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── GROUP CHANNELS ───────────────────────────────────────────────────────────
export async function listChannels(req, res) {
  const { projectId } = req.params;
  const userId = req.user.id;
  try {
    // ✅ Return channels where user is creator OR in members array
    const { data, error } = await supabaseAdmin
      .from("chat_channels")
      .select("*")
      .eq("project_id", projectId)
      .or(`created_by.eq.${userId},members.cs.{${userId}}`)
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createChannel(req, res) {
  const { projectId } = req.params;
  const { name, members = [], isGroup = false } = req.body;
  const userId = req.user.id;
  try {
    const allMembers = [...new Set([userId, ...members])];
    const { data, error } = await supabaseAdmin
      .from("chat_channels")
      .insert({ project_id: projectId, name, created_by: userId, members: allMembers, is_group: isGroup })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── CHANNEL MESSAGES ─────────────────────────────────────────────────────────
export async function getChannelMessages(req, res) {
  const { channelId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, role, content, created_at, sender_id, profiles(full_name, avatar_url)")
      .eq("channel", channelId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function sendChannelMessage(req, res) {
  const { channelId } = req.params;
  const { content, projectId } = req.body;
  const userId = req.user.id;
  try {
    // Verify user is a member of this channel
    const { data: channel } = await supabaseAdmin
      .from("chat_channels")
      .select("members, project_id")
      .eq("id", channelId)
      .single();

    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const pid = projectId || channel.project_id;

    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({ project_id: pid, channel: channelId, sender_id: userId, role: "user", content })
      .select("id, role, content, created_at, sender_id, profiles(full_name, avatar_url)")
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── PROJECT COWORKERS (for invite) ───────────────────────────────────────────
export async function getProjectCoworkers(req, res) {
  const { projectId } = req.params;
  const userId = req.user.id;
  try {
    const { data: members } = await supabaseAdmin
      .from("project_members")
      .select("profiles(id, full_name, email, avatar_url)")
      .eq("project_id", projectId);

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("profiles!projects_owner_id_fkey(id, full_name, email, avatar_url)")
      .eq("id", projectId)
      .single();

    const seen = new Set([userId]);
    const coworkers = [];

    if (project?.profiles && !seen.has(project.profiles.id)) {
      seen.add(project.profiles.id);
      coworkers.push({ ...project.profiles, isManager: true });
    }

    (members || []).forEach((m) => {
      if (m.profiles && !seen.has(m.profiles.id)) {
        seen.add(m.profiles.id);
        coworkers.push(m.profiles);
      }
    });

    res.json(coworkers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── DELETE MESSAGE ───────────────────────────────────────────────────────────
export async function deleteMessage(req, res) {
  const { messageId } = req.params;
  const userId = req.user.id;
  try {
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", userId); // only own messages
    if (error) throw error;
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── DELETE CHANNEL ───────────────────────────────────────────────────────────
export async function deleteChannel(req, res) {
  const { channelId } = req.params;
  const userId = req.user.id;
  try {
    const { error } = await supabaseAdmin
      .from("chat_channels")
      .delete()
      .eq("id", channelId)
      .eq("created_by", userId);
    if (error) throw error;
    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}