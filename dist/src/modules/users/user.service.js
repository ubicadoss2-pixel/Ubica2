"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = exports.assignRole = exports.deleteUser = exports.updateUser = exports.getUserById = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = require("../../config/prisma");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const getProfile = async (userId, role) => {
    const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            username: true,
            birthDate: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            userRoles: {
                include: { role: true },
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
    let finalAvatarUrl = data.avatarUrl;
    // Si recibimos un string Base64, lo subimos a Cloudinary
    if (finalAvatarUrl && finalAvatarUrl.startsWith("data:image/")) {
        try {
            const uploadRes = await cloudinary_1.default.uploader.upload(finalAvatarUrl, { folder: "users" });
            finalAvatarUrl = uploadRes.secure_url;
        }
        catch (error) {
            console.error("Error uploading avatar to Cloudinary", error);
            throw new Error("No se pudo subir la imagen de perfil.");
        }
    }
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            fullName: data.fullName,
            username: data.username,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            phone: data.phone,
            avatarUrl: finalAvatarUrl,
        },
        select: {
            id: true,
            email: true,
            username: true,
            birthDate: true,
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
const assignRole = async (userId, roleCode) => {
    const role = await prisma_1.prisma.role.findUnique({
        where: { code: roleCode },
    });
    if (!role) {
        throw new Error("Rol no encontrado en el sistema");
    }
    return await prisma_1.prisma.$transaction(async (tx) => {
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
exports.assignRole = assignRole;
const listUsers = async (query) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const roleCode = query.roleCode;
    const search = query.search;
    const where = {
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
        prisma_1.prisma.user.count({ where }),
        prisma_1.prisma.user.findMany({
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
exports.listUsers = listUsers;
