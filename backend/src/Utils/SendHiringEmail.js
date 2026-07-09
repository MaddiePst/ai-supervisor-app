import { Resend } from "resend";
import { hiringEmailTemplate } from "./HiringEmailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendHiringEmail = async ({
  candidateEmail,
  candidateName,
  managerName,
  projectName,
  roleTitle,
  skills = [],
  positionsCount = 1,
}) => {
  try {
    // ✅ Build dashboardUrl here where process.env is available
    const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

    const { data, error } = await resend.emails.send({
      from: "AI Supervisor Assistant <onboarding@resend.dev>",
      to: candidateEmail,
      subject: `🎉 You've been hired as ${roleTitle} on ${projectName}`,
      html: hiringEmailTemplate({
        candidateName,
        managerName,
        projectName,
        roleTitle,
        skills,
        positionsCount,
        dashboardUrl,
      }),
    });

    if (error) {
      console.error("Failed to send hiring email:", error.message);
      return;
    }

    console.log("Hiring email sent to:", candidateEmail, "| ID:", data.id);
  } catch (err) {
    console.error("Hiring email error:", err.message);
  }
};