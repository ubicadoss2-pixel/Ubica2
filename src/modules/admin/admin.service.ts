import { prisma } from "../../config/prisma";
import { hashPassword } from "../../shared/utils/hash";
import { listReports, updateReport } from "../reports/report.service";
import { summaryAnalytics } from "../analytics/analytics.service";

const audit = async (
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  beforeData?: unknown,
  afterData?: unknown
) => {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      beforeData: beforeData as any,
      afterData: afterData as any,
    },
  });
};

export const updatePlaceStatusAdmin = async (placeId: string, status: string, actorUserId: string) => {
  const before = await prisma.place.findUnique({ where: { id: placeId } });
  if (!before) throw new Error("Negocio no encontrado");

  const place = await prisma.place.update({ where: { id: placeId }, data: { status: status as any } });
  await audit(actorUserId, "PLACE_STATUS_UPDATE", "PLACE", placeId, before, place);
  return place;
};

export const validateBusinessAdmin = async (placeId: string, actorUserId: string) => {
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Negocio no encontrado");
  await audit(actorUserId, "PLACE_VALIDATED", "PLACE", placeId, null, place);
  return { message: "Negocio validado", placeId, status: place.status };
};

export const approveBusinessAdmin = async (placeId: string, actorUserId: string) => {
  return updatePlaceStatusAdmin(placeId, "PUBLISHED", actorUserId);
};

export const updateEventStatusAdmin = async (eventId: string, status: string, actorUserId: string) => {
  const before = await prisma.event.findUnique({ where: { id: eventId } });
  if (!before) throw new Error("Evento no encontrado");

  const event = await prisma.event.update({ where: { id: eventId }, data: { status: status as any } });
  await audit(actorUserId, "EVENT_STATUS_UPDATE", "EVENT", eventId, before, event);
  return event;
};

export const validateEventAdmin = async (eventId: string, actorUserId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Evento no encontrado");
  await audit(actorUserId, "EVENT_VALIDATED", "EVENT", eventId, null, event);
  return { message: "Evento validado", eventId, status: event.status };
};

export const approveEventAdmin = async (eventId: string, actorUserId: string) => {
  return updateEventStatusAdmin(eventId, "ACTIVE", actorUserId);
};

export const listRolesAdmin = async () => {
  return prisma.role.findMany({ orderBy: { createdAt: "desc" } });
};

