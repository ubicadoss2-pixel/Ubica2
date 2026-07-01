"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeConversation = exports.listConversations = exports.getMessages = exports.chat = void 0;
const chatbot_service_1 = require("./chatbot.service");
const chatbot_service_2 = require("./chatbot.service");
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    if (param === undefined)
        throw new Error("Parámetro requerido");
    return param;
};
const chat = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = chatbot_service_1.sendMessageSchema.parse(req.body);
        const result = await (0, chatbot_service_2.sendMessage)(userId, validated);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.chat = chat;
const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = getParam(req.params.conversationId);
        const messages = await (0, chatbot_service_2.getConversationMessages)(conversationId);
        res.json(messages);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMessages = getMessages;
const listConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await (0, chatbot_service_2.getUserConversations)(userId);
        res.json(conversations);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listConversations = listConversations;
const removeConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = getParam(req.params.conversationId);
        await (0, chatbot_service_2.deleteConversation)(userId, conversationId);
        res.json({ message: "Conversation deleted" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.removeConversation = removeConversation;
