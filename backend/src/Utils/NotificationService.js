import { Resend } from "resend";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { alertEmailTemplate } from "./AlertEmailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function getAlertRecipients(projectId) {
  try {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("owner_id, name, profiles!projects_owner_id_fkey(full_name, email, email_alerts)")
      .eq("id", projectId)
      .single();

    const { data: members } = await supabaseAdmin
      .from("project_members")
      .select("profiles(id, full_name, email, email_alerts)")
      .eq("project_id", projectId);

    const recipients = [];

    if (project?.profiles?.email_alerts && project.profiles.email) {
      recipients.push({ name: project.profiles.full_name, email: project.profiles.email });
    }

    (members || []).forEach((m) => {
      if (m.profiles?.email_alerts && m.profiles?.email) {
        if (!recipients.find((r) => r.email === m.profiles.email)) {
          recipients.push({ name: m.profiles.full_name, email: m.profiles.email });
        }
      }
    });

    return { recipients, projectName: project?.name || "Unknown Project" };
  } catch (err) {
    console.error("getAlertRecipients error:", err.message);
    return { recipients: [], projectName: "" };
  }
}

async function sendAlertEmail({ recipientName, recipientEmail, alertType, projectName, details, actorName }) {
  try {
    await resend.emails.send({
      from: "AI Supervisor Assistant <onboarding@resend.dev>",
      to: recipientEmail,
      subject: getSubject(alertType, projectName),
      html: alertEmailTemplate({
        recipientName,
        alertType,
        projectName,
        details,
        actorName,
        dashboardUrl: `${CLIENT_URL}/dashboard`,
      }),
    });
  } catch (err) {
    console.error(`Alert email failed for ${recipientEmail}:`, err.message);
  }
}

function getSubject(alertType, projectName) {
  switch (alertType) {
    case "task_update": return `✅ Task updated on ${projectName}`;
    case "project_update": return `📋 ${projectName} has been updated`;
    case "calendar_event": return `📅 New event on ${projectName}`;
    default: return `🔔 Update on ${projectName}`;
  }
}

function formatStatus(status) {
  switch (status) {
    case "not_started": return "Not Started";
    case "in_progress": return "In Progress";
    case "complete": return "Complete";
    default: return status;
  }
}

export async function notifyTaskStatusUpdate({ projectId, taskTitle, oldStatus, newStatus, actorName }) {
  const { recipients, projectName } = await getAlertRecipients(projectId);
  const details = `"${taskTitle}" was updated from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}.`;
  await Promise.all(recipients.map((r) =>
    sendAlertEmail({ recipientName: r.name, recipientEmail: r.email, alertType: "task_update", projectName, details, actorName })
  ));
}

export async function notifyProjectUpdate({ projectId, details, actorName }) {
  const { recipients, projectName } = await getAlertRecipients(projectId);
  await Promise.all(recipients.map((r) =>
    sendAlertEmail({ recipientName: r.name, recipientEmail: r.email, alertType: "project_update", projectName, details, actorName })
  ));
}

export async function notifyCalendarEvent({ projectId, eventTitle, eventDate, actorName }) {
  const { recipients, projectName } = await getAlertRecipients(projectId);
  const details = `A new event "${eventTitle}" has been scheduled for ${eventDate}.`;
  await Promise.all(recipients.map((r) =>
    sendAlertEmail({ recipientName: r.name, recipientEmail: r.email, alertType: "calendar_event", projectName, details, actorName })
  ));
}