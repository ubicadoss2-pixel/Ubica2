"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.like = exports.remove = exports.update = exports.list = exports.create = void 0;
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
const update = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = String(req.params.id);
        const { content, rating } = req.body;
        const comment = await (0, comment_service_1.updateComment)(commentId, userId, { content, rating });
        res.json(comment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = String(req.params.id);
        await (0, comment_service_1.deleteComment)(commentId, userId);
        res.status(204).end();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.remove = remove;
const like = async (req, res) => {
    try {
        const commentId = String(req.params.id);
        const { increment } = req.body;
        const comment = await (0, comment_service_1.likeComment)(commentId, increment !== false);
        res.json(comment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.like = like;
