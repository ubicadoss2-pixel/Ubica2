"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const normalizeRole = (role) => {
    const value = (role || "").trim().toUpperCase();
    if (value === "MERCHANT")
        return "OWNER";
    return value;
};
const authorize = (...roles) => (req, res, next) => {
    const allowedRoles = roles.map(normalizeRole);
    const currentRole = normalizeRole(req.user?.role);
    if (!currentRole || !allowedRoles.includes(currentRole)) {
        return res.status(403).json({
            message: "No autorizado",
        });
    }
    next();
};
exports.authorize = authorize;
