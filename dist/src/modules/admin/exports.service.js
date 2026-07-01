"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFReport = exports.generateExcelReport = void 0;
const prisma_1 = require("../../config/prisma");
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateExcelReport = async (type, dateFrom, dateTo) => {
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet("Reporte");
    const whereClause = {};
    if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom)
            whereClause.createdAt.gte = new Date(dateFrom);
        if (dateTo)
            whereClause.createdAt.lte = new Date(dateTo);
    }
    if (type === "USERS") {
        worksheet.columns = [
            { header: "ID", key: "id", width: 30 },
            { header: "Nombre", key: "fullName", width: 30 },
            { header: "Email", key: "email", width: 30 },
            { header: "Fecha Creación", key: "createdAt", width: 25 },
        ];
        const data = await prisma_1.prisma.user.findMany({ where: whereClause });
        data.forEach(item => worksheet.addRow(item));
    }
    else if (type === "EVENTS") {
        worksheet.columns = [
            { header: "ID", key: "id", width: 30 },
            { header: "Título", key: "title", width: 30 },
            { header: "Estado", key: "status", width: 15 },
            { header: "Fecha Creación", key: "createdAt", width: 25 },
        ];
        const data = await prisma_1.prisma.event.findMany({ where: whereClause });
        data.forEach(item => worksheet.addRow(item));
    }
    else if (type === "TRANSACTIONS") {
        worksheet.columns = [
            { header: "ID", key: "id", width: 30 },
            { header: "Monto", key: "amount", width: 15 },
            { header: "Estado", key: "status", width: 15 },
            { header: "Fecha Creación", key: "createdAt", width: 25 },
        ];
        const data = await prisma_1.prisma.paymentTransaction.findMany({ where: whereClause });
        data.forEach(item => worksheet.addRow({ ...item, amount: Number(item.amount) }));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};
exports.generateExcelReport = generateExcelReport;
const generatePDFReport = async (type, dateFrom, dateTo) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default();
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(20).text(`Reporte de ${type}`, { align: "center" });
            doc.moveDown();
            if (dateFrom || dateTo) {
                doc.fontSize(12).text(`Fechas: ${dateFrom || 'N/A'} - ${dateTo || 'N/A'}`, { align: "center" });
                doc.moveDown();
            }
            const whereClause = {};
            if (dateFrom || dateTo) {
                whereClause.createdAt = {};
                if (dateFrom)
                    whereClause.createdAt.gte = new Date(dateFrom);
                if (dateTo)
                    whereClause.createdAt.lte = new Date(dateTo);
            }
            if (type === "USERS") {
                const data = await prisma_1.prisma.user.findMany({ where: whereClause });
                data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Nombre: ${item.fullName || 'N/A'} | Email: ${item.email}`));
            }
            else if (type === "EVENTS") {
                const data = await prisma_1.prisma.event.findMany({ where: whereClause });
                data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Título: ${item.title} | Estado: ${item.status}`));
            }
            else if (type === "TRANSACTIONS") {
                const data = await prisma_1.prisma.paymentTransaction.findMany({ where: whereClause });
                data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Monto: ${item.amount?.toString()} | Estado: ${item.status}`));
            }
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
};
exports.generatePDFReport = generatePDFReport;
