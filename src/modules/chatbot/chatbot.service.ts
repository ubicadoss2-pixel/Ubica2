import { prisma } from "../../config/prisma";
import { z } from "zod";

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

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;

export const getOrCreateConversation = async (userId: string) => {
  let conversation = await prisma.chatConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: { userId },
    });
  }

  return conversation;
};

export const getConversationMessages = async (
  conversationId: string,
  limit = 50
) => {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" }, // Tomar los más recientes primero
    take: limit,
  });
  return messages.reverse(); // Invertir para darlos en orden cronológico a la IA
};

export const callAI = async (messages: { role: string; content: string }[]) => {
  const apiKey = process.env.AI_API_KEY;
  console.log("AI_API_KEY:", apiKey ? "SET" : "NOT SET");

  // Check for image attachments in messages - GPT-3.5 doesn't support images
  const userMessages = messages.filter(m => m.role === 'user');
  const hasImage = userMessages.some(m => 
    m.content.toLowerCase().includes('.png') || 
    m.content.toLowerCase().includes('.jpg') ||
    m.content.toLowerCase().includes('.jpeg') ||
    m.content.toLowerCase().includes('.gif') ||
    m.content.toLowerCase().includes('image') ||
    m.content.toLowerCase().includes('foto') ||
    m.content.toLowerCase().includes('imagen')
  );

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
      signal: controller.signal as RequestInit["signal"],
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No pude generar una respuesta.";
  } catch (error: any) {
    console.error("AI call error:", error?.message || error);
    return `Error: ${error?.message || "No se pudo conectar con la IA"}. Intenta de nuevo.`;
  }
};

export const sendMessage = async (
  userId: string,
  data: SendMessageDTO
) => {
  const conversation = data.conversationId
    ? await prisma.chatConversation.findUnique({
        where: { id: data.conversationId },
      })
    : await getOrCreateConversation(userId);

  if (!conversation) {
    throw new Error("Conversacion no encontrada");
  }

  if (conversation.userId !== userId) {
    throw new Error("No tienes acceso a esta conversacion");
  }

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: data.message,
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const history = await getConversationMessages(conversation.id, 10);

  const aiResponse = await callAI(
    history.map((m) => ({
      role: m.role,
      content: m.content,
    }))
  );

  const savedMessage = await prisma.chatMessage.create({
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

export const getUserConversations = async (userId: string) => {
  return prisma.chatConversation.findMany({
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

export const deleteConversation = async (userId: string, conversationId: string) => {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.userId !== userId) {
    throw new Error("Conversacion no encontrada");
  }

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({
      where: { conversationId },
    }),
    prisma.chatConversation.delete({
      where: { id: conversationId },
    })
  ]);

  return { deleted: true };
};
