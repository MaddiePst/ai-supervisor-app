export const welcomeEmailTemplate = (name, dashboardUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to AI Supervisor Assistant</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:40px 40px 30px;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);border-radius:16px 16px 0 0;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:16px;margin:auto ;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🤖</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                AI Supervisor Assistant
              </h1>
              <p style="margin:8px 0 0;color:#a5f3fc;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
                Your workspace is ready
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#111827;padding:40px;">

              <!-- GREETING -->
              <h2 style="margin:0 0 8px;color:#f9fafb;font-size:22px;font-weight:600;">
                Welcome aboard, ${name}! 👋
              </h2>
              <p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Your account has been created successfully. You now have access to your AI-powered control panel.
              </p>

              <!-- DIVIDER -->
              <hr style="border:none;border-top:1px solid #1f2937;margin:0 0 28px;" />

              <!-- WHAT THE APP DOES -->
              <h3 style="margin:0 0 16px;color:#f9fafb;font-size:16px;font-weight:600;">
                What you can do with AI Supervisor Assistant
              </h3>

              <!-- FEATURE 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background:#1e3a5f;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">
                      📊
                    </div>
                  </td>
                  <td style="padding-left:12px;" valign="top">
                    <p style="margin:0 0 2px;color:#f9fafb;font-size:14px;font-weight:600;">AI-Powered Project Management</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Create and manage projects with intelligent insights and real-time analysis.</p>
                  </td>
                </tr>
              </table>

              <!-- FEATURE 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background:#1e3a5f;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">
                      👥
                    </div>
                  </td>
                  <td style="padding-left:12px;" valign="top">
                    <p style="margin:0 0 2px;color:#f9fafb;font-size:14px;font-weight:600;">Candidate Tracking</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Monitor and evaluate candidates with AI-assisted scoring and recommendations.</p>
                  </td>
                </tr>
              </table>

              <!-- FEATURE 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background:#1e3a5f;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">
                      ⚙️
                    </div>
                  </td>
                  <td style="padding-left:12px;" valign="top">
                    <p style="margin:0 0 2px;color:#f9fafb;font-size:14px;font-weight:600;">Smart Settings & Profiles</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Customize your workspace, notifications, and appearance to fit your workflow.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#0e7490 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                      Access Your Control Panel →
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
                You received this email because an account was created with this address.<br/>
                If this wasn't you, you can safely ignore this email.<br/><br/>
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