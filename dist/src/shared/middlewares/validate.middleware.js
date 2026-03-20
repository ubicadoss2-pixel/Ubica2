"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.validateBody = validateBody;
