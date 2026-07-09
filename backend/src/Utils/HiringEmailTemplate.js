export const hiringEmailTemplate = ({
  candidateName,
  managerName,
  projectName,
  roleTitle,
  skills = [],
  positionsCount = 1,
  dashboardUrl,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You've Been Hired!</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:40px 40px 30px;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);border-radius:16px 16px 0 0;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:16px;margin:0 auto 20px;">
                <span style="font-size:28px;line-height:60px;display:block;text-align:center;">🎉</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">You've Been Hired!</h1>
              <p style="margin:8px 0 0;color:#a5f3fc;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
                AI Supervisor Assistant
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#111827;padding:40px;">
              <h2 style="margin:0 0 8px;color:#f9fafb;font-size:22px;font-weight:600;">
                Congratulations, ${candidateName}! 🚀
              </h2>
              <p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.6;">
                You have been selected to join a project on AI Supervisor Assistant. Here are your assignment details:
              </p>

              <hr style="border:none;border-top:1px solid #1f2937;margin:0 0 28px;" />

              <!-- DETAILS CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #374151;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Project</p>
                    <p style="margin:0;color:#f9fafb;font-size:16px;font-weight:700;">${projectName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #374151;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Hired By</p>
                    <p style="margin:0;color:#f9fafb;font-size:15px;font-weight:600;">${managerName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #374151;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Position</p>
                    <p style="margin:0;color:#a5f3fc;font-size:15px;font-weight:700;">${roleTitle}</p>
                    ${positionsCount > 1 ? `<p style="margin:4px 0 0;color:#6b7280;font-size:12px;">${positionsCount} positions on this role</p>` : ""}
                  </td>
                </tr>
                ${skills.length > 0 ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Skills That Got You Hired</p>
                    <div>
                      ${skills.map((skill) => `
                        <span style="display:inline-block;background:#1e3a5f;color:#a5f3fc;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:3px 4px 3px 0;">
                          ${skill}
                        </span>
                      `).join("")}
                    </div>
                  </td>
                </tr>
                ` : ""}
              </table>

              <!-- NEXT STEPS -->
              <h3 style="margin:0 0 12px;color:#f9fafb;font-size:15px;font-weight:600;">What happens next?</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="32" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:22px;height:22px;background:#1e3a5f;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#a5f3fc;">1</span>
                  </td>
                  <td style="padding-left:10px;">
                    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">Log in to your AI Supervisor Assistant account</p>
                  </td>
                </tr>
                <tr><td colspan="2" style="height:10px;"></td></tr>
                <tr>
                  <td width="32" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:22px;height:22px;background:#1e3a5f;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#a5f3fc;">2</span>
                  </td>
                  <td style="padding-left:10px;">
                    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">Navigate to your Dashboard — the project will appear there</p>
                  </td>
                </tr>
                <tr><td colspan="2" style="height:10px;"></td></tr>
                <tr>
                  <td width="32" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:22px;height:22px;background:#1e3a5f;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#a5f3fc;">3</span>
                  </td>
                  <td style="padding-left:10px;">
                    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">View your assigned tasks and start updating progress</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0d1117;padding:24px 40px;border-radius:0 0 16px 16px;border-top:1px solid #1f2937;">
              <p style="margin:0;color:#4b5563;font-size:12px;text-align:center;line-height:1.6;">
                You received this email because a manager hired you into a project.<br/>
                If this was a mistake, please contact your manager.<br/><br/>
                © ${new Date().getFullYear()} AI Supervisor Assistant. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;