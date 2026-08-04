import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  otp: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    console.log(`[MAILER] Transporter initialized using SMTP Host: ${smtpHost}, User: ${smtpUser}`);
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else if (smtpUser && smtpPass && !smtpHost) {
    // Default to Gmail service if host isn't explicitly set but Gmail credentials are provided
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // Fallback for development without SMTP credentials
    console.log(`[MAILER LOG] (No SMTP credentials in .env) Password Reset OTP for ${smtpUser || "user"}: OTP Code = ${smtpPass || "configured in auth"}`);
    return null;
  }

  return cachedTransporter;
}

export async function sendOtpEmail({ to, otp }: SendOtpOptions): Promise<boolean> {
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || '"Intell Meet" <no-reply@intellmeet.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Intell Meet OTP Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 24px;">Intell Meet</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Verification</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your 6-digit OTP code to reset your password is:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; background-color: #f0f9ff; border: 2px dashed #0284c7; color: #0284c7; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 12px 24px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 20px;">
          This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.warn(`[MAILER] Transporter uninitialized. OTP for ${to} is ${otp}`);
      return false;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `${otp} is your Intell Meet Password Reset Code`,
      html: htmlContent,
      text: `Your 6-digit Intell Meet password reset OTP is: ${otp}. It expires in 10 minutes.`,
    });

    console.log(`[MAILER] Sent OTP mail to ${to} (MessageId: ${info.messageId})`);

    // If Ethereal test mailer was used, print preview link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`=================================================`);
      console.log(`[ETHEREAL TEST MAIL PREVIEW URL]: ${previewUrl}`);
      console.log(`=================================================`);
    }

    return true;
  } catch (error) {
    console.error(`[MAILER] Failed to send email to ${to}:`, error);
    return false;
  }
}
