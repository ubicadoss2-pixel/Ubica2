"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setManyPreferencesSchema = exports.setPreferenceSchema = void 0;
const zod_1 = require("zod");
exports.setPreferenceSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).max(60),
    value: zod_1.z.string().min(1),
});
exports.setManyPreferencesSchema = zod_1.z.object({
    preferences: zod_1.z.array(zod_1.z.object({
        key: zod_1.z.string().min(1).max(60),
        value: zod_1.z.string().min(1),
    })),
});
