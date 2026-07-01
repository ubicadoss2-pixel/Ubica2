import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
  const owner = await prisma.user.findFirst({where: {email: 'owner@ubica2.com'}}); 
  const place = await prisma.place.findFirst(); 
  const cat = await prisma.eventCategory.findFirst(); 
  await prisma.event.create({data: {title: 'Evento Pendiente 1', status: 'PENDING', placeId: place!.id, categoryId: cat!.id, startTime: new Date(), endTime: new Date()}}); 
  await prisma.event.create({data: {title: 'Evento Pendiente 2', status: 'PENDING', placeId: place!.id, categoryId: cat!.id, startTime: new Date(), endTime: new Date()}}); 
  await prisma.place.create({data: {name: 'Nuevo Negocio Pendiente', slug: 'nuevo-negocio-' + Date.now(), cityId: place!.cityId, placeTypeId: place!.placeTypeId, ownerUserId: owner!.id, status: 'DRAFT', latitude: 4.5, longitude: -75.6}}); 
  await prisma.comment.create({data: {userId: owner!.id, placeId: place!.id, content: 'Esta reseña es muy buena pero necesita moderación', status: 'VISIBLE', rating: 5}}); 
  console.log('Data added!'); 
} 
main().finally(() => prisma.$disconnect());
