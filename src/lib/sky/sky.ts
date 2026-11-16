import { interpolate } from "../../utils/interpolate";
import {
  DAY_MS,
  LIMITING_MAGNITUDE_BY_SUN_ALTITUDE,
  NEW_MOON_SEARCH_STEPS,
  SYNODIC_MONTH_DAYS,
} from "./constants";
import { bearingOnSky } from "./horizon";
import { visibleStars } from "./stars";
import { suncalcSource } from "./suncalc-source";
import type { MoonState, Observer, Sky, SunMoonSource } from "./types";

function limitingMagnitude(sunAltitude: number): number {
  return interpolate(LIMITING_MAGNITUDE_BY_SUN_ALTITUDE, sunAltitude);
}
/** Days since the previous new moon, searched on the source's phase rather than assuming a mean month. */
function moonAge(date: Date, source: SunMoonSource): number {
  let newMoon =
    date.getTime() - source.moonPhase(date).phase * SYNODIC_MONTH_DAYS * DAY_MS;
  for (let step = 0; step < NEW_MOON_SEARCH_STEPS; step += 1) {
    const phase = source.moonPhase(new Date(newMoon)).phase,
      offset = phase > 0.5 ? phase - 1 : phase;
    newMoon -= offset * SYNODIC_MONTH_DAYS * DAY_MS;
  }
  return (date.getTime() - newMoon) / DAY_MS;
}
function moonState(
  date: Date,
  observer: Observer,
  source: SunMoonSource,
): MoonState {
  const place = source.moon(date, observer),
    { fraction, phase } = source.moonPhase(date);
  return {
    ...place,
    illuminatedFraction: fraction,
    /** The lit limb faces the sun, so its direction is the great circle from the moon towards the sun. */
    brightLimbAngle: bearingOnSky(place, source.sun(date, observer)),
    waxing: phase < 0.5,
    age: moonAge(date, source),
  };
}
function skyAt(
  date: Date,
  observer: Observer,
  source: SunMoonSource = suncalcSource,
): Sky {
  const sun = source.sun(date, observer),
    limit = limitingMagnitude(sun.altitude);
  return {
    date,
    observer,
    sun,
    moon: moonState(date, observer, source),
    limitingMagnitude: limit,
    stars: visibleStars(date, observer, limit),
  };
}

export { limitingMagnitude, skyAt };
export type { Horizontal, Observer, Sky, SunMoonSource } from "./types";
