import { prisma } from "../../config/prisma";
import { CreatePlaceDTO, UpdatePlaceDTO } from "./place.schema";
import { slugify } from "../../shared/utils/slug";
import { getPagination } from "../../shared/utils/pagination";
import { isOpenNow } from "../../shared/utils/time";
import { geocodeAddress } from "../../shared/utils/geocoding";
import { canCreatePlace } from "../plans/plan.service";
import { getEntityRatingStats } from "../comments/comment.service";
import { OpeningHour, Place } from "@prisma/client";

const toTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  const timePart = parts.length === 2 ? `${trimmed}:00` : trimmed;
  const date = new Date(`1970-01-01T${timePart}Z`);
  if (isNaN(date.getTime())) {
    throw new Error(`Formato de hora invalido: ${value}. Use HH:mm o HH:mm:ss`);
  }
  return date;
};

const buildUniqueSlug = async (cityId: string, name: string) => {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const exists = await prisma.place.findFirst({
      where: { cityId, slug },
      select: { id: true },
    });
    if (!exists) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

export const createPlace = async (data: CreatePlaceDTO, ownerUserId: string, isAdmin: boolean) => {
  await canCreatePlace(ownerUserId, isAdmin);
  
  const slug = await buildUniqueSlug(data.cityId, data.name);

  let latitude = data.latitude;
  let longitude = data.longitude;

  if (latitude === undefined || longitude === undefined) {
    let queryFallback = data.addressLine;
    
    if (!queryFallback || queryFallback.trim() === "") {
      const city = await prisma.city.findUnique({ where: { id: data.cityId } });
      if (city) queryFallback = city.name;
    }

    const cityObj = await prisma.city.findUnique({ where: { id: data.cityId } });
    const geo = await geocodeAddress(queryFallback, data.postalCode, cityObj?.name);
    latitude = geo.latitude !== null ? geo.latitude : undefined;
    longitude = geo.longitude !== null ? geo.longitude : undefined;
  }

  return prisma.place.create({
    data: {
      ownerUserId,
      cityId: data.cityId,
      placeTypeId: data.placeTypeId,
      name: data.name,
      slug,
      description: data.description,
      addressLine: data.addressLine,
      neighborhood: data.neighborhood,
      postalCode: data.postalCode,
      latitude,
      longitude,
      priceLevel: data.priceLevel,
      status: data.status || "DRAFT",
      contacts: data.contacts ? { create: data.contacts } : undefined,
      socialLinks: data.socialLinks ? { create: data.socialLinks } : undefined,
      openingHours: data.openingHours
        ? {
            create: data.openingHours.map((h: any) => ({
              weekday: h.weekday,
              openTime: h.openTime ? toTime(h.openTime) : null,
              closeTime: h.closeTime ? toTime(h.closeTime) : null,
              isClosed: h.isClosed ?? false,
            })),
          }
        : undefined,
      photos: data.photos
        ? {
            create: data.photos.map((url: string, index: number) => ({
              url,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });
};

export const updatePlace = async (
  placeId: string,
  data: UpdatePlaceDTO,
  userId: string,
  isAdmin: boolean
) => {
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Lugar no existe");
  if (!isAdmin && place.ownerUserId !== userId) {
    throw new Error("No autorizado");
  }

  const updates: any = { ...data };
  if (data.name && data.name !== place.name) {
    updates.slug = await buildUniqueSlug(place.cityId, data.name);
  }

  if ((data.addressLine !== undefined || data.postalCode !== undefined) && data.latitude === undefined && data.longitude === undefined) {
    let queryFallback = data.addressLine !== undefined ? data.addressLine : place.addressLine;

    if (!queryFallback || queryFallback.trim() === "") {
      const city = await prisma.city.findUnique({ where: { id: place.cityId } });
      if (city) queryFallback = city.name;
    }

    const cityObj = await prisma.city.findUnique({ where: { id: place.cityId } });
    const geo = await geocodeAddress(
      queryFallback,
      data.postalCode !== undefined ? data.postalCode : place.postalCode,
      cityObj?.name
    );
    if (geo.latitude !== null && geo.longitude !== null) {
      updates.latitude = geo.latitude;
      updates.longitude = geo.longitude;
    }
  }

  if (data.photos) {
    updates.photos = {
      deleteMany: {},
      create: data.photos.map((url: string, index: number) => ({
        url,
        sortOrder: index,
      })),
    };
  }

  if (data.contacts) {
    updates.contacts = {
      deleteMany: {},
      create: data.contacts,
    };
  }

  if (data.socialLinks) {
    updates.socialLinks = {
      deleteMany: {},
      create: data.socialLinks,
    };
  }

  if (data.openingHours) {
    updates.openingHours = {
      deleteMany: {},
      create: data.openingHours.map((h: any) => ({
        weekday: h.weekday,
        openTime: h.openTime ? toTime(h.openTime) : null,
        closeTime: h.closeTime ? toTime(h.closeTime) : null,
        isClosed: h.isClosed ?? false,
      })),
    };
  }

  if (data.contacts) {
    updates.contacts = {
      deleteMany: {},
      create: data.contacts,
    };
  }

  if (data.socialLinks) {
    updates.socialLinks = {
      deleteMany: {},
      create: data.socialLinks,
    };
  }

  if (data.openingHours) {
    updates.openingHours = {
      deleteMany: {},
      create: data.openingHours.map((h: any) => ({
        weekday: h.weekday,
        openTime: h.openTime ? toTime(h.openTime) : null,
        closeTime: h.closeTime ? toTime(h.closeTime) : null,
        isClosed: h.isClosed ?? false,
      })),
    };
  }

  // Remove individual fields already mapped to complex prisma objects
  delete updates.photos_list; // If any
  
  return prisma.place.update({
    where: { id: placeId },
    data: updates,
  });
};

export const getPlaceById = async (placeId: string) => {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: {
      city: true,
      placeType: true,
      contacts: true,
      socialLinks: true,
      openingHours: true,
      photos: true,
    },
  });

  if (!place) return null;

  const stats = await getEntityRatingStats("placeId", placeId);

  return {
    ...place,
    averageRating: stats.averageRating,
    totalRatings: stats.totalRatings,
  };
};

export const listPlaces = async (query: any, userId?: string, role?: string) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const { skip, take } = getPagination(page, pageSize);

  const cityId = query.cityId as string | undefined;
  const placeTypeId = query.placeTypeId as string | undefined;
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;
  const priceLevel = query.priceLevel ? Number(query.priceLevel) : undefined;
  const ownerId = query.ownerId as string | undefined;

  const where: any = {
    deletedAt: null,
  };

  if (cityId) where.cityId = cityId;
  if (placeTypeId) where.placeTypeId = placeTypeId;
  if (priceLevel) where.priceLevel = priceLevel;
  if (search) where.name = { contains: search }; // Removed mode: 'insensitive' to fix Prisma MySQL/SQLite bug
  if (ownerId) where.ownerUserId = ownerId;

  if (!role || (role !== "ADMIN" && role !== "OWNER")) {
    where.status = "PUBLISHED";
  } else if (status) {
    where.status = status;
  }

  const [total, items] = await Promise.all([
    prisma.place.count({ where }),
    prisma.place.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        city: true,
        placeType: true,
        openingHours: true,
        photos: true,
      },
    }),
  ]);

  let results = items as (Place & { openingHours: OpeningHour[]; city: { timezone: string } | null })[];
  if (query.openNow === "true") {
    results = results.filter((place) => {
      const timezone = place.city?.timezone;
      if (!timezone) return false;
      return place.openingHours.some((h) =>
        isOpenNow(h.weekday, h.openTime, h.closeTime, h.isClosed, timezone)
      );
    });
  }

  return {
    page,
    pageSize,
    total,
    items: results,
  };
};

export const setPlaceStatus = async (
  placeId: string,
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED"
) => {
  return prisma.place.update({
    where: { id: placeId },
    data: { status },
  });
};
