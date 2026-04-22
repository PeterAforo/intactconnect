import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured, skipping email to:", to);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"IntactConnect" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
        🤝 IntactConnect
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Reseller Platform by Intact Ghana</p>
    </td>
  </tr>
  <tr><td style="padding:32px;">${body}</td></tr>
  <tr>
    <td style="background:#f8f9fc;padding:20px 32px;text-align:center;border-top:1px solid #e8ecf0;">
      <p style="margin:0;color:#7a8499;font-size:12px;">
        IntactConnect &bull; Powered by Intact Ghana &bull;
        <a href="tel:+233543645126" style="color:#7c3aed;text-decoration:none;">+233 543 645 126</a>
      </p>
      <p style="margin:6px 0 0;color:#b0b8c9;font-size:11px;">
        © ${new Date().getFullYear()} Intact Ghana. All rights reserved.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
