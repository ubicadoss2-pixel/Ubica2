import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const places = await prisma.place.findMany({ select: { id: true, name: true, slug: true } });
  console.log(JSON.stringify(places, null, 2));
}
main().finally(() => prisma.$disconnect());
