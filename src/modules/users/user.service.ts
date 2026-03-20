import { prisma } from "../../config/prisma";
import { UpdateUserDTO } from "./user.schema";

export const getProfile = async (userId: string, role: string) => {
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      userRoles: {
        include: { role: true },
      },
      userSubscriptions: {
        where: { isActive: true },
        include: { plan: true },
      },
      favorites: {
        include: { place: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      analytics: {
        take: 10,
        orderBy: { occurredAt: "desc" },
      },
      places: isOwnerOrAdmin ? {
        include: {
          city: true,
          placeType: true,
          events: {
            where: { deletedAt: null },
            include: { category: true }
          },
          _count: {
            select: { favorites: true, comments: true },
          },
        },
      } : false,
      _count: isOwnerOrAdmin ? {
        select: { places: true, analytics: true }
      } : false,
    },
  });

  return user;
};

export const updateProfile = async (userId: string, data: UpdateUserDTO) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
    }
  });
};
