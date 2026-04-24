"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().max(160).optional(),
    phone: zod_1.z.string().max(30).optional(),
    avatarUrl: zod_1.z.string().url().max(500).optional().or(zod_1.z.literal("")),
});
