import { Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";

export const checkBusinessLimitByPlan = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // 🔥 Buscar suscripción activa
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        merchant_id: userId,
        estado: "activa",
      },
      include: {
        plans: true,
      },
    });

    if (!subscription) {
      return res.status(403).json({
        message: "Necesitas un plan activo para crear negocios",
      });
    }

    // 🔥 Contar negocios actuales del merchant
    const totalBusinesses = await prisma.businesses.count({
      where: {
        merchant_id: userId,
        is_active: true,
      },
    });

    // 🔥 Definir límites por plan
    let maxBusinesses = 0;

    switch (subscription.plans.nombre) {
      case "FREE":
        maxBusinesses = 1;
        break;
      case "PRO":
        maxBusinesses = 5;
        break;
      case "ELITE":
        maxBusinesses = Infinity;
        break;
      default:
        maxBusinesses = 0;
    }

    if (totalBusinesses >= maxBusinesses) {
      return res.status(403).json({
        message:
          "Has alcanzado el límite de negocios de tu plan. Mejora tu suscripción 🚀",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Error validando límite de negocios",
    });
  }
};
