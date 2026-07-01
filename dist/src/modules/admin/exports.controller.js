"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = void 0;
const exports_service_1 = require("./exports.service");
const exportReport = async (req, res) => {
    try {
        const { type, format, dateFrom, dateTo } = req.query;
        if (!type || !format) {
            return res.status(400).json({ message: "type y format son obligatorios" });
        }
        if (format === "excel") {
            const buffer = await (0, exports_service_1.generateExcelReport)(type, dateFrom, dateTo);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=report_${type}.xlsx`);
            return res.send(buffer);
        }
        else if (format === "pdf") {
            const buffer = await (0, exports_service_1.generatePDFReport)(type, dateFrom, dateTo);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=report_${type}.pdf`);
            return res.send(buffer);
        }
        else {
            return res.status(400).json({ message: "Formato no soportado" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Error generando reporte" });
    }
};
exports.exportReport = exportReport;
