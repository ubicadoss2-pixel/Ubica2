import { prisma } from "../../config/prisma";
import { CreateReportDTO, UpdateReportDTO } from "./report.schema";

export const createReport = async (data: CreateReportDTO, userId?: string) => {
  if (data.targetType === "PLACE" && !data.placeId) {
    throw new Error("placeId es requerido");
  }
  if (data.targetType === "EVENT" && !data.eventId) {
    throw new Error("eventId es requerido");
  }

  return prisma.report.create({
    data: {
      userId: userId || null,
      targetType: data.targetType,
      placeId: data.placeId,
      eventId: data.eventId,
      reason: data.reason,
      details: data.details,
    } as any,
  });
};

export const listReports = async (query: any) => {
  const status = query.status as string | undefined;
  const where: any = {};
  if (status) where.status = status;

  return prisma.report.findMany({
    where,
    include: { place: true, event: true, user: true },
    orderBy: { createdAt: "desc" },
  });
};

export const updateReport = async (id: string, data: UpdateReportDTO) => {
  return prisma.report.update({
    where: { id },
    data: {
      status: data.status,
      resolvedAt: ["RESOLVED", "REJECTED"].includes(data.status)
        ? new Date()
        : null,
    },
  });
};
