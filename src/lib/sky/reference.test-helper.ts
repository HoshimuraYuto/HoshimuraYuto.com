import {
  Body,
  DefineStar,
  Equator,
  Horizon,
  Observer as AstroObserver,
} from "astronomy-engine";

import { RAD } from "./constants";
import type { Horizontal, Observer } from "./types";

// Far enough that astronomy-engine's parallax correction for the star is nil.
const STAR_DISTANCE_LY = 1000;
function toAstro({ latitude, longitude }: Observer): AstroObserver {
  return new AstroObserver(latitude, longitude, 0);
}
/** Angle between two directions in the sky, degrees. Unlike an azimuth difference, it stays meaningful near the zenith. */
function separation(a: Horizontal, b: Horizontal): number {
  const cos =
    Math.sin(a.altitude * RAD) * Math.sin(b.altitude * RAD) +
    Math.cos(a.altitude * RAD) *
      Math.cos(b.altitude * RAD) *
      Math.cos((a.azimuth - b.azimuth) * RAD);
  return Math.acos(Math.max(-1, Math.min(1, cos))) / RAD;
}
function referenceStar(
  star: { ra: number; dec: number },
  date: Date,
  observer: Observer,
): Horizontal {
  DefineStar(Body.Star1, star.ra / 15, star.dec, STAR_DISTANCE_LY);
  const eq = Equator(Body.Star1, date, toAstro(observer), true, true),
    hor = Horizon(date, toAstro(observer), eq.ra, eq.dec);
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}
export { referenceStar, separation };
