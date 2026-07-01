"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryAnalytics = exports.createAnalyticsEvent = void 0;
const prisma_1 = require("../../config/prisma");
const createAnalyticsEvent = async (data, userId) => {
    return prisma_1.prisma.analyticsEvent.create({
        data: {
            userId: userId || null,
            eventType: data.eventType,
            placeId: data.placeId,
            eventId: data.eventId,
            meta: data.meta,
        },
    });
};
exports.createAnalyticsEvent = createAnalyticsEvent;
const summaryAnalytics = async (ownerId) => {
    const wherePlace = ownerId ? { ownerUserId: ownerId } : {};
    const whereEvent = ownerId ? { place: { ownerUserId: ownerId } } : {};
    const whereOffer = ownerId ? { place: { ownerUserId: ownerId } } : {};
    const whereReservation = ownerId ? { place: { ownerUserId: ownerId } } : {};
    const whereAnalyticsPlace = ownerId ? { place: { ownerUserId: ownerId } } : {};
    const whereAnalyticsEvent = ownerId ? { event: { place: { ownerUserId: ownerId } } } : {};
    const [placeViews, eventViews, contactClicks, favoriteAdds, favoriteRemoves, reportCreates, totalUsers, totalPlaces, activePlaces, totalEvents, activeEvents, finishedEvents, totalFavorites, reviewsCount, averageRating, activeOffers, totalReservations] = await Promise.all([
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "PLACE_VIEW", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "EVENT_VIEW", ...whereAnalyticsEvent } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "CONTACT_CLICK", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_ADD", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_REMOVE", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "REPORT_CREATE", ...whereAnalyticsPlace } }),
        ownerId
            ? prisma_1.prisma.analyticsEvent.findMany({
                where: { place: { ownerUserId: ownerId }, userId: { not: null } },
                distinct: ['userId'],
                select: { userId: true }
            }).then(res => res.length)
            : prisma_1.prisma.user.count(),
        prisma_1.prisma.place.count({ where: { deletedAt: null, ...wherePlace } }),
        prisma_1.prisma.place.count({ where: { deletedAt: null, status: "PUBLISHED", ...wherePlace } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, ...whereEvent } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, status: "ACTIVE", ...whereEvent } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, status: "FINISHED", ...whereEvent } }),
        prisma_1.prisma.favorite.count({ where: ownerId ? { place: { ownerUserId: ownerId } } : {} }),
        prisma_1.prisma.comment.count({ where: { deletedAt: null, ...(ownerId ? { place: { ownerUserId: ownerId } } : {}) } }),
        prisma_1.prisma.comment.aggregate({
            where: { deletedAt: null, rating: { not: null }, ...(ownerId ? { place: { ownerUserId: ownerId } } : {}) },
            _avg: { rating: true }
        }).then(res => res._avg.rating || 0),
        prisma_1.prisma.offer.count({ where: { status: "ACTIVE", ...whereOffer } }),
        prisma_1.prisma.reservation.count({ where: { ...whereReservation } })
    ]);
    let usersByType = [];
    if (!ownerId) {
        const roles = await prisma_1.prisma.role.findMany();
        const usersByTypeRaw = await prisma_1.prisma.userRole.groupBy({
            by: ['roleId'],
            _count: true
        });
        usersByType = usersByTypeRaw.map((r) => {
            const role = roles.find(ro => ro.id === r.roleId);
            return {
                role: role ? role.code : 'UNKNOWN',
                total: r._count
            };
        });
    }
    const rawEvents = await prisma_1.prisma.analyticsEvent.findMany({
        where: ownerId ? { place: { ownerUserId: ownerId } } : {},
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
        averageRating: parseFloat(averageRating.toFixed(1)),
        activeOffers,
        totalReservations,
        usersByType,
        rawEvents
    };
};
exports.summaryAnalytics = summaryAnalytics;
