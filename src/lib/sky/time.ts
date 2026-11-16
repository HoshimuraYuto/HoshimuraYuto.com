import {
  DAY_MS,
  DAYS_PER_CENTURY,
  GMST_AT_J2000,
  GMST_DEGREES_PER_DAY,
  GMST_T2,
  GMST_T3_DIVISOR,
  JD_J2000,
  JD_UNIX_EPOCH,
} from "./constants";

function daysSinceJ2000(date: Date): number {
  return date.getTime() / DAY_MS + JD_UNIX_EPOCH - JD_J2000;
}
/** Julian centuries since J2000.0. UT is used for TT; the 69 s between them is far below this module's error. */
function centuriesSinceJ2000(date: Date): number {
  return daysSinceJ2000(date) / DAYS_PER_CENTURY;
}
function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
/** Local mean sidereal time, degrees. Meeus eq. 12.4 plus the east longitude. */
function localSiderealTime(date: Date, longitude: number): number {
  const t = centuriesSinceJ2000(date),
    gmst =
      GMST_AT_J2000 +
      GMST_DEGREES_PER_DAY * daysSinceJ2000(date) +
      GMST_T2 * t * t -
      (t * t * t) / GMST_T3_DIVISOR;
  return normalizeDegrees(gmst + longitude);
}

export { centuriesSinceJ2000, localSiderealTime, normalizeDegrees };
