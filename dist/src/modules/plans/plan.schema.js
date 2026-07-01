"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribePlanSchema = void 0;
const zod_1 = require("zod");
exports.subscribePlanSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
});
