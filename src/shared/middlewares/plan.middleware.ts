import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";

export const checkPlanImageLimit = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {

    const userId = req.user.id;
    const businessId = Number(req.params.id);

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
        message: "No tienes un plan activo",
      });
    }

    // 🔥 Contar imágenes actuales
    const totalImages = await prisma.business_images.count({
      where: {
        business_id: businessId,
      },
    });

    // 🔥 Validar límite
    if (totalImages >= subscription.plans.max_images) {
      return res.status(403).json({
        message:
          "Llegaste al límite de imágenes de tu plan. Mejora tu suscripción 🚀",
      });
    }

    next();

  } catch (error) {

    res.status(500).json({
      message: "Error validando el plan",
    });

  }
};
