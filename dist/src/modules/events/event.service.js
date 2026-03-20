"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAgenda = exports.listEventsByPlace = exports.getEventById = exports.updateEvent = exports.createEvent = void 0;
const luxon_1 = require("luxon");
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../shared/utils/pagination");
const toTime = (value) => new Date(`1970-01-01T${value}Z`);
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
    const place = await prisma_1.prisma.place.findUnique({ where: { id: data.placeId } });
    if (!place)
        throw new Error("Lugar no existe");
    if (!isAdmin && place.ownerUserId !== userId)
        throw new Error("No autorizado");
    const startTime = toTime(data.startTime);
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
    const createData = {
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
        specialDates: data.specialDates
            ? {
                create: data.specialDates.map((sd) => ({
                    eventDate: new Date(sd.eventDate),
                    dateType: sd.dateType || "OCCURRENCE",
                    note: sd.note,
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
    const updateData = {
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
    };
    return prisma_1.prisma.event.update({
        where: { id: eventId },
        data: updateData,
    });
};
exports.updateEvent = updateEvent;
const getEventById = (eventId) => {
    return prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        include: {
            place: true,
            category: true,
            recurrence: true,
            specialDates: true,
        },
    });
};
exports.getEventById = getEventById;
const filterEventsByDate = (events, date, weekday) => {
    if (!date && weekday === undefined)
        return events;
    const targetDate = date ? luxon_1.DateTime.fromISO(date) : null;
    const targetWeekday = weekday !== undefined ? weekday : (targetDate ? (targetDate.weekday === 7 ? 0 : targetDate.weekday) : undefined);
    return events.filter((event) => {
        const occurrences = event.specialDates || [];
        if (date) {
            const hasOccurrence = occurrences.some((sd) => sd.dateType === "OCCURRENCE" && luxon_1.DateTime.fromJSDate(sd.eventDate).toISODate() === targetDate.toISODate());
            const hasException = occurrences.some((sd) => sd.dateType === "EXCEPTION" && luxon_1.DateTime.fromJSDate(sd.eventDate).toISODate() === targetDate.toISODate());
            if (hasOccurrence)
                return true;
            if (hasException)
                return false;
            return event.recurrence && event.recurrence.weekday === targetWeekday;
        }
        if (weekday !== undefined) {
            const hasOccurrenceOnWeekday = occurrences.some((sd) => {
                if (sd.dateType !== "OCCURRENCE")
                    return false;
                const wd = luxon_1.DateTime.fromJSDate(sd.eventDate).weekday;
                const wk = wd === 7 ? 0 : wd;
                return wk === weekday;
            });
            if (hasOccurrenceOnWeekday)
                return true;
            return event.recurrence && event.recurrence.weekday === weekday;
        }
        return false;
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
const listAgenda = async (query) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { skip, take } = (0, pagination_1.getPagination)(page, pageSize);
    const cityId = query.cityId;
    const weekday = query.weekday !== undefined ? Number(query.weekday) : undefined;
    const date = query.date;
    const where = { deletedAt: null, place: { status: "PUBLISHED" } };
    if (cityId)
        where.place = { ...where.place, cityId };
    const events = await prisma_1.prisma.event.findMany({
        where,
        include: { recurrence: true, specialDates: true, category: true, place: { include: { city: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
    });
    const filtered = filterEventsByDate(events, date, weekday);
    return { page, pageSize, total: filtered.length, items: filtered };
};
exports.listAgenda = listAgenda;
