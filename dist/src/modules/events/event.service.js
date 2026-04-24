"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAgenda = exports.listEventsByPlace = exports.getEventById = exports.updateEvent = exports.createEvent = void 0;
const luxon_1 = require("luxon");
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../shared/utils/pagination");
const geocoding_1 = require("../../shared/utils/geocoding");
const plan_service_1 = require("../plans/plan.service");
const comment_service_1 = require("../comments/comment.service");
const toTime = (value) => {
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    // Support both HH:mm:ss and HH:mm
    const parts = trimmed.split(":");
    const timePart = parts.length === 2 ? `${trimmed}:00` : trimmed;
    const date = new Date(`1970-01-01T${timePart}Z`);
    if (isNaN(date.getTime())) {
        throw new Error(`Formato de hora invalido: ${value}. Use HH:mm o HH:mm:ss`);
    }
    return date;
};
const hasConflict = async (placeId, title, startTime, endTime, recurrenceWeekday, specialDate, excludeEventId) => {
    const baseWhere = {
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
        return prisma_1.prisma.event.findFirst({
            where: {
                ...baseWhere,
                recurrence: { is: { weekday: recurrenceWeekday } },
            },
            select: { id: true },
        });
    }
    if (specialDate) {
        return prisma_1.prisma.event.findFirst({
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
const createEvent = async (data, userId, isAdmin) => {
    await (0, plan_service_1.canCreateEvent)(userId, isAdmin);
    const place = await prisma_1.prisma.place.findUnique({ where: { id: data.placeId } });
    if (!place)
        throw new Error("Lugar no existe");
    if (!isAdmin && place.ownerUserId !== userId)
        throw new Error("No autorizado");
    const startTime = toTime(data.startTime);
    if (!startTime)
        throw new Error("Hora de inicio es requerida");
    const endTime = data.endTime ? toTime(data.endTime) : null;
    if (data.recurrence?.weekday !== undefined) {
        const conflict = await hasConflict(data.placeId, data.title, startTime, endTime, data.recurrence.weekday, undefined);
        if (conflict)
            throw new Error("Conflicto: evento duplicado en el mismo dia");
    }
    if (data.specialDates && data.specialDates.length > 0) {
        for (const sd of data.specialDates) {
            if (sd.dateType === "EXCEPTION")
                continue;
            const conflict = await hasConflict(data.placeId, data.title, startTime, endTime, undefined, sd.eventDate);
            if (conflict)
                throw new Error("Conflicto: evento duplicado en la misma fecha");
        }
    }
    let latitude = data.latitude;
    let longitude = data.longitude;
    if (latitude === undefined || longitude === undefined) {
        latitude = place.latitude ? Number(place.latitude) : undefined;
        longitude = place.longitude ? Number(place.longitude) : undefined;
    }
    const createData = {
        placeId: data.placeId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        addressLine: data.addressLine,
        neighborhood: data.neighborhood,
        postalCode: data.postalCode,
        latitude,
        longitude,
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
        specialDates: data.specialDates
            ? {
                create: data.specialDates.map((sd) => ({
                    eventDate: new Date(sd.eventDate),
                    dateType: sd.dateType || "OCCURRENCE",
                    note: sd.note,
                })),
            }
            : undefined,
        photos: data.photos
            ? {
                create: data.photos.map((url, index) => ({
                    url,
                    sortOrder: index,
                })),
            }
            : undefined,
    };
    return prisma_1.prisma.event.create({
        data: createData,
    });
};
exports.createEvent = createEvent;
const updateEvent = async (eventId, data, userId, isAdmin) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        include: { place: true, recurrence: true },
    });
    if (!event)
        throw new Error("Evento no existe");
    if (!isAdmin && event.place.ownerUserId !== userId)
        throw new Error("No autorizado");
    const startTime = data.startTime ? toTime(data.startTime) : event.startTime;
    const endTime = data.endTime ? toTime(data.endTime) : event.endTime;
    if (!startTime)
        throw new Error("Hora de inicio invalida");
    const title = data.title || event.title;
    if (data.recurrence?.weekday !== undefined) {
        const conflict = await hasConflict(event.placeId, title, startTime, endTime, data.recurrence.weekday, undefined, eventId);
        if (conflict)
            throw new Error("Conflicto: evento duplicado en el mismo dia");
    }
    if (data.specialDates && data.specialDates.length > 0) {
        for (const sd of data.specialDates) {
            if (sd.dateType === "EXCEPTION")
                continue;
            const conflict = await hasConflict(event.placeId, title, startTime, endTime, undefined, sd.eventDate, eventId);
            if (conflict)
                throw new Error("Conflicto: evento duplicado en la misma fecha");
        }
    }
    let latitude = data.latitude;
    let longitude = data.longitude;
    if ((data.addressLine !== undefined || data.postalCode !== undefined) && latitude === undefined && longitude === undefined) {
        const geo = await (0, geocoding_1.geocodeAddress)(data.addressLine !== undefined ? data.addressLine : event.addressLine, data.postalCode !== undefined ? data.postalCode : event.postalCode);
        if (geo.latitude !== null && geo.longitude !== null) {
            latitude = geo.latitude;
            longitude = geo.longitude;
        }
    }
    const updateData = {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        addressLine: data.addressLine,
        neighborhood: data.neighborhood,
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
        specialDates: data.specialDates
            ? {
                deleteMany: {},
                create: data.specialDates.map((sd) => ({
                    eventDate: new Date(sd.eventDate),
                    dateType: sd.dateType || "OCCURRENCE",
                    note: sd.note,
                })),
            }
            : undefined,
        photos: data.photos
            ? {
                deleteMany: {},
                create: data.photos.map((url, index) => ({
                    url,
                    sortOrder: index,
                })),
            }
            : undefined,
    };
    return prisma_1.prisma.event.update({
        where: { id: eventId },
        data: updateData,
    });
};
exports.updateEvent = updateEvent;
const getEventById = async (eventId) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        include: {
            place: true,
            category: true,
            recurrence: true,
            specialDates: true,
        },
    });
    if (!event)
        return null;
    const stats = await (0, comment_service_1.getEntityRatingStats)("eventId", eventId);
    return {
        ...event,
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
    };
};
exports.getEventById = getEventById;
const filterEventsByDate = (events, date, weekday, time) => {
    if (!date && weekday === undefined && !time)
        return events;
    const targetDate = date ? luxon_1.DateTime.fromISO(date) : null;
    const targetWeekday = weekday !== undefined ? weekday : (targetDate ? (targetDate.weekday === 7 ? 0 : targetDate.weekday) : undefined);
    return events.filter((event) => {
        let dateMatch = false;
        let timeMatch = true;
        if (time && event.startTime) {
            const eventTimeStr = luxon_1.DateTime.fromJSDate(event.startTime).toISOTime({ suppressMilliseconds: true, suppressSeconds: true })?.substring(0, 5) || "";
            if (time.length === 5) {
                timeMatch = eventTimeStr >= time;
            }
            else {
                timeMatch = eventTimeStr >= time.substring(0, 5);
            }
        }
        const occurrences = event.specialDates || [];
        if (date) {
            const hasOccurrence = occurrences.some((sd) => sd.dateType === "OCCURRENCE" && luxon_1.DateTime.fromJSDate(sd.eventDate).toISODate() === targetDate.toISODate());
            const hasException = occurrences.some((sd) => sd.dateType === "EXCEPTION" && luxon_1.DateTime.fromJSDate(sd.eventDate).toISODate() === targetDate.toISODate());
            if (hasOccurrence)
                dateMatch = true;
            else if (hasException)
                dateMatch = false;
            else
                dateMatch = !!(event.recurrence && event.recurrence.weekday === targetWeekday);
        }
        else if (weekday !== undefined) {
            const hasOccurrenceOnWeekday = occurrences.some((sd) => {
                if (sd.dateType !== "OCCURRENCE")
                    return false;
                const wd = luxon_1.DateTime.fromJSDate(sd.eventDate).weekday;
                const wk = wd === 7 ? 0 : wd;
                return wk === weekday;
            });
            if (hasOccurrenceOnWeekday)
                dateMatch = true;
            else
                dateMatch = !!(event.recurrence && event.recurrence.weekday === weekday);
        }
        else {
            dateMatch = true;
        }
        return dateMatch && timeMatch;
    });
};
const listEventsByPlace = async (placeId, query) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { skip, take } = (0, pagination_1.getPagination)(page, pageSize);
    const events = await prisma_1.prisma.event.findMany({
        where: { placeId, deletedAt: null },
        include: { recurrence: true, specialDates: true, category: true, place: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
    });
    const weekday = query.weekday !== undefined ? Number(query.weekday) : undefined;
    const date = query.date;
    const filtered = filterEventsByDate(events, date, weekday);
    return { page, pageSize, total: filtered.length, items: filtered };
};
exports.listEventsByPlace = listEventsByPlace;
const listAgenda = async (query, userId, role) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { skip, take } = (0, pagination_1.getPagination)(page, pageSize);
    const cityId = query.cityId;
    const categoryId = query.categoryId;
    const weekday = query.weekday !== undefined ? Number(query.weekday) : undefined;
    const date = query.date;
    const time = query.time;
    const ownerId = query.ownerId;
    const where = { deletedAt: null };
    if (ownerId && role === 'OWNER') {
        where.place = { ownerUserId: ownerId };
    }
    else {
        where.place = { status: "PUBLISHED" };
    }
    if (cityId)
        where.place = { ...where.place, cityId };
    if (categoryId)
        where.categoryId = categoryId;
    const events = await prisma_1.prisma.event.findMany({
        where,
        include: { recurrence: true, specialDates: true, category: true, place: { include: { city: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
    });
    const filtered = filterEventsByDate(events, date, weekday, time);
    return { page, pageSize, total: filtered.length, items: filtered };
};
exports.listAgenda = listAgenda;
