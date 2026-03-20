"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const prisma_1 = require("../../config/prisma");
const hash_1 = require("../../shared/utils/hash");
const jwt_1 = require("../../shared/utils/jwt");
const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0)
        return "USER";
    return roles[0].role.code;
};
const registerUser = async (data) => {
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new Error("Email ya registrado");
    }
    const hashed = await (0, hash_1.hashPassword)(data.password);
    const userRole = await prisma_1.prisma.role.findUnique({
        where: { code: "USER" },
    });
    if (!userRole) {
        throw new Error("Rol USER no configurado");
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            passwordHash: hashed,
            userRoles: {
                create: [{ roleId: userRole.id }],
            },
        },
        include: { userRoles: { include: { role: true } } },
    });
    const roleCode = getPrimaryRole(user.userRoles);
    const payload = {
        id: user.id,
        role: roleCode,
        email: user.email,
    };
    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: roleCode,
        },
        accessToken: (0, jwt_1.generateAccessToken)(payload),
        refreshToken: (0, jwt_1.generateRefreshToken)(payload),
    };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
        include: { userRoles: { include: { role: true } } },
    });
    if (!user || !user.passwordHash) {
        throw new Error("Credenciales invalidas");
    }
    const valid = await (0, hash_1.comparePassword)(data.password, user.passwordHash);
    if (!valid) {
        throw new Error("Credenciales invalidas");
    }
    const roleCode = getPrimaryRole(user.userRoles);
    const payload = {
        id: user.id,
        role: roleCode,
        email: user.email,
    };
    return {
        accessToken: (0, jwt_1.generateAccessToken)(payload),
        refreshToken: (0, jwt_1.generateRefreshToken)(payload),
    };
};
exports.loginUser = loginUser;
