export const alertEmailTemplate = ({
  recipientName,
  alertType,
  projectName,
  details,
  actorName,
  dashboardUrl,
}) => {
  const alertTitles = {
    task_update: "Task Status Updated",
    project_update: "Project Updated",
    calendar_event: "New Calendar Event",
  };

  const alertIcons = {
    task_update: "✅",
    project_update: "📋",
    calendar_event: "📅",
  };

  const title = alertTitles[alertType] || "Project Alert";
  const icon = alertIcons[alertType] || "🔔";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);border-radius:16px 16px 0 0;">
              <div style="font-size:36px;margin-bottom:12px;">${icon}</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${title}</h1>
              <p style="margin:6px 0 0;color:#a5f3fc;font-size:13px;">AI Supervisor Assistant</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#111827;padding:32px 40px;">
              <p style="margin:0 0 20px;color:#9ca3af;font-size:15px;">Hi ${recipientName},</p>

              <!-- PROJECT BADGE -->
              <div style="background:#1f2937;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Project</p>
                <p style="margin:0;color:#f9fafb;font-size:16px;font-weight:700;">${projectName}</p>
              </div>

              <!-- DETAILS -->
              <div style="background:#1f2937;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">What happened</p>
                <p style="margin:0;color:#e5e7eb;font-size:14px;line-height:1.6;">${details}</p>
                ${actorName ? `<p style="margin:8px 0 0;color:#6b7280;font-size:12px;">By: <span style="color:#a5f3fc;">${actorName}</span></p>` : ""}
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="${dashboardUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
                      View in Dashboard →
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
                You received this because you have email alerts enabled.<br/>
                Manage preferences in Settings → Notifications.<br/>
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