import { prisma } from "../../config/prisma";

export const listPlans = async () => {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

export const getMyActivePlan = async (userId: string) => {
  const userPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gt: new Date() },
    },
    include: {
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return userPlan;
};

export const subscribeToPlan = async (userId: string, planId: string) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan no existe o no esta disponible");
  if (!plan.isActive) throw new Error("Plan no activo");

  // Deactivate previous active plans for this user
  await prisma.userPlan.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.durationDays);

  const newSubscription = await prisma.userPlan.create({
    data: {
      userId,
      planId,
      startDate,
      endDate,
      isActive: true,
    },
  });

  // Upgrade user role to OWNER if they aren't already
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const ownerRole = await prisma.role.findFirst({ where: { name: "OWNER" } });
  if (ownerRole) {
    const hasOwnerRole = userRoles.some((ur: any) => ur.roleId === ownerRole.id);
    if (!hasOwnerRole) {
      await prisma.userRole.create({
        data: {
          userId,
          roleId: ownerRole.id,
        },
      });
    }
  }

  return newSubscription;
};

export const canCreatePlace = async (userId: string, isAdmin: boolean) => {
  if (isAdmin) return true;
  
  const activePlan = await getMyActivePlan(userId);
  if (!activePlan) throw new Error("Requiere un plan activo para crear lugares");

  const currentPlacesCount = await prisma.place.count({
    where: { ownerUserId: userId, deletedAt: null },
  });

  if (currentPlacesCount >= activePlan.plan.limitPlaces) {
    throw new Error(`Limite de lugares alcanzado: ${activePlan.plan.limitPlaces}. Mejora tu plan.`);
  }

  return true;
};

export const canCreateEvent = async (userId: string, isAdmin: boolean) => {
  if (isAdmin) return true;
  
  const activePlan = await getMyActivePlan(userId);
  if (!activePlan) throw new Error("Requiere un plan activo para crear eventos");

  // Count events for places owned by this user
  const currentEventsCount = await prisma.event.count({
    where: {
      place: { ownerUserId: userId },
      deletedAt: null,
    },
  });

  if (currentEventsCount >= activePlan.plan.limitEvents) {
    throw new Error(`Limite de eventos alcanzado: ${activePlan.plan.limitEvents}. Mejora tu plan.`);
  }

  return true;
};

export const createCheckoutSession = async (planId: string, userId: string) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new Error("Plan no existe o no está activo");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe no configurado. Agregue STRIPE_SECRET_KEY en .env");

  // Lazy load Stripe only when a checkout is requested
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cop",
          product_data: {
            name: plan.name,
            description: `Suscripción Ubica2 — Hasta ${plan.limitPlaces} lugares y ${plan.limitEvents} eventos por ${plan.durationDays} días`,
          },
          unit_amount: Math.round(Number(plan.price) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { planId, userId },
    success_url: `http://localhost:4200/plans/success?planId=${plan.id}`,
    cancel_url: `http://localhost:4200/plans`,
  });

  return { url: session.url };
};
