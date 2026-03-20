import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fetching places from the database...');
  
  const places = await prisma.place.findMany();
  
  if (places.length === 0) {
    console.log('❌ No places found in the database. Add some places first.');
    return;
  }

  console.log(`📍 Updating coordinates for ${places.length} places (setting them around Armenia)...`);

  for (const place of places) {
    // Generate valid random coordinates near Armenia (4.5401, -75.6657)
    // variation of ~5km
    const randomLat = 4.5401 + (Math.random() - 0.5) * 0.05;
    const randomLng = -75.6657 + (Math.random() - 0.5) * 0.05;

    await prisma.place.update({
      where: { id: place.id },
      data: {
        latitude: randomLat,
        longitude: randomLng,
        status: 'PUBLISHED' // also ensure they are published
      }
    });
  }

  console.log('✅ All places have been successfully updated with coordinates!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
