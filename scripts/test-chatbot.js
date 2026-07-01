const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userId = "test-user-123";
  // Delete old to start fresh
  await prisma.chatConversation.deleteMany({ where: { userId } });
  
  const conversation = await prisma.chatConversation.create({ data: { userId } });
  
  const addMsg = async (role, content) => {
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role, content }
    });
  }
  
  await addMsg("user", "hola");
  
  // Now let's simulate what buildLocalAnswer does.
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" }
  });
  
  console.log("HISTORY:", history.map(m => `[${m.role}] ${m.content}`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
