import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

console.log("=== SMTP Configuration ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_SECURE:", process.env.SMTP_SECURE);
console.log("SMTP_SECURE === 'true':", process.env.SMTP_SECURE === "true");
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "[SET]" : "[NOT SET]");
console.log("SMTP_FROM:", process.env.SMTP_FROM);
console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
console.log("");

async function test() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ SMTP_USER or SMTP_PASS not set!");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log("Verifying SMTP connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
    return;
  }

  console.log("\nSending test email to:", process.env.SMTP_USER);
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"IntactConnect" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "Test Email from IntactConnect",
      html: "<h1>Test</h1><p>This is a test email from IntactConnect.</p>",
    });
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }
}

test();
