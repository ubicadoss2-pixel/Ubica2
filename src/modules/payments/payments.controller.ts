import { Request, Response } from "express";
import { processPaymentAndPromote } from "./payments.service";

export const promoteTarget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { targetType, targetId } = req.body;

    if (!targetType || !targetId) {
      return res.status(400).json({ error: "Faltan datos: targetType y targetId son requeridos" });
    }

    if (targetType !== "PLACE" && targetType !== "EVENT") {
      return res.status(400).json({ error: "Tipo inválido. Use 'PLACE' o 'EVENT'" });
    }

    const tx = await processPaymentAndPromote(userId, targetType, targetId);
    return res.json({
      message: "Pago exitoso y promoción activada",
      transaction: tx,
    });
  } catch (error: any) {
    console.error("Error en promoteTarget:", error);
    return res.status(400).json({ error: error.message || "Error procesando el pago" });
  }
};
