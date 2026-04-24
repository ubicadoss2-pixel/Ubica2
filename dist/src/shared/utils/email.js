"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (options) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || "Ubica2 <noreply@ubica2.com>",
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        return true;
    }
    catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
exports.sendEmail = sendEmail;
const sendPasswordResetEmail = async (email, token) => {
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
    return (0, exports.sendEmail)({
        to: email,
        subject: "Recuperación de contraseña - Ubica2",
        html,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
