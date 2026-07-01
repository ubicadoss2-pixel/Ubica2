import { prisma } from "../../config/prisma";
import { z } from "zod";

export const blockUserSchema = z.object({
  blockedId: z.string().uuid(),
  reason: z.string().max(255).optional(),
});

export type BlockUserDTO = z.infer<typeof blockUserSchema>;

export const blockUser = async (userId: string, data: BlockUserDTO) => {
  if (userId === data.blockedId) {
    throw new Error("No puedes bloquearte a ti mismo");
  }

  const existing = await prisma.userBlock.findUnique({
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

  return prisma.userBlock.create({
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

export const unblockUser = async (userId: string, blockedId: string) => {
  await prisma.userBlock.deleteMany({
    where: {
      blockerId: userId,
      blockedId,
    },
  });
  return { unblocked: true };
};

export const getBlockedUsers = async (userId: string) => {
  return prisma.userBlock.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
        select: { id: true, email: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const isBlocked = async (userId: string, targetUserId: string) => {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
  });
  return !!block;
};

export const isBlockedBy = async (blockerId: string, blockedId: string) => {
  const block = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });
  return !!block;
};
