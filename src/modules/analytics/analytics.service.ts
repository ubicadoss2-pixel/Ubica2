import { prisma } from "../../config/prisma";
import { CreateAnalyticsDTO } from "./analytics.schema";

export const createAnalyticsEvent = async (data: CreateAnalyticsDTO, userId?: string) => {
  return prisma.analyticsEvent.create({
    data: {
      userId: userId || null,
      eventType: data.eventType,
      placeId: data.placeId,
      eventId: data.eventId,
      meta: data.meta,
    } as any,
  });
};

export const summaryAnalytics = async (ownerId?: string) => {
  const wherePlace = ownerId ? { ownerUserId: ownerId } : {};
  const whereEvent = ownerId ? { place: { ownerUserId: ownerId } } : {};
  const whereOffer = ownerId ? { place: { ownerUserId: ownerId } } : {};
  const whereReservation = ownerId ? { place: { ownerUserId: ownerId } } : {};
  const whereAnalyticsPlace = ownerId ? { place: { ownerUserId: ownerId } } : {};
  const whereAnalyticsEvent = ownerId ? { event: { place: { ownerUserId: ownerId } } } : {};

  const [
    placeViews, eventViews, contactClicks, favoriteAdds, favoriteRemoves, reportCreates,
    totalUsers, totalPlaces, activePlaces, totalEvents, activeEvents, finishedEvents,
    totalFavorites, reviewsCount, averageRating, activeOffers, totalReservations
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: { eventType: "PLACE_VIEW", ...whereAnalyticsPlace } as any }),
    prisma.analyticsEvent.count({ where: { eventType: "EVENT_VIEW", ...whereAnalyticsEvent } as any }),
    prisma.analyticsEvent.count({ where: { eventType: "CONTACT_CLICK", ...whereAnalyticsPlace } as any }),
    prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_ADD", ...whereAnalyticsPlace } as any }),
    prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_REMOVE", ...whereAnalyticsPlace } as any }),
    prisma.analyticsEvent.count({ where: { eventType: "REPORT_CREATE", ...whereAnalyticsPlace } as any }),
    
    ownerId
      ? prisma.analyticsEvent.findMany({
          where: { place: { ownerUserId: ownerId }, userId: { not: null } } as any,
          distinct: ['userId'],
          select: { userId: true }
        }).then(res => res.length)
      : prisma.user.count(),

    prisma.place.count({ where: { deletedAt: null, ...wherePlace } }),
    prisma.place.count({ where: { deletedAt: null, status: "PUBLISHED", ...wherePlace } }),
    prisma.event.count({ where: { deletedAt: null, ...whereEvent } }),
    prisma.event.count({ where: { deletedAt: null, status: "ACTIVE", ...whereEvent } }),
    prisma.event.count({ where: { deletedAt: null, status: "FINISHED", ...whereEvent } as any }),
    
    prisma.favorite.count({ where: ownerId ? { place: { ownerUserId: ownerId } } : {} }),
    prisma.comment.count({ where: { deletedAt: null, ...(ownerId ? { place: { ownerUserId: ownerId } } : {}) } }),
    prisma.comment.aggregate({
      where: { deletedAt: null, rating: { not: null }, ...(ownerId ? { place: { ownerUserId: ownerId } } : {}) },
      _avg: { rating: true }
    }).then(res => res._avg.rating || 0),

    prisma.offer.count({ where: { status: "ACTIVE", ...whereOffer } }),
    prisma.reservation.count({ where: { ...whereReservation } })
  ]);

  let usersByType: any[] = [];
  if (!ownerId) {
    const roles = await prisma.role.findMany();
    const usersByTypeRaw = await prisma.userRole.groupBy({
      by: ['roleId'],
      _count: true
    });
    
    usersByType = usersByTypeRaw.map((r: any) => {
      const role = roles.find(ro => ro.id === r.roleId);
      return {
        role: role ? role.code : 'UNKNOWN',
        total: r._count
      };
    });
  }

  const rawEvents = await prisma.analyticsEvent.findMany({
    where: ownerId ? { place: { ownerUserId: ownerId } } as any : {},
    orderBy: { occurredAt: 'desc' },
    take: 1000,
    include: {
      place: { select: { name: true } },
      user: { select: { fullName: true, email: true } }
    }
  });

  return {
    placeViews,
    eventViews,
    contactClicks,
    favoriteAdds,
    favoriteRemoves,
    reportCreates,
    totalUsers,
    totalPlaces,
    activePlaces,
    totalEvents,
    activeEvents,
    finishedEvents,
    totalFavorites,
    reviewsCount,
    averageRating: parseFloat((averageRating as number).toFixed(1)),
    activeOffers,
    totalReservations,
    usersByType,
    rawEvents
  };
};
