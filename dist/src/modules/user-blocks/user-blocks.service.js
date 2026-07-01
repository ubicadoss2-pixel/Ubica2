"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlockedBy = exports.isBlocked = exports.getBlockedUsers = exports.unblockUser = exports.blockUser = exports.blockUserSchema = void 0;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
exports.blockUserSchema = zod_1.z.object({
    blockedId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().max(255).optional(),
});
const blockUser = async (userId, data) => {
    if (userId === data.blockedId) {
        throw new Error("No puedes bloquearte a ti mismo");
    }
    const existing = await prisma_1.prisma.userBlock.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId: userId,
                blockedId: data.blockedId,
            },
        },
    });
    if (existing) {
        throw new Error("Ya has bloqueado a este usuario");
    }
    return prisma_1.prisma.userBlock.create({
        data: {
            blockerId: userId,
            blockedId: data.blockedId,
            reason: data.reason,
        },
        include: {
            blocked: {
                select: { id: true, email: true, fullName: true },
            },
        },
    });
};
exports.blockUser = blockUser;
const unblockUser = async (userId, blockedId) => {
    await prisma_1.prisma.userBlock.deleteMany({
        where: {
            blockerId: userId,
            blockedId,
        },
    });
    return { unblocked: true };
};
exports.unblockUser = unblockUser;
const getBlockedUsers = async (userId) => {
    return prisma_1.prisma.userBlock.findMany({
        where: { blockerId: userId },
        include: {
            blocked: {
                select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getBlockedUsers = getBlockedUsers;
const isBlocked = async (userId, targetUserId) => {
    const block = await prisma_1.prisma.userBlock.findFirst({
        where: {
            OR: [
                { blockerId: userId, blockedId: targetUserId },
                { blockerId: targetUserId, blockedId: userId },
            ],
        },
    });
    return !!block;
};
exports.isBlocked = isBlocked;
const isBlockedBy = async (blockerId, blockedId) => {
    const block = await prisma_1.prisma.userBlock.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId,
            },
        },
    });
    return !!block;
};
exports.isBlockedBy = isBlockedBy;
