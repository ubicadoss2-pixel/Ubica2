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

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      userRoles: {
        include: { role: true },
      },
    },
  });
};

export const updateUser = async (id: string, data: UpdateUserDTO) => {
  return prisma.user.update({
    where: { id },
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

export const deleteUser = async (id: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Limpiar relaciones dependientes si es necesario (ej: roles)
    await tx.userRole.deleteMany({ where: { userId: id } });
    
    // 2. Eliminar al usuario
    return await tx.user.delete({
      where: { id },
    });
  });
};

export const assignRole = async (userId: string, roleCode: string) => {
  const role = await prisma.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    throw new Error("Rol no encontrado en el sistema");
  }

  return await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({
      where: { userId },
    });

    await tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        userRoles: { include: { role: true } },
      },
    });
  });
};

export const listUsers = async (query: any) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const skip = (page - 1) * pageSize;

  const roleCode = query.roleCode as string | undefined;
  const search = query.search as string | undefined;

  const where: any = {
    deletedAt: null,
  };

  if (roleCode) {
    where.userRoles = {
      some: {
        role: {
          code: roleCode,
        },
      },
    };
  }

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { fullName: { contains: search } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: { role: true },
        },
      },
    }),
  ]);

  return {
    page,
    pageSize,
    total,
    items,
  };
};
