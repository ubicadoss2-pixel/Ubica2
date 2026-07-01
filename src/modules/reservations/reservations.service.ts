import { prisma } from "../../config/prisma";

export const createReservation = async (data: any) => {
  return prisma.reservation.create({
    data: {
      placeId: data.placeId,
      userId: data.userId || null,
      guestName: data.guestName,
      date: data.date,
      time: data.time,
      guests: data.guests,
      reason: data.reason || null,
      observations: data.observations || null,
    }
  });
};

export const getReservationsByOwner = async (
  ownerId: string,
  filters?: { startDate?: string; endDate?: string; placeId?: string }
) => {
  const { startDate, endDate, placeId } = filters || {};

  let dateFilter: any = undefined;
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  const whereClause: any = {
    place: {
      ownerUserId: ownerId,
      ...(placeId ? { id: placeId } : {})
    }
  };

  if (dateFilter) {
    whereClause.createdAt = dateFilter;
  }

  return prisma.reservation.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      },
      place: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};
