import nodemailer from "nodemailer";
import { mailVpsIntegration } from "../integrations/mailVps";

type AuthEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export async function sendAuthEmail(email: AuthEmail) {
  if (process.env.VPS_MAIL_API_URL && process.env.VPS_MAIL_API_TOKEN) {
    await mailVpsIntegration.sendMessage({
      from: email.from,
      to: [email.to],
      subject: email.subject,
      body: email.text,
    });
    return;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) {
    throw new Error("Configure VPS_MAIL_API_URL/VPS_MAIL_API_TOKEN ou SMTP_HOST/SMTP_USER/SMTP_PASSWORD");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass: password },
  });
  await transporter.sendMail({ from: email.from, to: email.to, subject: email.subject, text: email.text });
}
