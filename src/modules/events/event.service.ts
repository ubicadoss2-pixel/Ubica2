import { DateTime } from "luxon";
import { prisma } from "../../config/prisma";
import { CreateEventDTO, UpdateEventDTO } from "./event.schema";
import { getPagination } from "../../shared/utils/pagination";
import { geocodeAddress } from "../../shared/utils/geocoding";
import { getEntityRatingStats } from "../comments/comment.service";

const toTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Support both HH:mm:ss and HH:mm
  const parts = trimmed.split(":");
  let timePart = parts.length === 2 ? `${trimmed}:00` : trimmed;
  // Fix single digit hour from some mobile inputs
  if (timePart.indexOf(':') === 1) {
    timePart = '0' + timePart;
  }
  const date = new Date(`1970-01-01T${timePart}Z`);
  if (isNaN(date.getTime())) {
    throw new Error(`Formato de hora invalido: ${value}. Use HH:mm o HH:mm:ss`);
  }
  return date;
};

const hasConflict = async (
  placeId: string,
  title: string,
  startTime: Date,
  endTime: Date | null,
  recurrenceWeekday?: number,
  specialDate?: string,
  excludeEventId?: string
) => {
  const baseWhere: any = {
    placeId,
    title,
    startTime,
    endTime,
    deletedAt: null,
  };

  if (excludeEventId) {
    baseWhere.id = { not: excludeEventId };
  }

  if (recurrenceWeekday !== undefined) {
    return prisma.event.findFirst({
      where: {
        ...baseWhere,
        recurrence: { is: { weekday: recurrenceWeekday } },
      },
      select: { id: true },
    });
  }

  if (specialDate) {
    return prisma.event.findFirst({
      where: {
        ...baseWhere,
        specialDates: {
          some: {
            eventDate: new Date(specialDate),
            dateType: "OCCURRENCE",
          },
        },
      },
      select: { id: true },
    });
  }

  return null;
};

export const createEvent = async (data: CreateEventDTO, userId: string, isAdmin: boolean) => {
  const place = await prisma.place.findUnique({ where: { id: data.placeId } });
  if (!place) throw new Error("Lugar no existe");
  if (!isAdmin && place.ownerUserId !== userId) throw new Error("No autorizado");

  const startTime = toTime(data.startTime);
  if (!startTime) throw new Error("Hora de inicio es requerida");
  const endTime = data.endTime ? toTime(data.endTime) : null;

  if (data.recurrence?.weekday !== undefined) {
    const conflict = await hasConflict(
      data.placeId,
      data.title,
      startTime,
      endTime,
      data.recurrence.weekday,
      undefined
    );
    if (conflict) throw new Error("Conflicto: evento duplicado en el mismo dia");
  }

  if (data.specialDates && data.specialDates.length > 0) {
    for (const sd of data.specialDates) {
      if (sd.dateType === "EXCEPTION") continue;
      const conflict = await hasConflict(
        data.placeId,
        data.title,
        startTime,
        endTime,
        undefined,
        sd.eventDate
      );
      if (conflict) throw new Error("Conflicto: evento duplicado en la misma fecha");
    }
  }

  const createData: any = {
    placeId: data.placeId,
    categoryId: data.categoryId,
    title: data.title,
    description: data.description,
    dressCode: data.dressCode,
    minAge: data.minAge,
    currency: data.currency || "COP",
    priceFrom: data.priceFrom,
    priceTo: data.priceTo,
    startTime,
    endTime,
    status: data.status || "ACTIVE",
    recurrence: data.recurrence
      ? { create: { weekday: data.recurrence.weekday } }
      : undefined,
    specialDates: data.eventDate
      ? {
          create: [{ eventDate: new Date(data.eventDate), dateType: "OCCURRENCE", note: "" }]
        }
      : (data.specialDates
        ? {
            create: data.specialDates.map((sd) => ({
              eventDate: new Date(sd.eventDate),
              dateType: sd.dateType || "OCCURRENCE",
              note: sd.note,
            })),
          }
        : undefined),
    photos: data.photos
      ? {
          create: data.photos.map((url: string, index: number) => ({
            url,
            sortOrder: index,
          })),
        }
      : undefined,
  };

  return prisma.event.create({
    data: createData,
  });
};

