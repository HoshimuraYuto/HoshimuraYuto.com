import {
  ARCSEC_PER_DEGREE,
  PRECESSION_THETA,
  PRECESSION_Z,
  PRECESSION_ZETA,
  RAD,
} from "./constants";
import { normalizeDegrees } from "./time";

interface Equatorial {
  /** Right ascension, degrees. */
  ra: number;
  /** Declination, degrees. */
  dec: number;
}

function polynomialDegrees(
  [a, b, c]: readonly [number, number, number],
  t: number,
): number {
  return (a * t + b * t * t + c * t * t * t) / ARCSEC_PER_DEGREE;
}
/** Mean place of J2000.0 moved to the equinox of the date. Meeus eq. 21.3 and 21.4 (rigorous method). */
function precessFromJ2000(
  { ra, dec }: Equatorial,
  centuries: number,
): Equatorial {
  const zeta = polynomialDegrees(PRECESSION_ZETA, centuries) * RAD,
    z = polynomialDegrees(PRECESSION_Z, centuries),
    theta = polynomialDegrees(PRECESSION_THETA, centuries) * RAD,
    a0 = ra * RAD + zeta,
    d0 = dec * RAD,
    a = Math.cos(d0) * Math.sin(a0),
    b =
      Math.cos(theta) * Math.cos(d0) * Math.cos(a0) -
      Math.sin(theta) * Math.sin(d0),
    c =
      Math.sin(theta) * Math.cos(d0) * Math.cos(a0) +
      Math.cos(theta) * Math.sin(d0);
  return {
    ra: normalizeDegrees(Math.atan2(a, b) / RAD + z),
    dec: Math.asin(Math.max(-1, Math.min(1, c))) / RAD,
  };
}

export { precessFromJ2000 };
export type { Equatorial };
