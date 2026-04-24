"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlocked = exports.listBlocked = exports.unblock = exports.block = void 0;
const user_blocks_service_1 = require("./user-blocks.service");
const user_blocks_service_2 = require("./user-blocks.service");
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    if (param === undefined)
        throw new Error("Parámetro requerido");
    return param;
};
const block = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = user_blocks_service_1.blockUserSchema.parse(req.body);
        const block = await (0, user_blocks_service_2.blockUser)(userId, validated);
        res.status(201).json(block);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.block = block;
const unblock = async (req, res) => {
    try {
        const userId = req.user.id;
        const blockedId = getParam(req.params.blockedId);
        await (0, user_blocks_service_2.unblockUser)(userId, blockedId);
        res.json({ message: "Usuario desbloqueado" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.unblock = unblock;
const listBlocked = async (req, res) => {
    try {
        const userId = req.user.id;
        const blocked = await (0, user_blocks_service_2.getBlockedUsers)(userId);
        res.json(blocked);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listBlocked = listBlocked;
const checkBlocked = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetId = getParam(req.params.userId);
        const blocked = await (0, user_blocks_service_2.isBlocked)(userId, targetId);
        res.json({ isBlocked: blocked });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.checkBlocked = checkBlocked;
