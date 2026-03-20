"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = exports.updateConflictAdmin = exports.listConflictsAdmin = exports.moderateCommentAdmin = exports.listCommentsAdmin = exports.activityReportAdmin = exports.deleteUserAdmin = exports.suspendUserAdmin = exports.updateUserAdmin = exports.createUserAdmin = exports.listUsersAdmin = exports.deleteRoleAdmin = exports.updateRoleAdmin = exports.createRoleAdmin = exports.listRolesAdmin = exports.approveEventAdmin = exports.validateEventAdmin = exports.updateEventStatusAdmin = exports.approveBusinessAdmin = exports.validateBusinessAdmin = exports.updatePlaceStatusAdmin = void 0;
const prisma_1 = require("../../config/prisma");
const hash_1 = require("../../shared/utils/hash");
const report_service_1 = require("../reports/report.service");
const analytics_service_1 = require("../analytics/analytics.service");
const audit = async (actorUserId, action, entityType, entityId, beforeData, afterData) => {
    await prisma_1.prisma.auditLog.create({
        data: {
            actorUserId,
            action,
            entityType,
            entityId,
            beforeData: beforeData,
            afterData: afterData,
        },
    });
};
const updatePlaceStatusAdmin = async (placeId, status, actorUserId) => {
    const before = await prisma_1.prisma.place.findUnique({ where: { id: placeId } });
    if (!before)
        throw new Error("Negocio no encontrado");
    const place = await prisma_1.prisma.place.update({ where: { id: placeId }, data: { status: status } });
    await audit(actorUserId, "PLACE_STATUS_UPDATE", "PLACE", placeId, before, place);
    return place;
};
exports.updatePlaceStatusAdmin = updatePlaceStatusAdmin;
const validateBusinessAdmin = async (placeId, actorUserId) => {
    const place = await prisma_1.prisma.place.findUnique({ where: { id: placeId } });
    if (!place)
        throw new Error("Negocio no encontrado");
    await audit(actorUserId, "PLACE_VALIDATED", "PLACE", placeId, null, place);
    return { message: "Negocio validado", placeId, status: place.status };
};
exports.validateBusinessAdmin = validateBusinessAdmin;
const approveBusinessAdmin = async (placeId, actorUserId) => {
    return (0, exports.updatePlaceStatusAdmin)(placeId, "PUBLISHED", actorUserId);
};
exports.approveBusinessAdmin = approveBusinessAdmin;
const updateEventStatusAdmin = async (eventId, status, actorUserId) => {
    const before = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
    if (!before)
        throw new Error("Evento no encontrado");
    const event = await prisma_1.prisma.event.update({ where: { id: eventId }, data: { status: status } });
    await audit(actorUserId, "EVENT_STATUS_UPDATE", "EVENT", eventId, before, event);
    return event;
};
exports.updateEventStatusAdmin = updateEventStatusAdmin;
const validateEventAdmin = async (eventId, actorUserId) => {
    const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        throw new Error("Evento no encontrado");
    await audit(actorUserId, "EVENT_VALIDATED", "EVENT", eventId, null, event);
    return { message: "Evento validado", eventId, status: event.status };
};
exports.validateEventAdmin = validateEventAdmin;
const approveEventAdmin = async (eventId, actorUserId) => {
    return (0, exports.updateEventStatusAdmin)(eventId, "ACTIVE", actorUserId);
};
exports.approveEventAdmin = approveEventAdmin;
const listRolesAdmin = async () => {
    return prisma_1.prisma.role.findMany({ orderBy: { createdAt: "desc" } });
};
exports.listRolesAdmin = listRolesAdmin;
const createRoleAdmin = async (data, actorUserId) => {
    const role = await prisma_1.prisma.role.create({
        data: {
            code: data.code.trim().toUpperCase(),
            name: data.name.trim(),
            description: data.description?.trim() || null,
        },
    });
    await audit(actorUserId, "ROLE_CREATE", "ROLE", role.id, null, role);
    return role;
};
exports.createRoleAdmin = createRoleAdmin;
const updateRoleAdmin = async (id, data, actorUserId) => {
    const before = await prisma_1.prisma.role.findUnique({ where: { id } });
    if (!before)
        throw new Error("Rol no encontrado");
    const role = await prisma_1.prisma.role.update({
        where: { id },
        data: {
            code: data.code?.trim().toUpperCase(),
            name: data.name?.trim(),
            description: data.description === undefined ? undefined : data.description?.trim() || null,
        },
    });
    await audit(actorUserId, "ROLE_UPDATE", "ROLE", id, before, role);
    return role;
};
exports.updateRoleAdmin = updateRoleAdmin;
const deleteRoleAdmin = async (id, actorUserId) => {
    const assigned = await prisma_1.prisma.userRole.count({ where: { roleId: id } });
    if (assigned > 0)
        throw new Error("No se puede eliminar un rol asignado a usuarios");
    const before = await prisma_1.prisma.role.findUnique({ where: { id } });
    if (!before)
        throw new Error("Rol no encontrado");
    await prisma_1.prisma.role.delete({ where: { id } });
    await audit(actorUserId, "ROLE_DELETE", "ROLE", id, before, null);
    return { message: "Rol eliminado" };
};
exports.deleteRoleAdmin = deleteRoleAdmin;
const listUsersAdmin = async (query) => {
    const where = {};
    if (!query.includeDeleted)
        where.deletedAt = null;
    if (query.search) {
        where.OR = [
            { email: { contains: query.search } },
            { fullName: { contains: query.search } },
            { phone: { contains: query.search } },
        ];
    }
    if (query.roleCode) {
        where.userRoles = { some: { role: { code: query.roleCode.trim().toUpperCase() } } };
    }
    return prisma_1.prisma.user.findMany({
        where,
        include: { userRoles: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
    });
};
exports.listUsersAdmin = listUsersAdmin;
const createUserAdmin = async (data, actorUserId) => {
    const roleCode = (data.roleCode || "USER").trim().toUpperCase();
    const role = await prisma_1.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role)
        throw new Error(`Rol ${roleCode} no existe`);
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new Error("Email ya registrado");
    const passwordHash = await (0, hash_1.hashPassword)(data.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email.trim().toLowerCase(),
            fullName: data.fullName?.trim(),
            phone: data.phone?.trim(),
            isActive: data.isActive ?? true,
            passwordHash,
            userRoles: { create: [{ roleId: role.id }] },
        },
        include: { userRoles: { include: { role: true } } },
    });
    await audit(actorUserId, "USER_CREATE", "USER", user.id, null, user);
    return user;
};
exports.createUserAdmin = createUserAdmin;
const updateUserAdmin = async (userId, data, actorUserId) => {
    const before = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
    });
    if (!before)
        throw new Error("Usuario no encontrado");
    const updateData = {
        fullName: data.fullName === undefined ? undefined : data.fullName.trim(),
        phone: data.phone === undefined ? undefined : data.phone.trim(),
        isActive: data.isActive,
    };
    if (data.password)
        updateData.passwordHash = await (0, hash_1.hashPassword)(data.password);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: updateData,
    });
    if (data.roleCode) {
        const role = await prisma_1.prisma.role.findUnique({ where: { code: data.roleCode.trim().toUpperCase() } });
        if (!role)
            throw new Error(`Rol ${data.roleCode} no existe`);
        await prisma_1.prisma.userRole.deleteMany({ where: { userId } });
        await prisma_1.prisma.userRole.create({ data: { userId, roleId: role.id } });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
    });
    await audit(actorUserId, "USER_UPDATE", "USER", userId, before, user);
    return user;
};
exports.updateUserAdmin = updateUserAdmin;
const suspendUserAdmin = async (userId, actorUserId) => {
    return (0, exports.updateUserAdmin)(userId, { isActive: false }, actorUserId);
};
exports.suspendUserAdmin = suspendUserAdmin;
const deleteUserAdmin = async (userId, actorUserId) => {
    const before = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!before)
        throw new Error("Usuario no encontrado");
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { isActive: false, deletedAt: new Date() },
    });
    await audit(actorUserId, "USER_DELETE", "USER", userId, before, { deletedAt: new Date() });
    return { message: "Usuario eliminado (borrado lógico)" };
};
exports.deleteUserAdmin = deleteUserAdmin;
const activityReportAdmin = async () => {
    const [usersTotal, usersActive, usersSuspended, usersDeleted] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        prisma_1.prisma.user.count({ where: { isActive: false, deletedAt: null } }),
        prisma_1.prisma.user.count({ where: { deletedAt: { not: null } } }),
    ]);
    const [placesTotal, placesDraft, placesPublished, placesSuspended] = await Promise.all([
        prisma_1.prisma.place.count(),
        prisma_1.prisma.place.count({ where: { status: "DRAFT" } }),
        prisma_1.prisma.place.count({ where: { status: "PUBLISHED" } }),
        prisma_1.prisma.place.count({ where: { status: "SUSPENDED" } }),
    ]);
    const [eventsTotal, eventsActive, eventsCancelled, eventsSuspended] = await Promise.all([
        prisma_1.prisma.event.count(),
        prisma_1.prisma.event.count({ where: { status: "ACTIVE" } }),
        prisma_1.prisma.event.count({ where: { status: "CANCELLED" } }),
        prisma_1.prisma.event.count({ where: { status: "SUSPENDED" } }),
    ]);
    const [reportsOpen, reportsInReview, reportsResolved, reportsRejected, analytics] = await Promise.all([
        prisma_1.prisma.report.count({ where: { status: "OPEN" } }),
        prisma_1.prisma.report.count({ where: { status: "IN_REVIEW" } }),
        prisma_1.prisma.report.count({ where: { status: "RESOLVED" } }),
        prisma_1.prisma.report.count({ where: { status: "REJECTED" } }),
        (0, analytics_service_1.summaryAnalytics)(),
    ]);
    return {
        users: { total: usersTotal, active: usersActive, suspended: usersSuspended, deleted: usersDeleted },
        places: { total: placesTotal, draft: placesDraft, published: placesPublished, suspended: placesSuspended },
        events: { total: eventsTotal, active: eventsActive, cancelled: eventsCancelled, suspended: eventsSuspended },
        reports: { open: reportsOpen, inReview: reportsInReview, resolved: reportsResolved, rejected: reportsRejected },
        analytics,
    };
};
exports.activityReportAdmin = activityReportAdmin;
const listCommentsAdmin = async (query) => {
    const where = {};
    if (query.status)
        where.status = query.status;
    return prisma_1.prisma.comment.findMany({
        where,
        include: { user: true, place: true, event: true, moderatedBy: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.listCommentsAdmin = listCommentsAdmin;
const moderateCommentAdmin = async (id, data, actorUserId) => {
    const before = await prisma_1.prisma.comment.findUnique({ where: { id } });
    if (!before)
        throw new Error("Comentario no encontrado");
    const comment = await prisma_1.prisma.comment.update({
        where: { id },
        data: {
            status: data.status,
            content: data.content ?? undefined,
            moderatedById: actorUserId,
            moderatedAt: new Date(),
        },
    });
    await audit(actorUserId, "COMMENT_MODERATE", "COMMENT", id, before, comment);
    return comment;
};
exports.moderateCommentAdmin = moderateCommentAdmin;
const listConflictsAdmin = async (query) => {
    return (0, report_service_1.listReports)(query);
};
exports.listConflictsAdmin = listConflictsAdmin;
const updateConflictAdmin = async (id, data, actorUserId) => {
    const before = await prisma_1.prisma.report.findUnique({ where: { id } });
    if (!before)
        throw new Error("Denuncia no encontrada");
    const report = await (0, report_service_1.updateReport)(id, data);
    await audit(actorUserId, "CONFLICT_UPDATE", "REPORT", id, before, report);
    return report;
};
exports.updateConflictAdmin = updateConflictAdmin;
const listAuditLogs = async () => {
    return prisma_1.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: { actorUser: true },
    });
};
exports.listAuditLogs = listAuditLogs;
