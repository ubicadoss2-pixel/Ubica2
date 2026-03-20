import { Request, Response } from "express";
import { createReportSchema, updateReportSchema } from "./report.schema";
import { createReport, listReports, updateReport } from "./report.service";
import { prisma } from "../../config/prisma";

export const create = async (req: any, res: Response) => {
  try {
    const payload = createReportSchema.parse(req.body);
    const report = await createReport(payload, req.user?.id);

    await prisma.analyticsEvent.create({
      data: {
        userId: req.user?.id || null,
        placeId: payload.placeId,
        eventId: payload.eventId,
        eventType: "REPORT_CREATE",
      } as any,
    });

    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const items = await listReports(req.query);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const payload = updateReportSchema.parse(req.body);
    const reportId = String(req.params.id);
    const report = await updateReport(reportId, payload);
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
