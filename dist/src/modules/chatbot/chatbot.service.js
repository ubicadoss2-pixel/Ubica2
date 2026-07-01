"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getUserConversations = exports.sendMessage = exports.callAI = exports.getConversationMessages = exports.getOrCreateConversation = exports.sendMessageSchema = void 0;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
const SYSTEM_PROMPT = `Eres el asistente virtual estrella de Ubica2, la mejor plataforma colombiana para descubrir parches, eventos y lugares brutales en la ciudad. Tu rol es ser un amigo súper cálido, cercano, empático y que se las sabe todas sobre la movida local.

REGLAS IMPORTANTES:
1. Actúa 100% como un humano local (colombiano). Usa expresiones cálidas y naturales (ej. "¡Qué más!", "Claro que sí", "¡De una!", "Te tengo el súper plan"). NUNCA suenes como un robot o sistema automatizado.
2. Si te preguntan por cosas fuera de tus temas (que son lugares y eventos en Ubica2), responde con gracia y redirige la charla hacia lo que sabes hacer: ¡recomendar los mejores planes!
3. NUNCA inventes nombres de lugares o información. Solo usa los datos que te proveemos en el contexto. Si no hay datos, sé sincero y dile que por ahora no tienes esa info, ¡pero siempre ofrécele otra alternativa genial!
4. Mantén tus respuestas conversacionales, fluidas, cortas y al grano (máximo 2 párrafos cortos). Usa pocos emojis, maximo 1-2 por respuesta, solo cuando sea natural.
5. Nunca digas "basado en mi base de datos" o "según el contexto". Habla como si recordaras todo porque eres el que más conoce la ciudad.

DATOS DEL SISTEMA:
- Ciudades principales: Armenia (toda la plataforma opera únicamente en Armenia, Quindío).
- Tipos de lugar: Bar, Café, Club, Restaurante, Parque, Museo.
- Lugares y menús destacados en Armenia: 
  * La Fogata: Excelente carne y ambiente (Baby Beef 350g a $58k, Solomillo $62k, Salmón $48k).
  * El Solar Gastrobar: Ideal para compartir y comida casual (Pizza Artesanal $32k, Hamburguesa de Autor $35k, Sangría $45k).
  * Dar Papaya: Rumba intensa (Pecado Original $30k, Picada $75k, Aguardiente $120k).
  * El Bunker: Coctelería clandestina (Cocktail Signature $35k, Moscow Mule $32k).
  * Museo del Oro Quimbaya: Plan cultural.
  * Café Quindío: Para conversar con calma.

6. NUNCA inventes precios, planes de suscripcion ni informacion financiera. Ubica2 es gratuita para usuarios.

Recuerda: Tu personalidad es vibrante, colombiana, súper servicial y siempre lista para armar el mejor parche en Armenia.`;
exports.sendMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(2000),
    conversationId: zod_1.z.string().uuid().optional(),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
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
const callAI = async (messages, dynamicContext) => {
    const apiKey = process.env.AI_API_KEY;
    const isValidApiKey = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;
    console.log("AI_API_KEY:", apiKey ? (isValidApiKey ? "VALID_GEMINI_KEY" : "INVALID_FORMAT") : "NOT SET");
    // Check for image attachments in messages - Gemini flash doesn't support raw image URLs
    const userMessages = messages.filter(m => m.role === 'user');
    const hasImage = userMessages.some(m => m.content.toLowerCase().includes('.png') ||
        m.content.toLowerCase().includes('.jpg') ||
        m.content.toLowerCase().includes('.jpeg') ||
        m.content.toLowerCase().includes('.gif') ||
        (m.content.toLowerCase().includes('image') && m.content.toLowerCase().includes('http')) ||
        (m.content.toLowerCase().includes('foto') && m.content.toLowerCase().includes('http')));
    if (hasImage) {
        return { content: "Lo siento, por ahora solo puedo ayudarte con texto. No puedo procesar imágenes. ¿En qué puedo ayudarte sobre Ubica2?" };
    }
    // --- ROBUST LOCAL EXPERT SYSTEM (For Demo) ---
    const lastMessage = messages[messages.length - 1]?.content || '';
    const normalized = lastMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizeText = (value) => value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const buildLocalAnswer = async (messagesArr, normalizedMessage) => {
        // Build context from the last 4 user messages
        const userMessages = messagesArr.filter(m => m.role === 'user').map(m => m.content);
        const fullContext = userMessages.slice(-4).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const foodIntent = /comid|restaur|cenar|almorzar|desayun|merienda|menu|men[uú]|comer|sabroso|hambre|hamburguesa|pizza|carne|cafe|caf[eé]|plato|gastrono|almuerzo/;
        const partyIntent = /rumba|bar|discotec|coctel|trago|fiesta|noche|bailar|cerveza|licor|tomar|club|baile|pelea|farra/;
        const eventIntent = /event|plan|show|conciert|actividad|agenda|hacer|recomenda|sugiere|sugerencia|que hay|programa|espectaculo/;
        const quietIntent = /tranquil|charlar|hablar|calma|relajad|parque|museo|cultura|leer|cafe|solo|pareja/;
        const routeIntent = /ruta|como llegar|llegar|ir a|llevarme|traz|donde|ubicacion|camino|navegar|direccion/;
        const greetIntent = /hola|buenos|buenas|hey|que mas|que tal|saludos|ey|hi|hello/;
        const thanksIntent = /gracias|thank|chevere|bacano|genial|perfecto|excelente|great|wow|muy bien/;
        const priceIntent = /precio|cuanto|costo|cuesta|entrada|cobran|valor|tarifa|suscripcion|membresia/;
        const hoursIntent = /hora|horario|abre|cierra|cuando|abierto|disponible/;
        const helpIntent = /ayuda|puedes|que haces|funciones|como funciona|que eres|quien eres/;
        const jokeIntent = /chiste|broma|divertido|reir|cuentame algo|aburrido/;
        const weatherIntent = /clima|llover|sol|frio|calor|lluvia|tiempo/;
        const petFriendlyIntent = /mascota|perro|gato|pet friendly|animal/;
        const familyIntent = /niños|familia|hijos|infantil|bebe/;
        const romanticIntent = /pareja|romantico|cita|novia|novio|aniversario/;
        const sportIntent = /futbol|partido|deporte|ver el partido|pantalla/;
        const places = await prisma_1.prisma.place.findMany({
            where: { status: "PUBLISHED" },
            include: { placeType: true, city: true },
            take: 50,
        });
        const events = await prisma_1.prisma.event.findMany({
            where: { status: "ACTIVE", deletedAt: null },
            include: { place: true, category: true },
            take: 30,
        });
        const knownPlaces = places.map((p) => ({
            name: p.name,
            normalizedName: normalizeText(p.name),
            type: p.placeType?.name,
            city: p.city?.name,
            address: p.addressLine,
            description: p.description,
            lat: p.latitude !== null ? Number(p.latitude) : null,
            lng: p.longitude !== null ? Number(p.longitude) : null,
        }));
        // Route intent
        const routePlace = knownPlaces.find((p) => fullContext.includes(p.normalizedName));
        if (routeIntent.test(fullContext) && routePlace) {
            return {
                content: `Perfecto, ya te estoy trazando la ruta hacia **${routePlace.name}**. 🗺️`,
                metadata: {
                    action: "ROUTE",
                    placeId: routePlace.name,
                    lat: routePlace.lat,
                    lng: routePlace.lng,
                },
            };
        }
        // Greeting
        if (greetIntent.test(normalizedMessage) && normalizedMessage.length < 25) {
            const greetings = [
                "¡Qué más! Bienvenido/a a Ubica2, tu guía local más bacana. ¿Qué tienes ganas de hacer hoy? Puedo ayudarte a encontrar el mejor restaurante, el bar más prendido, o algún evento chévere en la ciudad. 😊",
                "¡Ey, hola! Me alegra verte por aquí. Soy el asistente de Ubica2 y me las sé todas. ¿Buscas dónde comer, salir de rumba, o hay algún evento que te llame la atención? 😄",
                "¡Buenas! ¿Cómo estás? Aquí estoy listo para armarte el mejor plan en Armenia. Cuéntame, ¿qué tienes en mente hoy? 😊"
            ];
            return { content: greetings[Math.floor(Math.random() * greetings.length)] };
        }
        // Thanks
        if (thanksIntent.test(normalizedMessage)) {
            return {
                content: "¡De nada! Con mucho gusto. 😊 Si necesitas más recomendaciones, aquí estaré. ¿Hay algo más que te pueda ayudar a encontrar?",
            };
        }
        // Help / who are you
        if (helpIntent.test(normalizedMessage)) {
            return {
                content: "Soy el asistente virtual de **Ubica2**, la plataforma colombiana para descubrir los mejores parches, eventos y lugares en tu ciudad. 😊\n\nPuedo ayudarte con:\n- Recomendaciones de restaurantes y bares\n- Eventos y planes activos\n- Rutas a cualquier lugar\n- Sugerencias según tu estado de ánimo\n\n¿Por dónde empezamos?",
            };
        }
        // Price/subscription
        if (priceIntent.test(normalizedMessage)) {
            return {
                content: "Ubica2 es una plataforma gratuita para los usuarios. Si eres dueno de un negocio y quieres registrar tu local, puedes hacerlo desde la seccion de verificacion en tu perfil. Te puedo ayudar con algo mas?",
            };
        }
        // Food intent
        if (foodIntent.test(normalizedMessage)) {
            const restaurantSuggestions = knownPlaces.filter((p) => /restaurante|cafe|gastrobar|bar|comida|cena|almuerzo/.test(p.type?.toLowerCase() || "") ||
                /la fogata|el solar gastrobar|dar papaya|cafe quindio/.test(p.normalizedName));
            if (restaurantSuggestions.length > 0) {
                const suggestion = restaurantSuggestions.slice(0, 3).map((p) => `- **${p.name}** (${p.type || 'Restaurante'} en ${p.city || "Armenia"}): ${p.description?.substring(0, 70) || "excelente opción gastronómica"}`).join("\n");
                return {
                    content: `¡Se me hizo agua la boca! Mira estos planes perfectos para comer:\n\n${suggestion}\n\n¿Quieres que te trace la ruta a alguno de ellos? Solo dime "ruta a [nombre del lugar]". 😊`,
                };
            }
            return {
                content: "¡Qué rico! Si tienes hambre, en Armenia tienes opciones de lujo:\n- **La Fogata**: El clásico. Excelentes cortes a la parrilla.\n- **El Solar Gastrobar**: Ambiente rústico-moderno, pizza artesanal y cocteles premium.\n- **Café Quindío**: Para un desayuno o onces tranquilos con el mejor café colombiano.\n\n¿A cuál quieres que te trace la ruta? 😊",
            };
        }
        // Party/nightlife intent
        if (partyIntent.test(normalizedMessage)) {
            const nightlifeSuggestions = knownPlaces.filter((p) => /bar|club|discoteca|coctel|rumba|noche/.test(p.type?.toLowerCase() || "") ||
                /dar papaya|el bunker|la fogata|el solar gastrobar/.test(p.normalizedName));
            if (nightlifeSuggestions.length > 0) {
                const suggestion = nightlifeSuggestions.slice(0, 2).map((p) => `- **${p.name}**: ${p.description?.substring(0, 70) || "plan bien prendido"}`).join("\n");
                return {
                    content: `¡Vamos con todo esa rumba! Los spots más prendidos de la noche:\n\n${suggestion}\n\nSi quieres, te trazo la ruta a cualquiera. ¡Esta noche va a quedar! 🔥`,
                };
            }
            return {
                content: "¡Rumba mode: ON! Para una noche épica en Armenia:\n- **Dar Papaya**: El epicentro de la rumba. DJs locales, neón y vibra increíble.\n- **El Bunker**: Experiencia clandestina con coctelería de autor súper exclusiva.\n- **El Solar Gastrobar**: Si quieres algo más tranquilo pero igual de prendido.\n\n¿A dónde te llevo? 🔥",
            };
        }
        // Events intent
        if (eventIntent.test(normalizedMessage) && events.length > 0) {
            const eventList = events.slice(0, 4).map((e) => `- **${e.title}** en **${e.place.name}** (${e.category?.name || "General"}), horario: ${formatEventSchedule(e)}.`).join("\n");
            return {
                content: `¡Hay harta movida! Estos son los eventos que están activos ahora mismo:\n\n${eventList}\n\n¿Alguno te llama la atención? Te puedo trazar la ruta al lugar o darte más detalles. 😊`,
            };
        }
        // Quiet/relaxed intent
        if (quietIntent.test(normalizedMessage)) {
            const quietSuggestions = knownPlaces.filter((p) => /cafe|parque|museo|cultura/.test(p.type?.toLowerCase() || "") ||
                /museo del oro|cafe quindio/.test(p.normalizedName));
            if (quietSuggestions.length > 0) {
                const suggestion = quietSuggestions.slice(0, 2).map((p) => `- **${p.name}**: ${p.description?.substring(0, 70) || "ideal para un rato tranquilo"}`).join("\n");
                return {
                    content: `Claro que sí, si buscas un plan más relajado, te va a encantar:\n\n${suggestion}\n\n¡Avísame si quieres la ruta! ☕`,
                };
            }
            return {
                content: "Para un rato tranquilo y sin afanes, nada mejor que:\n- **Café Quindío**: El ambiente perfecto para conversar o trabajar con un buen café de origen.\n- **Museo del Oro Quimbaya**: Un plan cultural impresionante, diseñado por Rogelio Salmona.\n\n¿A cuál vas? 😊",
            };
        }
        // Route intent without a specific place
        if (routeIntent.test(fullContext)) {
            return {
                content: "Si quieres que te muestre el camino, escríbeme algo como:\n- *\"ruta a El Solar Gastrobar\"*\n- *\"cómo llegar a Dar Papaya\"*\n- *\"llevame a La Fogata\"*\n\nAsí te abro el mapa directo. 📍",
            };
        }
        // Hours intent
        if (hoursIntent.test(normalizedMessage)) {
            return {
                content: "Los horarios varían por lugar, pero en general:\n- Cafés y restaurantes: 7am - 10pm\n- Bares y Gastrobares: 12pm - 2am\n- Discotecas: Desde las 9pm hasta el amanecer\n\nTe recomiendo verificar directamente con el lugar antes de ir. ¿Te puedo trazar la ruta a alguno en específico? 🗺️",
            };
        }
        // Joke intent
        if (jokeIntent.test(normalizedMessage)) {
            const jokes = [
                "¿Qué le dice una iguana a su hermana gemela? Somos iguanitas. 😄",
                "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter. 🐦",
                "¿Sabes por qué el mar no se seca? Porque no tiene toalla. 😂",
                "¡Uy! Yo para contar chistes soy peor que un lunes por la mañana. Mejor pregúntame por un buen lugar para tomarse una cervecita. 🍻"
            ];
            return { content: jokes[Math.floor(Math.random() * jokes.length)] };
        }
        // Weather intent
        if (weatherIntent.test(normalizedMessage)) {
            return {
                content: "El clima en Armenia es súper bipolar. 😅 Te recomiendo siempre salir con una sombrilla por si las moscas, pero con ropa fresca porque si hace sol, ¡pica! Si llueve, un buen plan es ir a Café Quindío a tomarse alguito caliente.",
            };
        }
        // Pet friendly intent
        if (petFriendlyIntent.test(normalizedMessage)) {
            return {
                content: "¡Claro! En Armenia hay lugares súper chéveres para ir con tus peluditos. El Solar Gastrobar suele tener espacios abiertos perfectos, y muchos cafés en el norte de la ciudad son pet friendly. ¡Tu mascota también merece salir de parche! 🐶",
            };
        }
        // Family / Kids intent
        if (familyIntent.test(normalizedMessage)) {
            return {
                content: "Para un plan en familia y con niños te súper recomiendo espacios amplios. Los parques temáticos cerca a Armenia son ideales, o restaurantes campestres en la vía a Circasia donde tienen juegos infantiles. ¡Un domingo perfecto! 👨‍👩‍👧‍👦",
            };
        }
        // Romantic intent
        if (romanticIntent.test(normalizedMessage)) {
            return {
                content: "¡Uy, plan romántico! ❤️ Para deslumbrar a tu pareja te sugiero La Fogata, la comida es espectacular y el ambiente súper elegante. También un gastrobar con buena vista al atardecer siempre suma muchos puntos. ¡Éxitos en esa cita!",
            };
        }
        // Sports intent
        if (sportIntent.test(normalizedMessage)) {
            return {
                content: "¡Se armó el parche futbolero! ⚽ Para ver el partido te sugiero lugares tipo gastrobar o pubs cerveceros, como El Solar, que suelen tener pantallas gigantes y un ambiente súper prendido cuando juega la selección o los equipos locales. ¿Te trazo la ruta?",
            };
        }
        // Si es el primer mensaje o es muy corto y no hubo coincidencia de intenciones
        if (userMessages.length <= 1 && normalizedMessage.length < 30) {
            return {
                content: "¡Hola! Qué gusto saludarte. Soy tu amigo en Ubica2. Cuéntame, ¿qué tienes ganas de hacer hoy? Podemos buscar alguito rico para comer, un parche de rumba, algún evento o un sitio relajado para charlar. ¡Tú mandas! 😊",
            };
        }
        return {
            content: "¡Súper! Aquí en Ubica2 me sé todos los rincones de Armenia: los mejores restaurantes, bares, eventos y más. Dime qué tipo de plan buscas y te armo la noche perfecta. ¿Quieres comer algo delicioso, salir de rumba, o conocer algún plan cultural? 😊",
        };
    };
    console.log("[CHATBOT] Extracted text for logic routing:", normalized);
    // --- LOGICA DE RUTAS DINAMICA SELECTIVA (solo cuando se le pida explícitamente) ---
    const routeTriggerKeywords = [
        'ruta a', 'ruta al', 'como llegar a', 'como llegar al',
        'llevame a', 'llevame al', 'llevame para', 'llevarme a', 'llevarme al',
        'navegar a', 'trazar ruta a', 'trazar ruta al', 'como llego a', 'como llego al',
        'como ir a', 'como ir al', 'trazame la ruta', 'trazar la ruta'
    ];
    const isExplicitRouteRequest = routeTriggerKeywords.some(keyword => normalized.includes(keyword)) ||
        ((normalized.includes('ir a') || normalized.includes('ir al')) &&
            (normalized.includes('fogata') || normalized.includes('solar') || normalized.includes('bunker') || normalized.includes('papaya') || normalized.includes('museo') || normalized.includes('parque') || normalized.includes('quindio')));
    if (isExplicitRouteRequest) {
        try {
            const rawTarget = normalizeText(lastMessage)
                .replace(/\b(quiero|necesito|porfa|por favor|me|puedes|podrias|podrías|hacia|para|ir|al|a|de|del|la|el|una|un)\b/g, " ")
                .replace(/\b(ruta|como llegar|llevarme|llévame|llevame|navegar|navegacion|navegación)\b/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const places = await prisma_1.prisma.place.findMany({
                where: {
                    status: "PUBLISHED",
                    latitude: { not: null },
                    longitude: { not: null },
                },
                select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                },
                take: 500,
            });
            const enriched = places.map((p) => ({
                ...p,
                normalizedName: normalizeText(p.name),
            }));
            // 1) Match directo por nombre completo incluido en el mensaje
            let bestMatch = enriched
                .filter((p) => normalized.includes(p.normalizedName))
                .sort((a, b) => b.normalizedName.length - a.normalizedName.length)[0] || null;
            // 2) Match por tokens si no hubo directo (ej. "ruta cafe central")
            if (!bestMatch && rawTarget.length >= 3) {
                const stopwords = new Set(["de", "del", "la", "el", "y", "en", "por", "para", "con"]);
                const targetTokens = rawTarget
                    .split(" ")
                    .map((t) => t.trim())
                    .filter((t) => t.length > 1 && !stopwords.has(t));
                let bestScore = 0;
                for (const place of enriched) {
                    const placeTokens = new Set(place.normalizedName.split(" "));
                    const score = targetTokens.filter((t) => placeTokens.has(t)).length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = place;
                    }
                }
                // Evitar falsos positivos con score demasiado bajo
                if (bestScore < Math.min(2, targetTokens.length || 1)) {
                    bestMatch = null;
                }
            }
            if (bestMatch) {
                return {
                    content: `Perfecto, ya te estoy trazando la ruta hacia **${bestMatch.name}**. 🗺️📍`,
                    metadata: {
                        action: "ROUTE",
                        placeId: bestMatch.id,
                        lat: Number(bestMatch.latitude),
                        lng: Number(bestMatch.longitude),
                    },
                };
            }
        }
        catch (error) {
            console.warn("[CHATBOT] Dynamic route match failed, using fallback route dictionary");
        }
        // Fallback estático por si la DB no está disponible
        if (normalized.includes('fogata')) {
            return { content: "¡Claro! Te estoy trazando la ruta hacia **La Fogata** ahora mismo. Prepárate para una excelente comida. 🥩📍", metadata: { action: 'ROUTE', placeId: 'mock-real-1', lat: 4.5512, lng: -75.6598 } };
        }
        if (normalized.includes('solar')) {
            return { content: "Generando ruta para **El Solar Gastrobar**. Es un lugar increíble, te va a encantar. 🍸📍", metadata: { action: 'ROUTE', placeId: 'mock-real-2', lat: 4.5495, lng: -75.6631 } };
        }
        if (normalized.includes('papaya')) {
            return { content: "¡Rumba en camino! Trazando ruta a **Dar Papaya**. ¡Disfruta la noche! 💃📍", metadata: { action: 'ROUTE', placeId: 'mock-real-3', lat: 4.5540, lng: -75.6580 } };
        }
        if (normalized.includes('bunker')) {
            return { content: "Iniciando navegación hacia **El Bunker**. Recuerda que es un sitio clandestino, ¡mucha suerte! 🕵️‍♂️📍", metadata: { action: 'ROUTE', placeId: 'mock-real-bunker', lat: 4.5450, lng: -75.6680 } };
        }
        return { content: "¡Listo! Puedo llevarte a cualquier lugar del mapa. Escríbeme por ejemplo: *\"ruta a Café Quindío\"* o *\"cómo llegar a Museo del Oro Quimbaya\"*. 📍" };
    }
    // --- END OF LOCAL ROUTING ---
    // --- GEMINI AI ---
    try {
        if (!isValidApiKey) {
            console.log("[CHATBOT] No valid Gemini API key — using enhanced local expert system");
            return await buildLocalAnswer(messages, normalizeText(lastMessage));
        }
        const aiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
        // Build the request URL with the API key as query parameter
        const requestUrl = `${aiUrl}?key=${encodeURIComponent(apiKey)}`;
        // Build conversation history in Gemini format
        const geminiContents = [];
        // Add conversation history (Gemini doesn't have a "system" role in contents, 
        // we prepend it as a user message)
        const fullSystemPrompt = SYSTEM_PROMPT + (dynamicContext ? `\n\n${dynamicContext}` : "");
        geminiContents.push({
            role: "user",
            parts: [{ text: fullSystemPrompt + "\n\nResponde siempre siguiendo estas instrucciones." }],
        });
        geminiContents.push({
            role: "model",
            parts: [{ text: "¡Entendido! Soy el asistente virtual de Ubica2. Estoy listo para ayudarte a encontrar los mejores planes. 😊" }],
        });
        // Add actual conversation messages
        for (const msg of messages) {
            geminiContents.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            });
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        console.log("[CHATBOT] Calling Gemini API...");
        const response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: geminiContents,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 600,
                    topP: 0.95,
                    topK: 40,
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("[CHATBOT] Gemini API error:", response.status, errorBody);
            throw new Error(`Gemini API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("[CHATBOT] Gemini response received successfully");
        // Parse Gemini response format
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts
            ?.map((part) => part.text || "")
            .join("") || "";
        return { content: text || "No pude generar una respuesta. ¿Podrías intentar de nuevo? 🙏" };
    }
    catch (error) {
        console.error("[CHATBOT] AI call error:", error?.message || error);
        const localAnswer = await buildLocalAnswer(messages, normalizeText(lastMessage));
        if (localAnswer?.content) {
            return localAnswer;
        }
        if (error?.message?.includes("429")) {
            return {
                content: "¡Uy, qué pena! Hay mucha gente buscando planes ahora mismo y estoy un tris ocupado. Dame un segundito y vuelve a intentar. ¿Qué tipo de plan tenías en mente? 😊",
            };
        }
        return {
            content: "¡Ay, se me cruzaron los cables un momento! Tuve un pequeño fallo de conexión. Pero no te preocupes, cuéntame: ¿buscas un plan relajado, una buena rumba o comer algo delicioso? ¡Aquí estoy para ayudarte! 😊",
        };
    }
};
exports.callAI = callAI;
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function formatEventSchedule(event) {
    let scheduleStr = "";
    if (event.recurrence && event.recurrence.weekday !== undefined) {
        const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        scheduleStr = `Todos los ${weekdays[event.recurrence.weekday]}s`;
    }
    else {
        scheduleStr = "Evento regular";
    }
    try {
        if (event.startTime) {
            const timeStr = new Date(event.startTime).toISOString().substr(11, 5);
            const [hour, minute] = timeStr.split(":");
            const h = parseInt(hour, 10);
            const ampm = h >= 12 ? "PM" : "AM";
            const displayHour = h % 12 === 0 ? 12 : h % 12;
            scheduleStr += ` a partir de las ${displayHour}:${minute} ${ampm}`;
        }
    }
    catch (e) {
        scheduleStr += " en horario indicado";
    }
    return scheduleStr;
}
async function buildDynamicSystemContext() {
    try {
        const places = await prisma_1.prisma.place.findMany({
            where: {
                status: "PUBLISHED",
                deletedAt: null,
                city: { name: { equals: "Armenia" } }
            },
            include: {
                placeType: true,
                city: true
            }
        });
        const events = await prisma_1.prisma.event.findMany({
            where: {
                status: "ACTIVE",
                deletedAt: null,
                place: { city: { name: { equals: "Armenia" } } }
            },
            include: {
                place: true,
                category: true,
                recurrence: true
            }
        });
        let context = "--- DATOS REALES DE LA BASE DE DATOS DE UBICA2 (Úsalos para tus respuestas) ---\n\n";
        context += "[ESTABLECIMIENTOS (Lugares, Restaurantes, Bares, Discotecas, Cafés, etc.)]\n";
        places.forEach(p => {
            context += `- **${p.name}** | Tipo: ${p.placeType.name} | Ciudad: ${p.city.name} | Dirección: ${p.addressLine || "No disponible"} | Nivel de precio: ${p.priceLevel ? p.priceLevel + "/4" : "No especificado"}\n`;
            if (p.description)
                context += `  Descripción: ${p.description}\n`;
        });
        context += "\n[EVENTOS ACTIVOS PROGRAMADOS]\n";
        events.forEach(e => {
            context += `- Evento: **${e.title}** (Categoría: ${e.category?.name || "General"}) en el establecimiento **${e.place.name}** (${e.place.addressLine || "Dirección no disponible"}).\n`;
            if (e.description)
                context += `  Descripción: ${e.description}\n`;
            let scheduleStr = "";
            if (e.recurrence && e.recurrence.weekday !== undefined) {
                const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                scheduleStr = `Todos los ${weekdays[e.recurrence.weekday]}s`;
            }
            else {
                scheduleStr = "Evento regular";
            }
            try {
                if (e.startTime) {
                    const timeStr = new Date(e.startTime).toISOString().substr(11, 5);
                    scheduleStr += ` a partir de las ${timeStr}`;
                }
            }
            catch (err) { }
            context += `  Horario: ${scheduleStr} | Precio desde: COP ${e.priceFrom ? Number(e.priceFrom).toLocaleString("es-CO") : "Entrada libre"}\n`;
        });
        context += "\n[REGLAS E INSTRUCCIONES CLAVE PARA TI (IA)]:\n";
        context += "1. Utiliza ÚNICAMENTE la lista anterior de establecimientos y eventos para recomendar parches. No inventes lugares.\n";
        context += "2. Si el usuario dice que tiene hambre, quiere comer algo, cenar, o almorzar, recomiéndale inmediatamente los Restaurantes de la lista anterior (como La Fogata o El Solar Gastrobar) describiendo su propuesta gastronómica con entusiasmo.\n";
        context += "3. Si el usuario dice que quiere tomar cerveza, cocteles, salir de fiesta, de rumba, o busca planes nocturnos, recomiéndale los Bares o Discotecas de la lista anterior (como El Bunker clandestino o Dar Papaya) y descríbelos de forma muy vibrante y animada.\n";
        context += "4. Mantén una conversación fluida, extremadamente cálida, natural, empática y con acento/personalidad de guía local colombiano. Responde a preguntas de charla comunes amigablemente antes de saltar a las recomendaciones.\n";
        context += "5. Bajo ninguna circunstancia le digas al usuario 'tengo una base de datos' o 'según la lista'. Responde de forma integrada, como si fueras el habitante local más conocedor de la ciudad.\n";
        context += "6. Si el usuario te pregunta explícitamente sobre cómo llegar o te pide una ruta a un sitio, explícale que puede ingresar 'ruta a [establecimiento]' para abrir el mapa interactivo.\n";
        return context;
    }
    catch (err) {
        console.error("[CHATBOT] Error building dynamic context:", err);
        return "";
    }
}
const sendMessage = async (userId, data) => {
    console.log(`[CHATBOT] New message from user ${userId}: "${data.message}" (lat: ${data.lat}, lng: ${data.lng})`);
    let conversation;
    const dbTimeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
    try {
        // Intentar operaciones de DB con timeout razonable para no caer en modo offline por latencia normal
        let tempConversation = await Promise.race([
            data.conversationId
                ? prisma_1.prisma.chatConversation.findUnique({ where: { id: data.conversationId } })
                : (0, exports.getOrCreateConversation)(userId),
            dbTimeout(3000)
        ]);
        if (!tempConversation) {
            tempConversation = await (0, exports.getOrCreateConversation)(userId);
        }
        conversation = tempConversation;
        if (conversation && conversation.userId === userId) {
            await Promise.race([
                prisma_1.prisma.chatMessage.create({
                    data: {
                        conversationId: conversation.id,
                        role: "user",
                        content: data.message,
                    },
                }),
                dbTimeout(1500)
            ]);
            await Promise.race([
                prisma_1.prisma.chatConversation.update({
                    where: { id: conversation.id },
                    data: { updatedAt: new Date() },
                }),
                dbTimeout(1500)
            ]);
        }
    }
    catch (dbError) {
        console.warn("[CHATBOT] Database slow or unreachable, operating in memory-only mode");
        conversation = { id: "offline-conv", userId };
    }
    console.log(`[CHATBOT] Message processed. Fetching history...`);
    let history = [];
    try {
        if (conversation.id !== "offline-conv") {
            history = await (0, exports.getConversationMessages)(conversation.id, 10);
        }
    }
    catch (e) {
        console.warn("[CHATBOT] Could not fetch history from DB");
    }
    if (history.length === 0) {
        history = [{ role: "user", content: data.message }];
    }
    // --- GEOLOCALIZACION Y EVENTOS CERCANOS ---
    let nearbyEvents = [];
    let proximityContext = "";
    if (data.lat !== undefined && data.lng !== undefined) {
        try {
            const events = await prisma_1.prisma.event.findMany({
                where: {
                    status: "ACTIVE",
                    deletedAt: null,
                    place: {
                        status: "PUBLISHED"
                    }
                },
                include: {
                    place: true,
                    category: true
                }
            });
            const eventsWithDistance = events.map(event => {
                const eventLat = event.place.latitude !== null ? Number(event.place.latitude) : null;
                const eventLng = event.place.longitude !== null ? Number(event.place.longitude) : null;
                let distance = 999999;
                if (eventLat !== null && eventLng !== null) {
                    distance = calculateDistance(data.lat, data.lng, eventLat, eventLng);
                }
                return {
                    ...event,
                    distance
                };
            });
            const sortedEvents = eventsWithDistance
                .filter(e => e.distance < 50) // dentro de 50km
                .sort((a, b) => a.distance - b.distance);
            if (sortedEvents.length === 0) {
                proximityContext = "\n\nINSTRUCCIÓN DE SISTEMA: El usuario está buscando recomendaciones de eventos cercanos pero no se encontraron eventos cercanos (dentro de 50km) en este momento. Debes responder amablemente y exactamente: 'No se encontraron eventos cercanos en este momento.'";
            }
            else {
                nearbyEvents = sortedEvents.map(e => ({
                    id: e.id,
                    title: e.title,
                    placeName: e.place.name,
                    address: e.place.addressLine || "Dirección no disponible",
                    schedule: formatEventSchedule(e),
                    category: e.category?.name || "General",
                    lat: Number(e.place.latitude),
                    lng: Number(e.place.longitude),
                    distance: e.distance
                }));
                proximityContext = `\n\nINSTRUCCIÓN DE SISTEMA: El usuario está buscando recomendaciones basadas en su ubicación actual. Aquí tienes los eventos reales más cercanos en Armenia ordenados de menor a mayor distancia desde el usuario (lat: ${data.lat}, lng: ${data.lng}):\n`;
                nearbyEvents.forEach((e, idx) => {
                    proximityContext += `${idx + 1}. **${e.title}** (Categoría: ${e.category}) en ${e.placeName} (${e.address}) a ${e.distance.toFixed(2)} km. Horario: ${e.schedule}.\n`;
                });
                proximityContext += `\nRecomienda estos eventos al usuario de forma muy natural, amable, en orden de distancia, incluyendo su nombre, ubicación, horario, categoría y distancia. Invítalo a hacer clic en 'Trazar ruta' para ver el camino en el mapa interactivo.`;
            }
        }
        catch (err) {
            console.error("[CHATBOT] Error fetching nearby events:", err);
        }
    }
    const aiHistory = history.map((m) => ({
        role: m.role,
        content: m.content,
    }));
    // Inyectar el contexto de proximidad en el último mensaje de usuario
    if (proximityContext && aiHistory.length > 0) {
        const lastUserIndex = [...aiHistory].reverse().findIndex(m => m.role === 'user');
        if (lastUserIndex !== -1) {
            const realIndex = aiHistory.length - 1 - lastUserIndex;
            aiHistory[realIndex].content += proximityContext;
        }
    }
    let dynamicContext = "";
    try {
        dynamicContext = await buildDynamicSystemContext();
    }
    catch (err) {
        console.error("[CHATBOT] Failed to build dynamic context:", err);
    }
    console.log(`[CHATBOT] History count: ${aiHistory.length}. Calling expert system...`);
    const aiResponse = await (0, exports.callAI)(aiHistory, dynamicContext);
    console.log(`[CHATBOT] AI Response generated: ${aiResponse.content.substring(0, 50)}...`);
    const finalMetadata = aiResponse.metadata || {};
    if (nearbyEvents.length > 0) {
        finalMetadata.action = "RECOMMEND_EVENTS";
        finalMetadata.items = nearbyEvents;
    }
    try {
        const savedMessage = await prisma_1.prisma.chatMessage.create({
            data: {
                conversationId: conversation.id,
                role: "assistant",
                content: aiResponse.content,
                metadata: finalMetadata,
            },
        });
        console.log(`[CHATBOT] Response saved successfully.`);
        return {
            conversationId: conversation.id,
            message: savedMessage,
        };
    }
    catch (dbError) {
        console.error("[CHATBOT] Error saving AI response to DB, returning memory-only response");
        return {
            conversationId: conversation?.id || "temp-id",
            message: {
                id: Date.now().toString(),
                conversationId: conversation?.id || "temp-id",
                role: "assistant",
                content: aiResponse.content,
                metadata: finalMetadata,
                createdAt: new Date().toISOString()
            }
        };
    }
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
