import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../shared/utils/hash";
import { generateAccessToken, generateRefreshToken } from "../../shared/utils/jwt";
import { sendPasswordResetEmail } from "../../shared/utils/email";
import { LoginDTO, RegisterDTO, ForgotPasswordDTO, ResetPasswordDTO } from "./auth.schema";
import { randomBytes } from "crypto";

const normalizeRole = (role?: string) => (role || "").trim().toUpperCase();

const getPrimaryRole = (roles: { role: { code: string } }[]) => {
  if (!roles || roles.length === 0) return "USER";

  const roleSet = new Set(roles.map((item) => normalizeRole(item.role.code)));
  if (roleSet.has("ADMIN")) return "ADMIN";
  if (roleSet.has("OWNER") || roleSet.has("MERCHANT")) return "OWNER";
  if (roleSet.has("USER")) return "USER";

  return normalizeRole(roles[0].role.code) || "USER";
};

export const registerUser = async (data: RegisterDTO) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email ya registrado");
  }

  const hashed = await hashPassword(data.password);
  const userRole = await prisma.role.findUnique({
    where: { code: "USER" },
  });

  if (!userRole) {
    throw new Error("Rol USER no configurado");
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      passwordHash: hashed,
      userRoles: {
        create: [{ roleId: userRole.id }],
      },
    },
    include: { userRoles: { include: { role: true } } },
  });

  const roleCode = getPrimaryRole(user.userRoles);
  const payload = {
    id: user.id,
    role: roleCode,
    email: user.email,
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: roleCode,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const loginUser = async (data: LoginDTO) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Credenciales invalidas");
  }

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) {
    throw new Error("Credenciales invalidas");
  }

  const roleCode = getPrimaryRole(user.userRoles);
  const payload = {
    id: user.id,
    role: roleCode,
    email: user.email,
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: roleCode,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const getUpdatedUserSession = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) throw new Error("Usuario no encontrado");

  const roleCode = getPrimaryRole(user.userRoles);
  const payload = {
    id: user.id,
    role: roleCode,
    email: user.email,
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: roleCode,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const forgotPassword = async (data: ForgotPasswordDTO) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return { sent: false, message: "Si el email existe, se envió un enlace de recuperación" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const sent = await sendPasswordResetEmail(user.email, token);

  return {
    sent,
    message: sent
      ? "Email de recuperación enviado"
      : "Error al enviar email. Intenta más tarde",
  };
};

export const resetPassword = async (data: ResetPasswordDTO) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: data.token },
  });

  if (!resetToken) {
    throw new Error("Token inválido");
  }

  if (resetToken.usedAt) {
    throw new Error("Token ya utilizado");
  }

  if (new Date() > resetToken.expiresAt) {
    throw new Error("Token expirado");
  }

  const hashed = await hashPassword(data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })
  ]);

  return { message: "Contraseña actualizada exitosamente" };
};

