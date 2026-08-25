import { supabaseAdmin } from "../lib/supabaseClient.js";
import { model, extractionModel } from "../lib/aiConfig.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const getToken = (req) => req.headers.authorization?.split(" ")[1];

const taskUpdateParser = new JsonOutputParser();
const VALID_STATUSES = new Set(["not_started", "in_progress", "complete", "delayed"]);

// A dedicated, low-temperature extraction chain — kept separate from the
// conversational reply so the reply's free-form advice can't drift from what
// actually gets written to the DB (previously both lived in one completion,
// which let the prose and the JSON block disagree about which task changed).
const taskUpdatePrompt = PromptTemplate.fromTemplate(`
You are a strict task-status extraction system for a project management tool. Your ONLY job is to decide whether the team member's LATEST message reports a real status change on ONE of the tasks below, and output it as JSON.

Tasks (task IDs are internal — never invent an ID that isn't listed below):
{tasksSummary}

Recent conversation (context only — do not extract updates from this, only from the latest message):
{historyText}

Team member's latest message:
"{message}"

RULES:
1. Only extract an update if the LATEST message clearly reports progress, completion, a blocker/delay, or that work hasn't started, on a SPECIFIC task above.
2. Match the task by meaning, not just shared words. When multiple tasks have similar titles (e.g. "Build login page" vs "Build login API" vs "Design login flow"), pick the one whose distinguishing word ("page" vs "API" vs "flow"/"design") actually matches the message — do not default to the first or most recently discussed task.
3. Always trust what the LATEST message literally says over the task's currently stored status or anything said earlier in the conversation — status can move in ANY direction, including backward from complete. E.g. if the message says "haven't started X yet", the status is not_started even if X was previously marked delayed or in_progress. Likewise, if a task is currently complete but the latest message reports a new blocker on it (e.g. "X is blocked on client feedback"), the status is delayed — a task being complete does not mean new problems can't be reported on it.
4. status must be exactly one of: not_started, in_progress, complete, delayed.
5. If no task is clearly and confidently referenced, return an empty array.
6. Only return more than one update if the message clearly reports changes to multiple distinct tasks.

Return ONLY a JSON array, no explanation, no markdown:
[{{"task_id": "uuid-from-list-above", "status": "not_started|in_progress|complete|delayed", "what": null, "how": null}}]
`);

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
    const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]));
    const tasksSummary = tasks
      .map((t) => `- [ID:${t.id}] Title: "${t.title}" | Status: ${t.status} | Role: ${t.role_title || "unassigned"}`)
      .join("\n");

    const recentHistory = history.slice(-10);
    const historyText =
      recentHistory.map((m) => `${m.role === "user" ? m.senderName || "User" : "Assistant"}: ${m.content}`).join("\n") ||
      "(no prior messages)";

    // ── Step 1: deterministic task-update extraction ──────────────────────
    let taskUpdates = [];
    if (tasks.length > 0) {
      try {
        const chain = taskUpdatePrompt.pipe(extractionModel).pipe(taskUpdateParser);
        const raw = await chain.invoke({ tasksSummary, historyText, message: `${userName}: ${message}` });
        // Drop anything referencing a task_id that doesn't exist on this project or an out-of-enum status.
        taskUpdates = (Array.isArray(raw) ? raw : []).filter(
          (u) => u?.task_id && taskById[u.task_id] && VALID_STATUSES.has(u.status)
        );
      } catch (err) {
        console.error("task update extraction error:", err.message);
        taskUpdates = [];
      }
    }

    if (taskUpdates.length > 0) {
      await Promise.all(taskUpdates.map(async ({ task_id, status, what, how }) => {
        const update = { updated_at: new Date() };
        if (status) update.status = status;
        if (what) update.what = what;
        if (how) update.how = how;
        await supabaseAdmin.from("tasks").update(update).eq("id", task_id);
      }));
    }

    // ── Step 2: conversational reply, grounded in what was actually applied ─
    const updateNote =
      taskUpdates.length > 0
        ? `\n\nYou just recorded this update based on the team member's message — reference it naturally and don't contradict it:\n${taskUpdates
            .map((u) => `- "${taskById[u.task_id].title}" -> ${u.status}`)
            .join("\n")}`
        : "";

    const systemPrompt = `You are an AI project supervisor assistant for the project "${project.name}".
Project description: ${project.description || "N/A"}

Current tasks (IDs are internal — NEVER show IDs to users, only use task titles and role names):
${tasksSummary || "No tasks yet."}

Your job:
1. Answer questions about the project, tasks, roles, and progress clearly and helpfully.
2. Give concrete directions and guidance to team members based on the project context.
3. Be concise, friendly, and action-oriented.

CRITICAL: NEVER mention or display any UUIDs or IDs in your response to the user. Only use task titles and role names.${updateNote}`;

    // Build message history
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...recentHistory.map((m) =>
        m.role === "user"
          ? new HumanMessage(`${m.senderName || "User"}: ${m.content}`)
          : new HumanMessage({ role: "assistant", content: m.content })
      ),
      new HumanMessage(`${userName}: ${message}`),
    ];

    const response = await model.invoke(langchainMessages);
    const cleanResponse = response.content.trim();

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