"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportUpdateSchema = exports.commentModerationSchema = exports.userUpdateSchema = exports.userCreateSchema = exports.roleUpdateSchema = exports.roleCreateSchema = exports.eventStatusSchema = exports.placeStatusSchema = void 0;
const zod_1 = require("zod");
exports.placeStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]),
});
exports.eventStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "CANCELLED", "SUSPENDED"]),
});
exports.roleCreateSchema = zod_1.z.object({
    code: zod_1.z.string().min(2).max(50),
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().max(255).optional(),
});
exports.roleUpdateSchema = exports.roleCreateSchema.partial();
exports.userCreateSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().min(3).max(160).optional(),
    phone: zod_1.z.string().min(7).max(30).optional(),
    roleCode: zod_1.z.string().min(2).max(50).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.userUpdateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(3).max(160).optional(),
    phone: zod_1.z.string().min(7).max(30).optional(),
    password: zod_1.z.string().min(6).optional(),
    roleCode: zod_1.z.string().min(2).max(50).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.commentModerationSchema = zod_1.z.object({
    status: zod_1.z.enum(["VISIBLE", "EDITED", "HIDDEN", "BLOCKED"]),
    content: zod_1.z.string().min(1).max(1000).optional(),
});
exports.reportUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});
