"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoriteSchema = void 0;
const zod_1 = require("zod");
exports.favoriteSchema = zod_1.z.object({
    placeId: zod_1.z.string().uuid(),
});
