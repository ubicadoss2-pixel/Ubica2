"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getUpdatedUserSession = exports.loginUser = exports.registerUser = void 0;
const prisma_1 = require("../../config/prisma");
const hash_1 = require("../../shared/utils/hash");
const jwt_1 = require("../../shared/utils/jwt");
const email_1 = require("../../shared/utils/email");
const crypto_1 = require("crypto");
const normalizeRole = (role) => (role || "").trim().toUpperCase();
const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0)
        return "USER";
    const roleSet = new Set(roles.map((item) => normalizeRole(item.role.code)));
    if (roleSet.has("ADMIN"))
        return "ADMIN";
    if (roleSet.has("OWNER") || roleSet.has("MERCHANT"))
        return "OWNER";
    if (roleSet.has("USER"))
        return "USER";
    return normalizeRole(roles[0].role.code) || "USER";
};
const registerUser = async (data) => {
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new Error("Email ya registrado");
    }
    const hashed = await (0, hash_1.hashPassword)(data.password);
    const userRole = await prisma_1.prisma.role.findUnique({
        where: { code: "USER" },
    });
    if (!userRole) {
        throw new Error("Rol USER no configurado");
    }
    const user = await prisma_1.prisma.user.create({
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
        accessToken: (0, jwt_1.generateAccessToken)(payload),
        refreshToken: (0, jwt_1.generateRefreshToken)(payload),
    };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
        include: { userRoles: { include: { role: true } } },
    });
    if (!user || !user.passwordHash) {
        throw new Error("Credenciales invalidas");
    }
    const valid = await (0, hash_1.comparePassword)(data.password, user.passwordHash);
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
        accessToken: (0, jwt_1.generateAccessToken)(payload),
        refreshToken: (0, jwt_1.generateRefreshToken)(payload),
    };
};
exports.loginUser = loginUser;
const getUpdatedUserSession = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
    });
    if (!user)
        throw new Error("Usuario no encontrado");
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
        accessToken: (0, jwt_1.generateAccessToken)(payload),
        refreshToken: (0, jwt_1.generateRefreshToken)(payload),
    };
};
exports.getUpdatedUserSession = getUpdatedUserSession;
const forgotPassword = async (data) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        return { sent: false, message: "Si el email existe, se envió un enlace de recuperación" };
    }
    const token = (0, crypto_1.randomBytes)(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma_1.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
    });
    await prisma_1.prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            token,
            expiresAt,
        },
    });
    const sent = await (0, email_1.sendPasswordResetEmail)(user.email, token);
    return {
        sent,
        message: sent
            ? "Email de recuperación enviado"
            : "Error al enviar email. Intenta más tarde",
    };
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (data) => {
    const resetToken = await prisma_1.prisma.passwordResetToken.findUnique({
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
    const hashed = await (0, hash_1.hashPassword)(data.password);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: hashed },
        }),
        prisma_1.prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        })
    ]);
    return { message: "Contraseña actualizada exitosamente" };
};
exports.resetPassword = resetPassword;
