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
const summaryAnalytics = async () => {
    const [placeViews, eventViews, contactClicks, favoriteAdds, favoriteRemoves, reportCreates] = await Promise.all([
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "PLACE_VIEW" } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "EVENT_VIEW" } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "CONTACT_CLICK" } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_ADD" } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_REMOVE" } }),
        prisma_1.prisma.analyticsEvent.count({ where: { eventType: "REPORT_CREATE" } }),
    ]);
    return {
        placeViews,
        eventViews,
        contactClicks,
        favoriteAdds,
        favoriteRemoves,
        reportCreates,
    };
};
exports.summaryAnalytics = summaryAnalytics;
