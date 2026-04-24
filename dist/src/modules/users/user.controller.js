"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMe = exports.me = void 0;
const user_schema_1 = require("./user.schema");
const user_service_1 = require("./user.service");
const me = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const profile = await (0, user_service_1.getProfile)(userId, role);
        if (!profile) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.me = me;
const updateMe = async (req, res) => {
    try {
        const payload = user_schema_1.updateUserSchema.parse(req.body);
        const updated = await (0, user_service_1.updateProfile)(req.user.id, payload);
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateMe = updateMe;
