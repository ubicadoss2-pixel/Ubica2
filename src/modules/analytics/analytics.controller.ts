import { Request, Response } from "express";
import { createAnalyticsSchema } from "./analytics.schema";
import { createAnalyticsEvent, summaryAnalytics } from "./analytics.service";

export const create = async (req: any, res: Response) => {
  try {
    const payload = createAnalyticsSchema.parse(req.body);
    const event = await createAnalyticsEvent(payload, req.user?.id);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const summary = async (req: any, res: Response) => {
  try {
    const role = req.user.role;
    let ownerId: string | undefined;

    if (role === "OWNER") {
      ownerId = req.user.id;
    } else if (role === "ADMIN") {
      ownerId = req.query.ownerId ? String(req.query.ownerId) : undefined;
    }

    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const placeId = req.query.placeId && req.query.placeId !== 'all' ? String(req.query.placeId) : undefined;

    const data = await summaryAnalytics(ownerId, { startDate, endDate, placeId });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

