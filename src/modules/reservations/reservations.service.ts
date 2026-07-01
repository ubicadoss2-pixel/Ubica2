import { prisma } from "../../server";

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

export const getReservationsByOwner = async (ownerId: string) => {
  return prisma.reservation.findMany({
    where: {
      place: {
        ownerUserId: ownerId
      }
    },
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
