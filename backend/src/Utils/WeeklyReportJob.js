import cron from "node-cron";
import { Resend } from "resend";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { weeklyReportTemplate } from "./WeeklyReportEmailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Timezone offset map (approximate UTC offsets in hours)
const TIMEZONE_OFFSETS = {
  "UTC−12:00": -12,
  "UTC−08:00 (Pacific Time)": -8,
  "UTC−07:00 (Mountain Time)": -7,
  "UTC−06:00 (Central Time)": -6,
  "UTC−05:00 (Eastern Time)": -5,
  "UTC−04:00 (Atlantic Time)": -4,
  "UTC+00:00 (GMT)": 0,
  "UTC+01:00 (Central European Time)": 1,
  "UTC+02:00 (Eastern European Time)": 2,
  "UTC+03:00 (Moscow Time)": 3,
  "UTC+05:30 (India Standard Time)": 5.5,
  "UTC+08:00 (China / Singapore)": 8,
  "UTC+09:00 (Japan / Korea)": 9,
  "UTC+10:00 (Australia Eastern)": 10,
};

// ─── BUILD WEEKLY SUMMARY FOR ONE USER ────────────────────────────────────────
async function buildUserReport(userId, userRole) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get projects for this user
  let projectIds = [];
  if (userRole === "manager") {
    const { data } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("owner_id", userId);
    projectIds = (data || []).map((p) => p.id);
  } else {
    const { data } = await supabaseAdmin
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);
    projectIds = (data || []).map((m) => m.project_id);
  }

  if (projectIds.length === 0) return [];

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name, tasks(*)")
    .in("id", projectIds);

  return (projects || []).map((project) => {
    const allTasks = project.tasks || [];
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "complete").length;
    const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Tasks completed this week (updated_at within last 7 days and status = complete)
    const completedThisWeek = allTasks.filter((t) =>
      t.status === "complete" && new Date(t.updated_at) >= weekAgo
    );

    return {
      name: project.name,
      role: userRole === "manager" ? "Manager" : "Team Member",
      tasksCompleted: completedThisWeek.length,
      tasksInProgress: inProgress,
      progressPercent,
      completedTaskTitles: completedThisWeek.map((t) => t.title),
    };
  });
}

// ─── SEND WEEKLY REPORT TO ONE USER ──────────────────────────────────────────
async function sendWeeklyReport(user) {
  try {
    const projects = await buildUserReport(user.id, user.role);
    if (projects.length === 0) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    await resend.emails.send({
      from: "AI Supervisor Assistant <onboarding@resend.dev>",
      to: user.email,
      subject: `📊 Your Weekly Report — ${fmt(weekAgo)} to ${fmt(now)}`,
      html: weeklyReportTemplate({
        recipientName: user.full_name,
        weekStart: fmt(weekAgo),
        weekEnd: fmt(now),
        projects,
        dashboardUrl: `${CLIENT_URL}/dashboard`,
      }),
    });

    console.log(`Weekly report sent to ${user.email}`);
  } catch (err) {
    console.error(`Weekly report failed for ${user.email}:`, err.message);
  }
}

// ─── CHECK AND SEND FOR USERS IN A GIVEN UTC HOUR ─────────────────────────────
// Called every hour — checks which users have 6AM in their local timezone right now
async function processHour() {
  const utcHour = new Date().getUTCHours();
  const utcDay = new Date().getUTCDay(); // 0=Sunday, 1=Monday

  // Find all users with weekly_reports ON
  const { data: users, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, time_zone, weekly_reports")
    .eq("weekly_reports", true);

  if (error || !users) return;

  for (const user of users) {
    if (!user.email) continue;

    const offset = TIMEZONE_OFFSETS[user.time_zone] ?? 0;
    const offsetHours = Math.floor(offset);
    const offsetMins = (offset % 1) * 60;

    // Calculate local time for this user
    const localHour = (utcHour + offsetHours + 24) % 24;
    const localDay = ((utcDay + Math.floor((utcHour + offsetHours) / 24)) + 7) % 7;

    // Send if it's Monday (1) at 6AM local time
    if (localDay === 1 && localHour === 6 && offsetMins === 0) {
      await sendWeeklyReport(user);
    }
    // Handle half-hour timezones (e.g. India UTC+5:30)
    if (localDay === 1 && localHour === 6 && offsetMins !== 0) {
      const utcMins = new Date().getUTCMinutes();
      if (Math.abs(utcMins - offsetMins) < 30) {
        await sendWeeklyReport(user);
      }
    }
  }
}

// ─── START CRON JOB ───────────────────────────────────────────────────────────
export function startWeeklyReportJob() {
  // Run every hour at :00 to check which users need their 6AM Monday report
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Weekly report check running...");
    await processHour();
  });

  console.log("✅ Weekly report cron job started (checks hourly)");
}