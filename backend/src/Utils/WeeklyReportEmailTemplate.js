export const weeklyReportTemplate = ({ recipientName, weekStart, weekEnd, projects, dashboardUrl }) => {
  const totalTasks = projects.reduce((s, p) => s + p.tasksCompleted, 0);
  const totalProjects = projects.length;

  const projectRows = projects.map((p) => `
    <div style="background:#1f2937;border-radius:10px;padding:16px 20px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <p style="margin:0;color:#f9fafb;font-size:15px;font-weight:700;">${p.name}</p>
        <span style="background:#0e7490;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;">
          ${p.role}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:#111827;border-radius:8px;padding:10px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;">Completed</p>
          <p style="margin:4px 0 0;color:#34d399;font-size:20px;font-weight:700;">${p.tasksCompleted}</p>
        </div>
        <div style="background:#111827;border-radius:8px;padding:10px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;">In Progress</p>
          <p style="margin:4px 0 0;color:#fbbf24;font-size:20px;font-weight:700;">${p.tasksInProgress}</p>
        </div>
        <div style="background:#111827;border-radius:8px;padding:10px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;">Progress</p>
          <p style="margin:4px 0 0;color:#a5f3fc;font-size:20px;font-weight:700;">${p.progressPercent}%</p>
        </div>
      </div>

      ${p.completedTaskTitles?.length > 0 ? `
        <div>
          <p style="margin:0 0 6px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Completed this week</p>
          ${p.completedTaskTitles.slice(0, 5).map((title) => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="color:#34d399;font-size:12px;">✓</span>
              <span style="color:#d1d5db;font-size:12px;">${title}</span>
            </div>
          `).join("")}
          ${p.completedTaskTitles.length > 5 ? `<p style="margin:4px 0 0;color:#6b7280;font-size:11px;">+${p.completedTaskTitles.length - 5} more</p>` : ""}
        </div>
      ` : `<p style="margin:0;color:#6b7280;font-size:12px;">No tasks completed this week.</p>`}
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Weekly Project Report</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:36px 40px 28px;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);border-radius:16px 16px 0 0;">
              <div style="font-size:36px;margin-bottom:12px;">📊</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Weekly Project Report</h1>
              <p style="margin:6px 0 0;color:#a5f3fc;font-size:13px;">${weekStart} – ${weekEnd}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#111827;padding:32px 40px;">
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;">Hi ${recipientName},</p>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;line-height:1.6;">
                Here's your weekly summary across <strong style="color:#f9fafb;">${totalProjects} project${totalProjects !== 1 ? "s" : ""}</strong>.
                Your team completed <strong style="color:#34d399;">${totalTasks} task${totalTasks !== 1 ? "s" : ""}</strong> this week.
              </p>

              <hr style="border:none;border-top:1px solid #1f2937;margin:0 0 24px;"/>

              <!-- PROJECT SUMMARIES -->
              ${projectRows}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 40px;border-radius:12px;">
                      Open Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0d1117;padding:20px 40px;border-radius:0 0 16px 16px;border-top:1px solid #1f2937;">
              <p style="margin:0;color:#4b5563;font-size:11px;text-align:center;line-height:1.6;">
                You receive this every Monday at 6:00 AM in your local timezone.<br/>
                Manage in Settings → Notifications.<br/>
                © ${new Date().getFullYear()} AI Supervisor Assistant
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};