"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeStatus = exports.listVerifications = exports.createVerification = exports.getMyVerification = void 0;
const prisma_1 = require("../../config/prisma");
const getMyVerification = async (userId) => {
    // @ts-ignore
    return prisma_1.prisma.verification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getMyVerification = getMyVerification;
const createVerification = async (data) => {
    // @ts-ignore
    const existing = await prisma_1.prisma.verification.findFirst({
        where: { userId: data.userId, status: "PENDING" }
    });
    if (existing) {
        throw new Error("Ya tienes una verificación pendiente.");
    }
    // @ts-ignore
    return prisma_1.prisma.verification.create({
        data: {
            userId: data.userId,
            fullName: data.fullName,
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            fileUrl: data.fileUrl,
            status: "PENDING",
        }
    });
};
exports.createVerification = createVerification;
const listVerifications = async () => {
    // @ts-ignore
    return prisma_1.prisma.verification.findMany({
        include: {
            user: {
                select: { email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};
exports.listVerifications = listVerifications;
const changeStatus = async (id, status) => {
    // @ts-ignore
    const v = await prisma_1.prisma.verification.update({
        where: { id },
        data: { status }
    });
    if (status === 'APPROVED' && v) {
        const ownerRole = await prisma_1.prisma.role.findUnique({
            where: { code: 'OWNER' }
        });
        if (ownerRole) {
            // Create or update userRole for this user
            await prisma_1.prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: v.userId,
                        roleId: ownerRole.id
                    }
                },
                create: {
                    userId: v.userId,
                    roleId: ownerRole.id
                },
                update: {} // do nothing if it exists
            });
        }
    }
    return v;
};
exports.changeStatus = changeStatus;
