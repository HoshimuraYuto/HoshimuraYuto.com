// Angles are in degrees unless the name says otherwise.

export const RAD = Math.PI / 180;

export const DAY_MS = 86_400_000;

/** Julian Day of the Unix epoch, 1970-01-01T00:00:00Z. Meeus, Astronomical Algorithms 2nd ed., ch. 7. */
export const JD_UNIX_EPOCH = 2_440_587.5;

/** Julian Day of the standard epoch J2000.0, 2000-01-01T12:00:00 TT. Meeus, ch. 21 and 22. */
export const JD_J2000 = 2_451_545;

/** Days in a Julian century, the unit of T in Meeus' polynomials. Meeus, eq. 12.1 and 22.1. */
export const DAYS_PER_CENTURY = 36_525;

export const ARCSEC_PER_DEGREE = 3600;

/**
 * Greenwich mean sidereal time, degrees: θ0 = GMST_AT_J2000 + GMST_DEGREES_PER_DAY·(JD − 2451545) + GMST_T2·T² − T³ / GMST_T3_DIVISOR.
 * Meeus, eq. 12.4.
 */
export const GMST_AT_J2000 = 280.46061837;
export const GMST_DEGREES_PER_DAY = 360.98564736629;
export const GMST_T2 = 0.000387933;
export const GMST_T3_DIVISOR = 38_710_000;

/**
 * Precession from J2000.0 to the date, arcseconds, as polynomials in T (Julian centuries from J2000.0).
 * Meeus, eq. 21.3, with the starting epoch at J2000.0 so that the terms in T of the epoch vanish.
 * Each tuple is [T, T², T³].
 */
export const PRECESSION_ZETA: readonly [number, number, number] = [
  2306.2181, 0.30188, 0.017998,
];
export const PRECESSION_Z: readonly [number, number, number] = [
  2306.2181, 1.09468, 0.018203,
];
export const PRECESSION_THETA: readonly [number, number, number] = [
  2004.3109, -0.42665, -0.041833,
];

/** Mean synodic month, days. Meeus, eq. 49.1 (coefficient of k). */
export const SYNODIC_MONTH_DAYS = 29.530588861;

/**
 * Steps when searching the previous new moon. The phase runs at an uneven speed (up to about ±0.5 day
 * against the mean month), and each step cuts that error roughly tenfold, so four steps reach seconds.
 */
export const NEW_MOON_SEARCH_STEPS = 4;

/** [sun altitude, faintest magnitude], interpolated. Not a physical model: the brightest stars show from −6°, the whole catalogue from −18°. */
export const LIMITING_MAGNITUDE_BY_SUN_ALTITUDE: readonly (readonly [
  number,
  number,
])[] = [
  [-18, 5],
  [-12, 3.6],
  [-6, 1.2],
  [-3, -2],
];
