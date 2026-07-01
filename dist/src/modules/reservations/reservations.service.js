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
const getReservationsByOwner = async (ownerId) => {
    return prisma_1.prisma.reservation.findMany({
        where: {
            place: {
                ownerUserId: ownerId
            }
        },
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
