import { prisma } from "../../config/prisma";

export const listCities = () => {
  return prisma.city.findMany({ orderBy: { name: "asc" } });
};

export const listPlaceTypes = () => {
  return prisma.placeType.findMany({ orderBy: { name: "asc" } });
};

export const listEventCategories = () => {
  return prisma.eventCategory.findMany({ orderBy: { name: "asc" } });
};

export const getMapData = async () => {
  const [places, events] = await Promise.all([
    prisma.place.findMany({
      where: { status: "PUBLISHED", latitude: { not: null }, longitude: { not: null }, deletedAt: null },
      select: { id: true, name: true, addressLine: true, postalCode: true, latitude: true, longitude: true },
    }),
    prisma.event.findMany({
      where: { status: "ACTIVE", latitude: { not: null }, longitude: { not: null }, deletedAt: null },
      select: { id: true, title: true, addressLine: true, postalCode: true, latitude: true, longitude: true },
    }),
  ]);

  const mapPlaces = places.map((p: any) => ({
    id: p.id,
    type: "place",
    title: p.name,
    addressLine: p.addressLine,
    postalCode: p.postalCode,
    latitude: p.latitude !== null ? Number(p.latitude) : null,
    longitude: p.longitude !== null ? Number(p.longitude) : null,
  }));

  const mapEvents = events.map((e: any) => ({
    id: e.id,
    type: "event",
    title: e.title,
    addressLine: e.addressLine,
    postalCode: e.postalCode,
    latitude: e.latitude !== null ? Number(e.latitude) : null,
    longitude: e.longitude !== null ? Number(e.longitude) : null,
  }));

  return [...mapPlaces, ...mapEvents];
};