export const createRoleAdmin = async (data: { code: string; name: string; description?: string }, actorUserId: string) => {
  const role = await prisma.role.create({
    data: {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
  });
  await audit(actorUserId, "ROLE_CREATE", "ROLE", role.id, null, role);
  return role;
};

export const updateRoleAdmin = async (
  id: string,
  data: Partial<{ code: string; name: string; description?: string }>,
  actorUserId: string
) => {
  const before = await prisma.role.findUnique({ where: { id } });
  if (!before) throw new Error("Rol no encontrado");

  const role = await prisma.role.update({
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

export const deleteRoleAdmin = async (id: string, actorUserId: string) => {
  const assigned = await prisma.userRole.count({ where: { roleId: id } });
  if (assigned > 0) throw new Error("No se puede eliminar un rol asignado a usuarios");

  const before = await prisma.role.findUnique({ where: { id } });
  if (!before) throw new Error("Rol no encontrado");

  await prisma.role.delete({ where: { id } });
  await audit(actorUserId, "ROLE_DELETE", "ROLE", id, before, null);
  return { message: "Rol eliminado" };
};

export const listUsersAdmin = async (query: { search?: string; roleCode?: string; includeDeleted?: boolean }) => {
  const where: any = {};

  if (!query.includeDeleted) where.deletedAt = null;
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

  return prisma.user.findMany({
    where,
    include: { userRoles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const createUserAdmin = async (
  data: { email: string; password: string; fullName?: string; phone?: string; roleCode?: string; isActive?: boolean },
  actorUserId: string
) => {
  const roleCode = (data.roleCode || "USER").trim().toUpperCase();
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) throw new Error(`Rol ${roleCode} no existe`);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email ya registrado");

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
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

export const updateUserAdmin = async (
  userId: string,
  data: { fullName?: string; phone?: string; password?: string; roleCode?: string; isActive?: boolean },
  actorUserId: string
) => {
  const before = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!before) throw new Error("Usuario no encontrado");

  const updateData: any = {
    fullName: data.fullName === undefined ? undefined : data.fullName.trim(),
    phone: data.phone === undefined ? undefined : data.phone.trim(),
    isActive: data.isActive,
  };
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (data.roleCode) {
    const role = await prisma.role.findUnique({ where: { code: data.roleCode.trim().toUpperCase() } });
    if (!role) throw new Error(`Rol ${data.roleCode} no existe`);

    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  await audit(actorUserId, "USER_UPDATE", "USER", userId, before, user);
  return user;
};

export const suspendUserAdmin = async (userId: string, actorUserId: string) => {
  return updateUserAdmin(userId, { isActive: false }, actorUserId);
};

export const deleteUserAdmin = async (userId: string, actorUserId: string) => {
  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) throw new Error("Usuario no encontrado");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, deletedAt: new Date() },
  });
  await audit(actorUserId, "USER_DELETE", "USER", userId, before, { deletedAt: new Date() });
  return { message: "Usuario eliminado (borrado lógico)" };
};

export const activityReportAdmin = async () => {
  const [usersTotal, usersActive, usersSuspended, usersDeleted] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true, deletedAt: null } }),
    prisma.user.count({ where: { isActive: false, deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
  ]);

  const [placesTotal, placesDraft, placesPublished, placesSuspended] = await Promise.all([
    prisma.place.count(),
    prisma.place.count({ where: { status: "DRAFT" as any } }),
    prisma.place.count({ where: { status: "PUBLISHED" as any } }),
    prisma.place.count({ where: { status: "SUSPENDED" as any } }),
  ]);

  const [eventsTotal, eventsActive, eventsCancelled, eventsSuspended] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: "ACTIVE" as any } }),
    prisma.event.count({ where: { status: "CANCELLED" as any } }),
    prisma.event.count({ where: { status: "SUSPENDED" as any } }),
  ]);

  const [reportsOpen, reportsInReview, reportsResolved, reportsRejected, analytics] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" as any } }),
    prisma.report.count({ where: { status: "IN_REVIEW" as any } }),
    prisma.report.count({ where: { status: "RESOLVED" as any } }),
    prisma.report.count({ where: { status: "REJECTED" as any } }),
    summaryAnalytics(),
  ]);

  return {
    users: { total: usersTotal, active: usersActive, suspended: usersSuspended, deleted: usersDeleted },
    places: { total: placesTotal, draft: placesDraft, published: placesPublished, suspended: placesSuspended },
    events: { total: eventsTotal, active: eventsActive, cancelled: eventsCancelled, suspended: eventsSuspended },
    reports: { open: reportsOpen, inReview: reportsInReview, resolved: reportsResolved, rejected: reportsRejected },
    analytics,
  };
};

export const listCommentsAdmin = async (query: { status?: string }) => {
  const where: any = {};
  if (query.status) where.status = query.status;

  return (prisma as any).comment.findMany({
    where,
    include: { user: true, place: true, event: true, moderatedBy: true },
    orderBy: { createdAt: "desc" },
  });
};

export const moderateCommentAdmin = async (
  id: string,
  data: { status: string; content?: string },
  actorUserId: string
) => {
  const before = await (prisma as any).comment.findUnique({ where: { id } });
  if (!before) throw new Error("Comentario no encontrado");

  const comment = await (prisma as any).comment.update({
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

export const listConflictsAdmin = async (query: any) => {
  return listReports(query);
};

export const updateConflictAdmin = async (
  id: string,
  data: { status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED" },
  actorUserId: string
) => {
  const before = await prisma.report.findUnique({ where: { id } });
  if (!before) throw new Error("Denuncia no encontrada");
  const report = await updateReport(id, data);
  await audit(actorUserId, "CONFLICT_UPDATE", "REPORT", id, before, report);
  return report;
};

export const listAuditLogs = async () => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { actorUser: true },
  });
};
