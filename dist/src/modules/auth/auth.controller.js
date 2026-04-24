"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPwd = exports.forgotPwd = exports.me = exports.login = exports.register = void 0;
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const register = async (req, res) => {
    try {
        const validated = auth_schema_1.registerSchema.parse(req.body);
        const user = await (0, auth_service_1.registerUser)(validated);
        res.status(201).json(user);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validated = auth_schema_1.loginSchema.parse(req.body);
        const tokens = await (0, auth_service_1.loginUser)(validated);
        res.json(tokens);
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await (0, auth_service_1.getUpdatedUserSession)(userId);
        res.json(session);
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.me = me;
const forgotPwd = async (req, res) => {
    try {
        const validated = auth_schema_1.forgotPasswordSchema.parse(req.body);
        const result = await (0, auth_service_1.forgotPassword)(validated);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.forgotPwd = forgotPwd;
const resetPwd = async (req, res) => {
    try {
        const validated = auth_schema_1.resetPasswordSchema.parse(req.body);
        const result = await (0, auth_service_1.resetPassword)(validated);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.resetPwd = resetPwd;
