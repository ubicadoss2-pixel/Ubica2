import { prisma } from "../../config/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const generateExcelReport = async (type: string, dateFrom?: string, dateTo?: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte");

  const whereClause: any = {};
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }

  if (type === "USERS") {
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre", key: "fullName", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Fecha Creación", key: "createdAt", width: 25 },
    ];
    const data = await prisma.user.findMany({ where: whereClause });
    data.forEach(item => worksheet.addRow(item));
  } else if (type === "EVENTS") {
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Título", key: "title", width: 30 },
      { header: "Estado", key: "status", width: 15 },
      { header: "Fecha Creación", key: "createdAt", width: 25 },
    ];
    const data = await prisma.event.findMany({ where: whereClause });
    data.forEach(item => worksheet.addRow(item));
  } else if (type === "TRANSACTIONS") {
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Monto", key: "amount", width: 15 },
      { header: "Estado", key: "status", width: 15 },
      { header: "Fecha Creación", key: "createdAt", width: 25 },
    ];
    const data = await prisma.paymentTransaction.findMany({ where: whereClause });
    data.forEach(item => worksheet.addRow({ ...item, amount: Number(item.amount) }));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generatePDFReport = async (type: string, dateFrom?: string, dateTo?: string): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks: any[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text(`Reporte de ${type}`, { align: "center" });
      doc.moveDown();

      if (dateFrom || dateTo) {
        doc.fontSize(12).text(`Fechas: ${dateFrom || 'N/A'} - ${dateTo || 'N/A'}`, { align: "center" });
        doc.moveDown();
      }

      const whereClause: any = {};
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
        if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
      }

      if (type === "USERS") {
        const data = await prisma.user.findMany({ where: whereClause });
        data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Nombre: ${item.fullName || 'N/A'} | Email: ${item.email}`));
      } else if (type === "EVENTS") {
        const data = await prisma.event.findMany({ where: whereClause });
        data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Título: ${item.title} | Estado: ${item.status}`));
      } else if (type === "TRANSACTIONS") {
        const data = await prisma.paymentTransaction.findMany({ where: whereClause });
        data.forEach(item => doc.fontSize(10).text(`ID: ${item.id} | Monto: ${item.amount?.toString()} | Estado: ${item.status}`));
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
