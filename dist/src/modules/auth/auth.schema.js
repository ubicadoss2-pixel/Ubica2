"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Formato de email inválido"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    fullName: zod_1.z.string().min(3, "El nombre es muy corto").max(160),
    username: zod_1.z.string().min(3, "El alias es muy corto").max(100),
    phone: zod_1.z.string().min(7).max(30).optional(),
    birthDate: zod_1.z.string().optional(),
    role: zod_1.z.enum(["USER", "OWNER"]).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(6),
});
