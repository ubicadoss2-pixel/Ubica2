"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = void 0;
const getPagination = (page = 1, pageSize = 10) => {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (safePage - 1) * safeSize;
    return { skip, take: safeSize, page: safePage, pageSize: safeSize };
};
exports.getPagination = getPagination;
