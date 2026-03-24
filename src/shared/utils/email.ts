import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Ubica2 <noreply@ubica2.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
) => {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Recuperación de contraseña</h2>
      <p>Recibiste este email porque solicitaste restablecer tu contraseña en Ubica2.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer contraseña
        </a>
      </div>
      <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
      <p style="color: #666; font-size: 12px;">Este enlace expira en 1 hora.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Recuperación de contraseña - Ubica2",
    html,
  });
};
