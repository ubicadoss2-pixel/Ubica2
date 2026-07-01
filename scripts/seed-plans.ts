import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding plans...');

  const plans = [
    {
      name: 'Básico',
      limitPlaces: 3,
      limitEvents: 5,
      price: 29900,
      durationDays: 30,
      isActive: true,
    },
    {
      name: 'Profesional',
      limitPlaces: 10,
      limitEvents: 30,
      price: 79900,
      durationDays: 30,
      isActive: true,
    },
    {
      name: 'Premium',
      limitPlaces: 999,
      limitEvents: 999,
      price: 149900,
      durationDays: 30,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Created plan: ${plan.name}`);
    } else {
      console.log(`⏭️ Plan already exists: ${plan.name}`);
    }
  }

  console.log('✅ Plans seeded!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
