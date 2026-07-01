"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteTarget = void 0;
const payments_service_1 = require("./payments.service");
const promoteTarget = async (req, res) => {
    try {
        const userId = req.user?.id;
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
        const tx = await (0, payments_service_1.processPaymentAndPromote)(userId, targetType, targetId);
        return res.json({
            message: "Pago exitoso y promoción activada",
            transaction: tx,
        });
    }
    catch (error) {
        console.error("Error en promoteTarget:", error);
        return res.status(400).json({ error: error.message || "Error procesando el pago" });
    }
};
exports.promoteTarget = promoteTarget;
