"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOpenNow = exports.getWeekdayIndex = void 0;
const luxon_1 = require("luxon");
const getWeekdayIndex = (dt) => {
    // Luxon: Monday=1..Sunday=7 => 0=Sunday..6=Saturday
    return dt.weekday === 7 ? 0 : dt.weekday;
};
exports.getWeekdayIndex = getWeekdayIndex;
const timeToParts = (value) => {
    if (value instanceof Date) {
        return [value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds()];
    }
    const [h, m, s] = value.split(":").map((v) => Number(v));
    return [h || 0, m || 0, s || 0];
};
const isOpenNow = (weekday, openTime, closeTime, isClosed, timezone) => {
    if (isClosed || !openTime || !closeTime)
        return false;
    const now = luxon_1.DateTime.now().setZone(timezone);
    const today = (0, exports.getWeekdayIndex)(now);
    if (today !== weekday)
        return false;
    const [oh, om, os] = timeToParts(openTime);
    const [ch, cm, cs] = timeToParts(closeTime);
    const open = now.set({ hour: oh, minute: om, second: os || 0 });
    let close = now.set({ hour: ch, minute: cm, second: cs || 0 });
    if (close < open) {
        close = close.plus({ days: 1 });
    }
    return now >= open && now <= close;
};
exports.isOpenNow = isOpenNow;
