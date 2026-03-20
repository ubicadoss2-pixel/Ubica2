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

export const summary = async (_req: Request, res: Response) => {
  try {
    const data = await summaryAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

