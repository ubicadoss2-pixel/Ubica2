import { DateTime } from "luxon";

export const getWeekdayIndex = (dt: DateTime) => {
  // Luxon: Monday=1..Sunday=7 => 0=Sunday..6=Saturday
  return dt.weekday === 7 ? 0 : dt.weekday;
};

const timeToParts = (value: Date | string) => {
  if (value instanceof Date) {
    return [value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds()];
  }
  const [h, m, s] = value.split(":").map((v) => Number(v));
  return [h || 0, m || 0, s || 0];
};

export const isOpenNow = (
  weekday: number,
  openTime: Date | string | null,
  closeTime: Date | string | null,
  isClosed: boolean,
  timezone: string
) => {
  if (isClosed || !openTime || !closeTime) return false;
  const now = DateTime.now().setZone(timezone);
  const today = getWeekdayIndex(now);
  if (today !== weekday) return false;

  const [oh, om, os] = timeToParts(openTime);
  const [ch, cm, cs] = timeToParts(closeTime);

  const open = now.set({ hour: oh, minute: om, second: os || 0 });
  let close = now.set({ hour: ch, minute: cm, second: cs || 0 });

  if (close < open) {
    close = close.plus({ days: 1 });
  }

  return now >= open && now <= close;
};
