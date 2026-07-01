import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.placePhoto.updateMany({
    where: { place: { slug: "el-bunker" } },
    data: { url: "assets/elbunker.jpg" }
  });
  await prisma.placePhoto.updateMany({
    where: { place: { slug: "museo-del-oro-quimbaya" } },
    data: { url: "assets/museodeoro.jpg" }
  });
  await prisma.placePhoto.updateMany({
    where: { place: { slug: "parque-de-la-vida" } },
    data: { url: "assets/ParquedeLaVidaArmenia.jpeg" }
  });
  await prisma.placePhoto.updateMany({
    where: { place: { slug: "portal-del-quindio" } },
    data: { url: "assets/portalquindio.jpg" }
  });
  console.log("Fotos actualizadas exitosamente!");
}

main().finally(() => prisma.$disconnect());
