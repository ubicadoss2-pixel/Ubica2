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
const summaryAnalytics = async (ownerId, filters) => {
    const { startDate, endDate, placeId } = filters || {};
    // Fechas para createdAt / occurredAt
    let dateFilter = undefined;
    if (startDate || endDate) {
        dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate)
            dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    // Base Place filter
    const placeWhere = {};
    if (ownerId)
        placeWhere.ownerUserId = ownerId;
    if (placeId)
        placeWhere.id = placeId;
    const wherePlace = { ...placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) };
    const whereEvent = { place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) };
    const whereOffer = { place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) };
    const whereReservation = { place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) };
    const whereAnalyticsPlace = { place: placeWhere, ...(dateFilter ? { occurredAt: dateFilter } : {}) };
    const whereAnalyticsEventObj = { event: { place: placeWhere }, ...(dateFilter ? { occurredAt: dateFilter } : {}) };
    const [placeViews, eventViews, contactClicks, favoriteAdds, favoriteRemoves, reportCreates, totalUsers, totalPlaces, activePlaces, totalEvents, activeEvents, finishedEvents, totalFavorites, reviewsCount, averageRating, activeOffers, totalReservations] = await Promise.all([
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "PLACE_VIEW", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "EVENT_VIEW", ...whereAnalyticsEventObj } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "CONTACT_CLICK", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_ADD", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_REMOVE", ...whereAnalyticsPlace } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "REPORT_CREATE", ...whereAnalyticsPlace } }),
        ownerId
            ? prisma_1.prisma.analyticsEvent.findMany({
                where: { place: placeWhere, userId: { not: null }, ...(dateFilter ? { occurredAt: dateFilter } : {}) },
                distinct: ['userId'],
                select: { userId: true }
            }).then(res => res.length)
            : prisma_1.prisma.user.count({ where: dateFilter ? { createdAt: dateFilter } : {} }),
        prisma_1.prisma.place.count({ where: { deletedAt: null, ...wherePlace } }),
        prisma_1.prisma.place.count({ where: { deletedAt: null, status: "PUBLISHED", ...wherePlace } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, ...whereEvent } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, status: "ACTIVE", ...whereEvent } }),
        prisma_1.prisma.event.count({ where: { deletedAt: null, status: "FINISHED", ...whereEvent } }),
        prisma_1.prisma.favorite.count({ where: { place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma_1.prisma.comment.count({ where: { deletedAt: null, place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma_1.prisma.comment.aggregate({
            where: { deletedAt: null, rating: { not: null }, place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) },
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
    // AGREGACIONES EXACTAS (Reemplazo de rawEvents)
    // 1. Visitas por Lugar
    const viewEvents = await prisma_1.prisma.analyticsEvent.findMany({
        where: {
            OR: [
                { eventType: "PLACE_VIEW", ...whereAnalyticsPlace },
                { eventType: "EVENT_VIEW", ...whereAnalyticsEventObj }
            ]
        },
        select: {
            occurredAt: true,
            place: { select: { name: true } },
            event: { select: { place: { select: { name: true } } } }
        }
    });
    const placeCounts = {};
    const monthlyCounts = {};
    viewEvents.forEach((e) => {
        const pName = e.place?.name || e.event?.place?.name || 'General';
        placeCounts[pName] = (placeCounts[pName] || 0) + 1;
        const monthStr = new Date(e.occurredAt).toISOString().slice(0, 7);
        monthlyCounts[monthStr] = (monthlyCounts[monthStr] || 0) + 1;
    });
    const sortedPlaces = Object.entries(placeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const visitsByPlace = {
        labels: sortedPlaces.length > 0 ? sortedPlaces.map(x => x[0]) : ['Sin datos'],
        data: sortedPlaces.length > 0 ? sortedPlaces.map(x => x[1]) : [0]
    };
    // 2. Visitas Mensuales
    const visitsByMonth = { labels: [], data: [] };
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStr = d.toISOString().slice(0, 7);
        visitsByMonth.labels.push(d.toLocaleDateString('es-CO', { month: 'short' }));
        visitsByMonth.data.push(monthlyCounts[mStr] || 0);
    }
    // 3. Distribución de Calificaciones
    const ratingDistribution = [0, 0, 0, 0, 0];
    const reviews = await prisma_1.prisma.comment.findMany({
        where: { deletedAt: null, rating: { not: null }, place: placeWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { rating: true }
    });
    reviews.forEach(r => {
        if (r.rating) {
            const rounded = Math.round(r.rating);
            if (rounded >= 1 && rounded <= 5)
                ratingDistribution[rounded - 1]++;
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
        charts: {
            visitsByPlace,
            visitsByMonth,
            ratingDistribution
        }
    };
};
exports.summaryAnalytics = summaryAnalytics;
