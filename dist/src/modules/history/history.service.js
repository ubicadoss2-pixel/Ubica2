"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserHistory = exports.addToHistory = exports.getUserHistory = void 0;
const prisma_1 = require("../../config/prisma");
/**
 * Obtiene el historial del usuario
 * @param userId - ID del usuario
 * @param limit - Límite de resultados
 */
const getUserHistory = async (userId, limit = 50) => {
    const rows = await prisma_1.prisma.$queryRaw `
    SELECT 
       uh.id,
       uh.item_id,
       uh.item_type,
       uh.viewed_at,
       CASE 
         WHEN uh.item_type = 'place' THEN p.name
         WHEN uh.item_type = 'event' THEN e.title
       END as item_name,
       CASE 
         WHEN uh.item_type = 'place' THEN p.address_line
         WHEN uh.item_type = 'event' THEN e.description
       END as item_description,
       CASE 
         WHEN uh.item_type = 'place' THEN p.latitude
         WHEN uh.item_type = 'event' THEN pl.latitude
       END as latitude,
       CASE 
         WHEN uh.item_type = 'place' THEN p.longitude
         WHEN uh.item_type = 'event' THEN pl.longitude
       END as longitude
     FROM user_history uh
     LEFT JOIN places p ON uh.item_id = p.id AND uh.item_type = 'place'
     LEFT JOIN events e ON uh.item_id = e.id AND uh.item_type = 'event'
     LEFT JOIN places pl ON e.place_id = pl.id
     WHERE uh.user_id = ${userId}
     ORDER BY uh.viewed_at DESC
     LIMIT ${limit}
  `;
    return rows;
};
exports.getUserHistory = getUserHistory;
/**
 * Registra una vista en el historial
 * @param userId - ID del usuario
 * @param itemId - ID del lugar o evento
 * @param itemType - Tipo: 'place' o 'event'
 */
const addToHistory = async (userId, itemId, itemType) => {
    await prisma_1.prisma.userHistory.create({
        data: {
            userId,
            itemId,
            itemType,
        }
    });
};
exports.addToHistory = addToHistory;
/**
 * Limpia el historial del usuario
 * @param userId - ID del usuario
 */
const clearUserHistory = async (userId) => {
    await prisma_1.prisma.userHistory.deleteMany({
        where: { userId }
    });
};
exports.clearUserHistory = clearUserHistory;
