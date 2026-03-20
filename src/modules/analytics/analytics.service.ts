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

export const summaryAnalytics = async () => {
  const [placeViews, eventViews, contactClicks, favoriteAdds, favoriteRemoves, reportCreates] =
    await Promise.all([
      prisma.analyticsEvent.count({ where: { eventType: "PLACE_VIEW" } as any }),
      prisma.analyticsEvent.count({ where: { eventType: "EVENT_VIEW" } as any }),
      prisma.analyticsEvent.count({ where: { eventType: "CONTACT_CLICK" } as any }),
      prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_ADD" } as any }),
      prisma.analyticsEvent.count({ where: { eventType: "FAVORITE_REMOVE" } as any }),
      prisma.analyticsEvent.count({ where: { eventType: "REPORT_CREATE" } as any }),
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
