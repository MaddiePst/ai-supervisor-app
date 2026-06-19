import { Resend } from "resend";
import { welcomeEmailTemplate } from "./EmailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── SEND WELCOME EMAIL ───────────────────────────────────────────────────────
export const sendWelcomeEmail = async (name, email) => {
  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

  const { data, error } = await resend.emails.send({
    from: "AI Supervisor Assistant<onboarding@resend.dev>", // free Resend default domain
    to: email,
    subject: "Welcome to AI Supervisor Assistant 🤖",
    html: welcomeEmailTemplate(name, dashboardUrl),
  });

  if (error) {
    // Log but don't crash the registration — email is non-critical
    console.error("Failed to send welcome email:", error.message);
    return;
  }

  console.log("Welcome email sent:", data.id);
};