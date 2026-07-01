import { Request, Response } from "express";
import { sendMessageSchema } from "./chatbot.service";
import {
  sendMessage,
  getConversationMessages,
  getUserConversations,
  deleteConversation,
} from "./chatbot.service";

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  if (param === undefined) throw new Error("Parámetro requerido");
  return param;
};

export const chat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = sendMessageSchema.parse(req.body);
    const result = await sendMessage(userId, validated);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const conversationId = getParam(req.params.conversationId);
    const messages = await getConversationMessages(conversationId);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const conversations = await getUserConversations(userId);
    res.json(conversations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const conversationId = getParam(req.params.conversationId);
    await deleteConversation(userId, conversationId);
    res.json({ message: "Conversation deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
