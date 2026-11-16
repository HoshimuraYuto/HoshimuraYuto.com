import { equatorialToHorizontal } from "./horizon";
import { precessFromJ2000 } from "./precession";
import catalogue from "./stars.json";
import { centuriesSinceJ2000, localSiderealTime } from "./time";
import type { Observer, VisibleStar } from "./types";

interface CatalogueStar {
  /** J2000.0 right ascension and declination, degrees. */
  ra: number;
  dec: number;
  magnitude: number;
  colorIndex: number;
}

const STARS: readonly CatalogueStar[] = catalogue.stars.map(
  ([ra = 0, dec = 0, magnitude = 0, colorIndex = 0]) => ({
    ra,
    dec,
    magnitude,
    colorIndex,
  }),
);
function starPosition(
  star: CatalogueStar,
  date: Date,
  observer: Observer,
): VisibleStar {
  return {
    ...equatorialToHorizontal(
      precessFromJ2000(star, centuriesSinceJ2000(date)),
      localSiderealTime(date, observer.longitude),
      observer.latitude,
    ),
    magnitude: star.magnitude,
    colorIndex: star.colorIndex,
  };
}
/** Catalogue is sorted brightest first, so the scan stops at the first star past the limit. */
function visibleStars(
  date: Date,
  observer: Observer,
  limitingMagnitude: number,
): VisibleStar[] {
  const lst = localSiderealTime(date, observer.longitude),
    centuries = centuriesSinceJ2000(date),
    visible: VisibleStar[] = [];
  for (const star of STARS) {
    if (star.magnitude > limitingMagnitude) {
      break;
    }
    const place = equatorialToHorizontal(
      precessFromJ2000(star, centuries),
      lst,
      observer.latitude,
    );
    if (place.altitude > 0) {
      visible.push({
        ...place,
        magnitude: star.magnitude,
        colorIndex: star.colorIndex,
      });
    }
  }
  return visible;
}

export { STARS, starPosition, visibleStars };
export type { CatalogueStar };
