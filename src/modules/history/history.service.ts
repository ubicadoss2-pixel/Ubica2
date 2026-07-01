import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client";

/**
 * Obtiene el historial del usuario
 * @param userId - ID del usuario
 * @param limit - Límite de resultados
 */
export const getUserHistory = async (userId: string, limit = 50) => {
  const rows = await prisma.$queryRaw`
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
       END as longitude,
       CASE 
         WHEN uh.item_type = 'event' THEN e.place_id
         ELSE uh.item_id
       END as target_id
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

/**
 * Registra una vista en el historial
 * @param userId - ID del usuario
 * @param itemId - ID del lugar o evento
 * @param itemType - Tipo: 'place' o 'event'
 */
export const addToHistory = async (userId: string, itemId: string, itemType: string) => {
  await prisma.userHistory.create({
    data: {
      userId,
      itemId,
      itemType,
    }
  });
};

/**
 * Limpia el historial del usuario
 * @param userId - ID del usuario
 */
export const clearUserHistory = async (userId: string) => {
  await prisma.userHistory.deleteMany({
    where: { userId }
  });
};
