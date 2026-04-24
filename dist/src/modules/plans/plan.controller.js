"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkout = exports.subscribe = exports.getMyPlan = exports.getPlans = void 0;
const prisma_1 = require("../../config/prisma");
const plan_schema_1 = require("./plan.schema");
const plan_service_1 = require("./plan.service");
const getPlans = async (req, res) => {
    try {
        const plans = await (0, plan_service_1.listPlans)();
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPlans = getPlans;
const getMyPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const myPlan = await (0, plan_service_1.getMyActivePlan)(userId);
        res.json(myPlan || null);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMyPlan = getMyPlan;
const subscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const body = plan_schema_1.subscribePlanSchema.parse(req.body);
        const subscription = await (0, plan_service_1.subscribeToPlan)(userId, body.planId);
        const updatedUser = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } }
        });
        const role = updatedUser?.userRoles.find((ur) => ur.role.name === 'OWNER') ? 'OWNER' : 'USER';
        res.status(201).json({ subscription, role });
    }
    catch (error) {
        if (error.name === "ZodError") {
            res.status(400).json({ error: "Datos invalidos", details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
};
exports.subscribe = subscribe;
const checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.body;
        if (!planId)
            return res.status(400).json({ error: "planId es requerido" });
        try {
            const result = await (0, plan_service_1.createCheckoutSession)(planId, userId);
            res.json(result);
        }
        catch (stripeError) {
            if (stripeError.message?.includes("Stripe no configurado")) {
                // Si Stripe no está configurado, usar suscripción directa
                const subscription = await (0, plan_service_1.subscribeToPlan)(userId, planId);
                res.status(201).json({
                    demoMode: true,
                    message: "Suscripcion activada en modo demo",
                    subscription
                });
            }
            else {
                throw stripeError;
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.checkout = checkout;
