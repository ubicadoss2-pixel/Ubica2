"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservationsByOwner = exports.createReservation = void 0;
const prisma_1 = require("../../config/prisma");
const createReservation = async (data) => {
    return prisma_1.prisma.reservation.create({
        data: {
            placeId: data.placeId,
            userId: data.userId || null,
            guestName: data.guestName,
            date: data.date,
            time: data.time,
            guests: data.guests,
            reason: data.reason || null,
            observations: data.observations || null,
        }
    });
};
exports.createReservation = createReservation;
const getReservationsByOwner = async (ownerId, filters) => {
    const { startDate, endDate, placeId } = filters || {};
    let dateFilter = undefined;
    if (startDate || endDate) {
        dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate)
            dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    const whereClause = {
        place: {
            ownerUserId: ownerId,
            ...(placeId ? { id: placeId } : {})
        }
    };
    if (dateFilter) {
        whereClause.createdAt = dateFilter;
    }
    return prisma_1.prisma.reservation.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    fullName: true,
                    email: true
                }
            },
            place: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};
exports.getReservationsByOwner = getReservationsByOwner;
