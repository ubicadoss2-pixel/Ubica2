import { Request, Response } from "express";
import { generateExcelReport, generatePDFReport } from "./exports.service";

export const exportReport = async (req: Request, res: Response) => {
  try {
    const { type, format, dateFrom, dateTo } = req.query;

    if (!type || !format) {
      return res.status(400).json({ message: "type y format son obligatorios" });
    }

    if (format === "excel") {
      const buffer = await generateExcelReport(type as string, dateFrom as string, dateTo as string);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=report_${type}.xlsx`);
      return res.send(buffer);
    } else if (format === "pdf") {
      const buffer = await generatePDFReport(type as string, dateFrom as string, dateTo as string);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=report_${type}.pdf`);
      return res.send(buffer);
    } else {
      return res.status(400).json({ message: "Formato no soportado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error generando reporte" });
  }
};
