import { RAD } from "./constants";
import type { Equatorial } from "./precession";
import { normalizeDegrees } from "./time";
import type { Horizontal } from "./types";

/** Equatorial place to altitude/azimuth, with no refraction. Meeus eq. 13.5 and 13.6, azimuth turned to count from north. */
function equatorialToHorizontal(
  { ra, dec }: Equatorial,
  siderealTime: number,
  latitude: number,
): Horizontal {
  const h = (siderealTime - ra) * RAD,
    d = dec * RAD,
    phi = latitude * RAD,
    altitude = Math.asin(
      Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h),
    ),
    azimuth = Math.atan2(
      -Math.cos(d) * Math.sin(h),
      Math.sin(d) * Math.cos(phi) - Math.cos(d) * Math.sin(phi) * Math.cos(h),
    );
  return {
    altitude: altitude / RAD,
    azimuth: normalizeDegrees(azimuth / RAD),
  };
}
/** Direction from one point of the sky to another along the great circle, degrees clockwise from straight up. */
function bearingOnSky(from: Horizontal, to: Horizontal): number {
  const a1 = from.altitude * RAD,
    a2 = to.altitude * RAD,
    dz = (to.azimuth - from.azimuth) * RAD;
  return normalizeDegrees(
    Math.atan2(
      Math.cos(a2) * Math.sin(dz),
      Math.sin(a2) * Math.cos(a1) - Math.cos(a2) * Math.sin(a1) * Math.cos(dz),
    ) / RAD,
  );
}

export { bearingOnSky, equatorialToHorizontal };
