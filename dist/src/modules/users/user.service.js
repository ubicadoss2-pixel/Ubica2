"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = require("../../config/prisma");
const getProfile = async (userId, role) => {
    const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
    const user = await prisma_1.prisma.user.findUnique({
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
exports.getProfile = getProfile;
const updateProfile = async (userId, data) => {
    return prisma_1.prisma.user.update({
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
exports.updateProfile = updateProfile;
const getUserById = async (id) => {
    return prisma_1.prisma.user.findUnique({
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
exports.getUserById = getUserById;
const updateUser = async (id, data) => {
    return prisma_1.prisma.user.update({
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
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    return await prisma_1.prisma.$transaction(async (tx) => {
        // 1. Limpiar relaciones dependientes si es necesario (ej: roles)
        await tx.userRole.deleteMany({ where: { userId: id } });
        // 2. Eliminar al usuario
        return await tx.user.delete({
            where: { id },
        });
    });
};
exports.deleteUser = deleteUser;
