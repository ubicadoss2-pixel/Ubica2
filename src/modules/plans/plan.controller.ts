import { Request, Response } from "express";
import { subscribePlanSchema } from "./plan.schema";
import { listPlans, getMyActivePlan, subscribeToPlan, createCheckoutSession } from "./plan.service";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await listPlans();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const myPlan = await getMyActivePlan(userId);
    res.json(myPlan || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const body = subscribePlanSchema.parse(req.body);
    const subscription = await subscribeToPlan(userId, body.planId);
    res.status(201).json(subscription);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: "Datos invalidos", details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const checkout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: "planId es requerido" });
    
    try {
      const result = await createCheckoutSession(planId, userId);
      res.json(result);
    } catch (stripeError: any) {
      if (stripeError.message?.includes("Stripe no configurado")) {
        // Si Stripe no está configurado, usar suscripción directa
        const subscription = await subscribeToPlan(userId, planId);
        res.status(201).json({ 
          demoMode: true, 
          message: "Suscripcion activada en modo demo",
          subscription 
        });
      } else {
        throw stripeError;
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
