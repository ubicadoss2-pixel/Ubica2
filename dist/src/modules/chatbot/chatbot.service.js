"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getUserConversations = exports.sendMessage = exports.callAI = exports.getConversationMessages = exports.getOrCreateConversation = exports.sendMessageSchema = void 0;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
const SYSTEM_PROMPT = `Eres el asistente virtual de Ubica2, una plataforma colombiana para descubrir lugares y eventos.

REGLAS IMPORTANTES:
1. SOLO responde preguntas relacionadas con Ubica2
2. Si te preguntan sobre temas externos (noticias, clima, matematicas, etc.), di amablemente que solo puedes ayudar con temas de la app
3. NUNCA inventes informacion sobre lugares o eventos especificos

TEMAS QUE PUEDES RESPONDER:
- Lugares: bares, restaurantes, cafeterias, discotecas, parques, museos
- Eventos: conciertos, fiestas, talleres, noches de musica
- Busqueda: como buscar por ciudad, categoria, fecha
- Planes: tipos de suscripcion y precios
- Promociones: como funcionan los codigos de descuento
- Favoritos: como guardar lugares
- Cuenta: registro, login, recuperacion de contrasena
- Ubicacion: encontrar lugares cerca de ti

DATOS DEL SISTEMA:
- Ciudades: Bogota, Medellin, Armenia (Colombia)
- Tipos de lugar: Bar, Cafe, Club, Restaurante, Parque, Museo
- Categorias de eventos: Salsa, Techno, Reggaeton
- Precios de planes: Basico ($29.900), Profesional ($79.000), Empresarial ($199.000)

RESPUESTAS:
- Se amigable y breve (max 3-4 oraciones)
- Usa emojis con moderacion
- Si no tienes certeza, di "Te recomiendo explorar la app para ver las opciones disponibles"`;
exports.sendMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(2000),
    conversationId: zod_1.z.string().uuid().optional(),
});
const getOrCreateConversation = async (userId) => {
    let conversation = await prisma_1.prisma.chatConversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
    if (!conversation) {
        conversation = await prisma_1.prisma.chatConversation.create({
            data: { userId },
        });
    }
    return conversation;
};
exports.getOrCreateConversation = getOrCreateConversation;
const getConversationMessages = async (conversationId, limit = 50) => {
    const messages = await prisma_1.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" }, // Tomar los más recientes primero
        take: limit,
    });
    return messages.reverse(); // Invertir para darlos en orden cronológico a la IA
};
exports.getConversationMessages = getConversationMessages;
const callAI = async (messages) => {
    const apiKey = process.env.AI_API_KEY;
    console.log("AI_API_KEY:", apiKey ? "SET" : "NOT SET");
    // Check for image attachments in messages - GPT-3.5 doesn't support images
    const userMessages = messages.filter(m => m.role === 'user');
    const hasImage = userMessages.some(m => m.content.toLowerCase().includes('.png') ||
        m.content.toLowerCase().includes('.jpg') ||
        m.content.toLowerCase().includes('.jpeg') ||
        m.content.toLowerCase().includes('.gif') ||
        m.content.toLowerCase().includes('image') ||
        m.content.toLowerCase().includes('foto') ||
        m.content.toLowerCase().includes('imagen'));
    if (hasImage) {
        return "Lo siento, por ahora solo puedo ayudarte con texto. No puedo procesar imágenes. ¿En qué puedo ayudarte sobre Ubica2?";
    }
    if (!apiKey) {
        return "Lo siento, el servicio de IA no esta configurado. Por favor contacta al administrador.";
    }
    try {
        // Protección contra conexiones colgadas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s de límite
        const response = await fetch(process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || "gpt-3.5-turbo",
                messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
                max_tokens: 500,
                temperature: 0.7,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || "No pude generar una respuesta.";
    }
    catch (error) {
        console.error("AI call error:", error?.message || error);
        return `Error: ${error?.message || "No se pudo conectar con la IA"}. Intenta de nuevo.`;
    }
};
exports.callAI = callAI;
const sendMessage = async (userId, data) => {
    const conversation = data.conversationId
        ? await prisma_1.prisma.chatConversation.findUnique({
            where: { id: data.conversationId },
        })
        : await (0, exports.getOrCreateConversation)(userId);
    if (!conversation) {
        throw new Error("Conversacion no encontrada");
    }
    if (conversation.userId !== userId) {
        throw new Error("No tienes acceso a esta conversacion");
    }
    await prisma_1.prisma.chatMessage.create({
        data: {
            conversationId: conversation.id,
            role: "user",
            content: data.message,
        },
    });
    await prisma_1.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
    });
    const history = await (0, exports.getConversationMessages)(conversation.id, 10);
    const aiResponse = await (0, exports.callAI)(history.map((m) => ({
        role: m.role,
        content: m.content,
    })));
    const savedMessage = await prisma_1.prisma.chatMessage.create({
        data: {
            conversationId: conversation.id,
            role: "assistant",
            content: aiResponse,
        },
    });
    return {
        conversationId: conversation.id,
        message: savedMessage,
    };
};
exports.sendMessage = sendMessage;
const getUserConversations = async (userId) => {
    return prisma_1.prisma.chatConversation.findMany({
        where: { userId },
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: { updatedAt: "desc" },
    });
};
exports.getUserConversations = getUserConversations;
const deleteConversation = async (userId, conversationId) => {
    const conversation = await prisma_1.prisma.chatConversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversacion no encontrada");
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.chatMessage.deleteMany({
            where: { conversationId },
        }),
        prisma_1.prisma.chatConversation.delete({
            where: { id: conversationId },
        })
    ]);
    return { deleted: true };
};
exports.deleteConversation = deleteConversation;
