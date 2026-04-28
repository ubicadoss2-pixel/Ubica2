import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@ubica2.com" },
    include: { userRoles: { include: { role: true } } }
  });
  console.log(JSON.stringify(user, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
