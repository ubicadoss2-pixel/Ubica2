"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = exports.canCreateEvent = exports.canCreatePlace = exports.subscribeToPlan = exports.getMyActivePlan = exports.listPlans = void 0;
const prisma_1 = require("../../config/prisma");
const listPlans = async () => {
    return prisma_1.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
    });
};
exports.listPlans = listPlans;
const getMyActivePlan = async (userId) => {
    const userPlan = await prisma_1.prisma.userPlan.findFirst({
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
exports.getMyActivePlan = getMyActivePlan;
const subscribeToPlan = async (userId, planId) => {
    const plan = await prisma_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)
        throw new Error("Plan no existe o no esta disponible");
    if (!plan.isActive)
        throw new Error("Plan no activo");
    // Deactivate previous active plans for this user
    await prisma_1.prisma.userPlan.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
    });
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);
    const newSubscription = await prisma_1.prisma.userPlan.create({
        data: {
            userId,
            planId,
            startDate,
            endDate,
            isActive: true,
        },
    });
    // Upgrade user role to OWNER if they aren't already
    const userRoles = await prisma_1.prisma.userRole.findMany({
        where: { userId },
        select: { roleId: true },
    });
    const ownerRole = await prisma_1.prisma.role.findFirst({ where: { name: "OWNER" } });
    if (ownerRole) {
        const hasOwnerRole = userRoles.some((ur) => ur.roleId === ownerRole.id);
        if (!hasOwnerRole) {
            await prisma_1.prisma.userRole.create({
                data: {
                    userId,
                    roleId: ownerRole.id,
                },
            });
        }
    }
    return newSubscription;
};
exports.subscribeToPlan = subscribeToPlan;
const canCreatePlace = async (userId, isAdmin) => {
    if (isAdmin)
        return true;
    const activePlan = await (0, exports.getMyActivePlan)(userId);
    if (!activePlan)
        throw new Error("Requiere un plan activo para crear lugares");
    const currentPlacesCount = await prisma_1.prisma.place.count({
        where: { ownerUserId: userId, deletedAt: null },
    });
    if (currentPlacesCount >= activePlan.plan.limitPlaces) {
        throw new Error(`Limite de lugares alcanzado: ${activePlan.plan.limitPlaces}. Mejora tu plan.`);
    }
    return true;
};
exports.canCreatePlace = canCreatePlace;
const canCreateEvent = async (userId, isAdmin) => {
    if (isAdmin)
        return true;
    const activePlan = await (0, exports.getMyActivePlan)(userId);
    if (!activePlan)
        throw new Error("Requiere un plan activo para crear eventos");
    // Count events for places owned by this user
    const currentEventsCount = await prisma_1.prisma.event.count({
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
exports.canCreateEvent = canCreateEvent;
const createCheckoutSession = async (planId, userId) => {
    const plan = await prisma_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive)
        throw new Error("Plan no existe o no está activo");
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey)
        throw new Error("Stripe no configurado. Agregue STRIPE_SECRET_KEY en .env");
    // Lazy load Stripe only when a checkout is requested
    const Stripe = (await Promise.resolve().then(() => __importStar(require("stripe")))).default;
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
exports.createCheckoutSession = createCheckoutSession;
