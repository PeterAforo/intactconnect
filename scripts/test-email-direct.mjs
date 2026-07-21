import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

console.log("=== Testing direct IP connection ===");

async function test() {
  const transporter = nodemailer.createTransport({
    host: "69.57.189.29",
    port: 465,
    secure: true,
    auth: {
      user: "noreply@intactconnect.com.gh",
      pass: "eslj&ySH8q6ndF_F",
    },
    tls: { rejectUnauthorized: false },
  });

  console.log("Verifying SMTP connection to 69.57.189.29:465...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
    
    // Try port 587 with STARTTLS
    console.log("\nTrying port 587 with STARTTLS...");
    const transporter2 = nodemailer.createTransport({
      host: "69.57.189.29",
      port: 587,
      secure: false,
      auth: {
        user: "noreply@intactconnect.com.gh",
        pass: "eslj&ySH8q6ndF_F",
      },
      tls: { rejectUnauthorized: false },
    });
    
    try {
      await transporter2.verify();
      console.log("✅ SMTP connection verified on port 587!");
      
      const info = await transporter2.sendMail({
        from: "IntactConnect <noreply@intactconnect.com.gh>",
        to: "mcaforo@gmail.com",
        subject: "Test Email from IntactConnect (port 587)",
        html: "<h1>Test</h1><p>This is a test email from IntactConnect via port 587.</p>",
      });
      console.log("✅ Email sent successfully!");
      console.log("Message ID:", info.messageId);
    } catch (err2) {
      console.error("❌ Port 587 also failed:", err2.message);
    }
    return;
  }

  console.log("\nSending test email...");
  try {
    const info = await transporter.sendMail({
      from: "IntactConnect <noreply@intactconnect.com.gh>",
      to: "mcaforo@gmail.com",
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
