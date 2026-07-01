import { Router } from "express";
import { chat, getMessages, listConversations, removeConversation } from "./chatbot.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", chat);
router.get("/", listConversations);
router.get("/:conversationId", getMessages);
router.delete("/:conversationId", removeConversation);

export default router;
