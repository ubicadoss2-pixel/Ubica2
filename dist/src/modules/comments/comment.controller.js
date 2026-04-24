"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.create = void 0;
const comment_schema_1 = require("./comment.schema");
const comment_service_1 = require("./comment.service");
const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const body = comment_schema_1.createCommentSchema.parse(req.body);
        const comment = await (0, comment_service_1.createComment)(body, userId);
        res.status(201).json(comment);
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
exports.create = create;
const list = async (req, res) => {
    try {
        const result = await (0, comment_service_1.listComments)(req.query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.list = list;