export const updateEvent = async (
  eventId: string,
  data: UpdateEventDTO,
  userId: string,
  isAdmin: boolean
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { place: true, recurrence: true },
  });
  if (!event) throw new Error("Evento no existe");
  if (!isAdmin && event.place.ownerUserId !== userId) throw new Error("No autorizado");

  const startTime = data.startTime ? toTime(data.startTime) : event.startTime;
  const endTime = data.endTime ? toTime(data.endTime) : event.endTime;
  if (!startTime) throw new Error("Hora de inicio invalida");
  const title = data.title || (event as any).title;

  if (data.recurrence?.weekday !== undefined) {
    const conflict = await hasConflict(
      event.placeId,
      title,
      startTime,
      endTime,
      data.recurrence.weekday,
      undefined,
      eventId
    );
    if (conflict) throw new Error("Conflicto: evento duplicado en el mismo dia");
  }

  if (data.specialDates && data.specialDates.length > 0) {
    for (const sd of data.specialDates) {
      if (sd.dateType === "EXCEPTION") continue;
      const conflict = await hasConflict(
        event.placeId,
        title,
        startTime,
        endTime,
        undefined,
        sd.eventDate,
        eventId
      );
      if (conflict) throw new Error("Conflicto: evento duplicado en la misma fecha");
    }
  }

  const updateData: any = {
    categoryId: data.categoryId,
    title: data.title,
    description: data.description,
    dressCode: data.dressCode,
    minAge: data.minAge,
    currency: data.currency,
    priceFrom: data.priceFrom,
    priceTo: data.priceTo,
    startTime: data.startTime ? startTime : undefined,
    endTime: data.endTime ? endTime : undefined,
    status: data.status,
    recurrence: data.recurrence
      ? { upsert: { create: { weekday: data.recurrence.weekday }, update: { weekday: data.recurrence.weekday } } }
      : undefined,
    specialDates: data.eventDate
      ? {
          deleteMany: {},
          create: [{ eventDate: new Date(data.eventDate), dateType: "OCCURRENCE", note: "" }]
        }
      : (data.specialDates
        ? {
            deleteMany: {},
            create: data.specialDates.map((sd) => ({
              eventDate: new Date(sd.eventDate),
              dateType: sd.dateType || "OCCURRENCE",
              note: sd.note,
            })),
          }
        : undefined),
    photos: data.photos
      ? {
          deleteMany: {},
          create: data.photos.map((url: string, index: number) => ({
            url,
            sortOrder: index,
          })),
        }
      : undefined,
  };

  return prisma.event.update({
    where: { id: eventId },
    data: updateData,
  });
};

export const getEventById = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      place: true,
      category: true,
      recurrence: true,
      specialDates: true,
    },
  });

  if (!event) return null;

  const eventDate = event.specialDates?.[0]?.eventDate?.toISOString().substring(0, 10);
  
  const stats = await getEntityRatingStats("eventId", eventId);

  return {
    ...event,
    latitude: event.place?.latitude ? Number(event.place.latitude) : null,
    longitude: event.place?.longitude ? Number(event.place.longitude) : null,
    addressLine: event.place?.addressLine || null,
    neighborhood: event.place?.neighborhood || null,
    postalCode: event.place?.postalCode || null,
    eventDate,
    averageRating: stats.averageRating,
    totalRatings: stats.totalRatings,
  };
};

const filterEventsByDate = (events: any[], date?: string, weekday?: number, time?: string) => {
  if (!date && weekday === undefined && !time) return events;
  const targetDate = date ? DateTime.fromISO(date, { zone: "utc" }) : null;
  const targetWeekday = weekday !== undefined ? weekday : (targetDate ? (targetDate.weekday === 7 ? 0 : targetDate.weekday) : undefined);

  return events.filter((event) => {
    let dateMatch = false;
    let timeMatch = true;

    if (time && event.startTime) {
      const eventTimeStr = DateTime.fromJSDate(event.startTime, { zone: "utc" }).toISOTime({ suppressMilliseconds: true, suppressSeconds: true })?.substring(0, 5) || "";
      if (time.length === 5) {
         timeMatch = eventTimeStr >= time;
      } else {
         timeMatch = eventTimeStr >= time.substring(0, 5);
      }
    }

    const occurrences = event.specialDates || [];
    if (date) {
      const hasOccurrence = occurrences.some((sd: any) => sd.dateType === "OCCURRENCE" && DateTime.fromJSDate(sd.eventDate, { zone: "utc" }).toISODate() === targetDate!.toISODate());
      const hasException = occurrences.some((sd: any) => sd.dateType === "EXCEPTION" && DateTime.fromJSDate(sd.eventDate, { zone: "utc" }).toISODate() === targetDate!.toISODate());
      if (hasOccurrence) dateMatch = true;
      else if (hasException) dateMatch = false;
      else dateMatch = !!(event.recurrence && event.recurrence.weekday === targetWeekday);
    } else if (weekday !== undefined) {
      const hasOccurrenceOnWeekday = occurrences.some((sd: any) => {
        if (sd.dateType !== "OCCURRENCE") return false;
        const wd = DateTime.fromJSDate(sd.eventDate, { zone: "utc" }).weekday;
        const wk = wd === 7 ? 0 : wd;
        return wk === weekday;
      });
      if (hasOccurrenceOnWeekday) dateMatch = true;
      else dateMatch = !!(event.recurrence && event.recurrence.weekday === weekday);
    } else {
      dateMatch = true;
    }

    return dateMatch && timeMatch;
  });
};

