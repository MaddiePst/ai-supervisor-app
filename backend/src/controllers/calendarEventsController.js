import { supabaseAdmin } from "../lib/supabaseClient.js";
import { notifyCalendarEvent } from "../Utils/NotificationService.js";

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── LIST EVENTS (for current user) ──────────────────────────────────────────
export async function listEvents(req, res) {
  const userId = req.user.id;
  try {
    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .select(`
        *,
        projects(name),
        tasks(title),
        creator:profiles!calendar_events_created_by_fkey(full_name, email)
      `)
      .or(`created_by.eq.${userId},participants.cs.{${userId}}`)
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Enrich with participant profiles
    const enriched = await Promise.all((data || []).map(async (event) => {
      if (!event.participants?.length) return { ...event, participantProfiles: [] };
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", event.participants);
      return { ...event, participantProfiles: profiles || [] };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
export async function createEvent(req, res) {
  const userId = req.user.id;
  const { project_id, type, title, description, event_date, event_time, task_id, participants = [] } = req.body;

  if (!title || !type || !event_date) {
    return res.status(400).json({ message: "title, type and event_date are required." });
  }

  try {
    // Always include creator in participants
    const allParticipants = [...new Set([userId, ...participants])];

    const { data: event, error } = await supabaseAdmin
      .from("calendar_events")
      .insert({
        project_id: project_id || null,
        created_by: userId,
        type,
        title,
        description: description || "",
        event_date,
        event_time: event_time || null,
        task_id: task_id || null,
        participants: allParticipants,
      })
      .select()
      .single();

    if (error) throw error;

    // Get creator info for email
    const { data: creator } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const actorName = creator?.full_name || "A team member";
    const formattedDate = new Date(event_date).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    if (type === "deadline" && project_id) {
      // ✅ Notify ALL project members regardless of email_alerts setting
      const { data: projectMembers } = await supabaseAdmin
        .from("project_members")
        .select("profiles(full_name, email)")
        .eq("project_id", project_id);

      const { data: projectOwner } = await supabaseAdmin
        .from("projects")
        .select("profiles!projects_owner_id_fkey(full_name, email)")
        .eq("id", project_id)
        .single();

      const { Resend } = await import("resend");
      const { alertEmailTemplate } = await import("../Utils/AlertEmailTemplate.js");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const deadlineRecipients = [];
      if (projectOwner?.profiles?.email) deadlineRecipients.push(projectOwner.profiles);
      (projectMembers || []).forEach((m) => {
        if (m.profiles?.email && !deadlineRecipients.find((r) => r.email === m.profiles.email)) {
          deadlineRecipients.push(m.profiles);
        }
      });

      // ✅ Fetch project name directly so it's always available
      const { data: projectData } = await supabaseAdmin
        .from("projects")
        .select("name")
        .eq("id", project_id)
        .single();
      const projectName = projectData?.name || "Your Project";

      // ✅ Fetch task name if task_id was provided
      let taskName = null;
      if (task_id) {
        const { data: taskData } = await supabaseAdmin
          .from("tasks")
          .select("title")
          .eq("id", task_id)
          .single();
        taskName = taskData?.title || null;
      }

      await Promise.all(deadlineRecipients.map((p) =>
        resend.emails.send({
          from: "AI Supervisor Assistant <onboarding@resend.dev>",
          to: p.email,
          subject: `⏰ Deadline set: ${title} on ${formattedDate}`,
          html: alertEmailTemplate({
            recipientName: p.full_name,
            alertType: "calendar_event",
            projectName,
            details: [
              `A deadline "${title}" has been set for ${formattedDate}.`,
              taskName ? `Task: "${taskName}"` : null,
              description ? `Details: ${description}` : null,
            ].filter(Boolean).join(" "),
            actorName,
            dashboardUrl: `${CLIENT_URL}/dashboard`,
          }),
        }).catch(console.error)
      ));
    } else if (type === "meeting" && participants.length > 0) {
      // Only notify invited participants with alerts ON
      const { data: invitees } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .in("id", participants.filter((id) => id !== userId));

      const { Resend } = await import("resend");
      const { alertEmailTemplate } = await import("../Utils/AlertEmailTemplate.js");
      const resend = new Resend(process.env.RESEND_API_KEY);

      // ✅ Fetch project name for meeting email
      let meetingProjectName = "General";
      if (project_id) {
        const { data: meetingProject } = await supabaseAdmin
          .from("projects")
          .select("name")
          .eq("id", project_id)
          .single();
        meetingProjectName = meetingProject?.name || "Your Project";
      }

      // ✅ Send to ALL invited participants regardless of notification settings
      await Promise.all((invitees || [])
        .filter((p) => p.email)
        .map((p) =>
          resend.emails.send({
            from: "AI Supervisor Assistant <onboarding@resend.dev>",
            to: p.email,
            subject: `📅 Meeting: ${title} on ${formattedDate}`,
            html: alertEmailTemplate({
              recipientName: p.full_name,
              alertType: "calendar_event",
              projectName: meetingProjectName,
              details: `${actorName} has invited you to a meeting: "${title}"${description ? ` — ${description}` : ""}. Scheduled for ${formattedDate}${event_time ? ` at ${formatTime(event_time)}` : ""}.`,
              actorName,
              dashboardUrl: `${CLIENT_URL}/dashboard`,
            }),
          }).catch(console.error)
        )
      );
    }

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────
export async function deleteEvent(req, res) {
  const userId = req.user.id;
  try {
    const { error } = await supabaseAdmin
      .from("calendar_events")
      .delete()
      .eq("id", req.params.id)
      .eq("created_by", userId);

    if (error) throw error;
    res.json({ message: "Event deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── LIST ALL TEAM MEMBERS (for meeting invites) ──────────────────────────────
export async function listColleagues(req, res) {
  const userId = req.user.id;
  try {
    // Get all project IDs this user is involved in
    const { data: ownedProjects } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("owner_id", userId);

    const { data: memberProjects } = await supabaseAdmin
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);

    const projectIds = [
      ...(ownedProjects || []).map((p) => p.id),
      ...(memberProjects || []).map((m) => m.project_id),
    ];

    if (projectIds.length === 0) return res.json([]);

    // Get all members from those projects
    const { data: members } = await supabaseAdmin
      .from("project_members")
      .select("profiles(id, full_name, email, avatar_url, role)")
      .in("project_id", projectIds);

    const { data: owners } = await supabaseAdmin
      .from("projects")
      .select("profiles!projects_owner_id_fkey(id, full_name, email, avatar_url, role)")
      .in("id", projectIds);

    // Collect unique colleagues (exclude self)
    const seen = new Set([userId]);
    const colleagues = [];

    [...(members || []), ...(owners || [])].forEach((item) => {
      const p = item.profiles;
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        colleagues.push(p);
      }
    });

    res.json(colleagues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}