export const listEventsByPlace = async (placeId: string, query: any) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const { skip, take } = getPagination(page, pageSize);

  const events = await prisma.event.findMany({
    where: { placeId, deletedAt: null, status: "ACTIVE" },
    include: { 
      recurrence: true, 
      specialDates: true, 
      category: true, 
      photos: { orderBy: { sortOrder: "asc" } },
      place: true 
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const weekday = query.weekday !== undefined ? Number(query.weekday) : undefined;
  const date = query.date as string | undefined;
  const filtered = filterEventsByDate(events, date, weekday);
  const mapped = filtered.map(event => ({
    ...event,
    latitude: event.place?.latitude ? Number(event.place.latitude) : null,
    longitude: event.place?.longitude ? Number(event.place.longitude) : null,
    addressLine: event.place?.addressLine || null,
    neighborhood: event.place?.neighborhood || null,
    postalCode: event.place?.postalCode || null,
    eventDate: event.specialDates?.[0]?.eventDate || null,
  }));

  return { page, pageSize, total: filtered.length, items: mapped };
};

export const listAgenda = async (query: any, userId?: string, role?: string) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const { skip, take } = getPagination(page, pageSize);

  const cityId = query.cityId as string | undefined;
  const categoryId = query.categoryId as string | undefined;
  const weekday = query.weekday !== undefined ? Number(query.weekday) : undefined;
  const date = query.date as string | undefined;
  const time = query.time as string | undefined;
  const ownerId = query.ownerId as string | undefined;

  const where: any = { deletedAt: null };
  
  if (role === 'ADMIN') {
    // Admin sees everything. If ownerId is provided, filter by it.
    if (ownerId) where.place = { ownerUserId: ownerId };
  } else if (ownerId && role === 'OWNER' && userId === ownerId) {
    // Owner sees all of their own events (including pending, etc.)
    where.place = { ownerUserId: ownerId };
  } else {
    // Regular public filtering: only active events on published places.
    // If ownerId is specified, restrict to that owner's events.
    where.status = "ACTIVE";
    where.place = { status: "PUBLISHED" };
    if (ownerId) {
      where.place.ownerUserId = ownerId;
    }
  }
  
  if (cityId) where.place = { ...where.place, cityId };
  if (categoryId) where.categoryId = categoryId;

  console.log("[listAgenda DEBUG] query:", query, "userId:", userId, "role:", role, "where:", JSON.stringify(where));

  const events = await prisma.event.findMany({
    where,
    include: { 
      recurrence: true, 
      specialDates: true, 
      category: true, 
      photos: { orderBy: { sortOrder: "asc" } },
      place: { include: { city: true } } 
    },
    orderBy: [
      { isSponsored: "desc" },
      { createdAt: "desc" }
    ],
    skip,
    take,
  });

  const filtered = filterEventsByDate(events, date, weekday, time);
  const mapped = filtered.map(event => ({
    ...event,
    latitude: event.place?.latitude ? Number(event.place.latitude) : null,
    longitude: event.place?.longitude ? Number(event.place.longitude) : null,
    addressLine: event.place?.addressLine || null,
    neighborhood: event.place?.neighborhood || null,
    postalCode: event.place?.postalCode || null,
    eventDate: event.specialDates?.[0]?.eventDate || null,
  }));
  return { page, pageSize, total: filtered.length, items: mapped };
};

export const listPendingEvents = async () => {
  return prisma.event.findMany({
    where: { status: "PENDING", deletedAt: null },
    include: {
      place: {
        select: { name: true, addressLine: true, city: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const moderateEvent = async (eventId: string, status: "ACTIVE" | "REJECTED") => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Evento no encontrado");
  
  await prisma.event.update({
    where: { id: eventId },
    data: { status }
  });

  return { message: status === "ACTIVE" ? "Evento aprobado correctamente" : "Evento rechazado correctamente" };
};
