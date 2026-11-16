import {
  GROUND_DRIZZLE_SHARE,
  GROUND_DRY_PER_HOUR,
  GROUND_DRY_PER_HOUR_PER_MPS,
  GROUND_HISTORY_MS,
  GROUND_RAIN_ON_SNOW,
  GROUND_REPORT_HOLD_MS,
  GROUND_SLEET_SNOW_SHARE,
  GROUND_SNOW_MELTS_AT_C,
  GROUND_SNOW_PER_HOUR,
  GROUND_SNOW_SETTLES_AT_C,
  GROUND_THAW_FROM_C,
  GROUND_THAW_PER_HOUR_PER_C,
  GROUND_WET_PER_HOUR,
} from "./constants";
import { metarTemperature, parseMetar } from "./metar";
import type { MetarObservation } from "./metar";
import type { Ground, Precipitation } from "./types";

interface TimedReport {
  time: Date;
  raw: string;
}

/** What one report says about the ground, and for how long it stands. */
interface Spell {
  hours: number;
  observation: MetarObservation;
  /** Air temperature, °C. */
  temperature: number | undefined;
}

const HOUR_MS = 3_600_000;
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
function frozenShare(precipitation: Precipitation): number {
  if (precipitation.kind === "snow") {
    return 1;
  }
  return precipitation.kind === "sleet" ? GROUND_SLEET_SNOW_SHARE : 0;
}
/** Share of what falls that stays on the ground as snow. Without a temperature, snow is taken to settle. */
function settlingShare(
  precipitation: Precipitation,
  temperature: number | undefined,
): number {
  return (
    frozenShare(precipitation) *
    (temperature === undefined
      ? 1
      : clamp(
          (GROUND_SNOW_MELTS_AT_C - temperature) /
            (GROUND_SNOW_MELTS_AT_C - GROUND_SNOW_SETTLES_AT_C),
        ))
  );
}
function thawPerHour(temperature: number | undefined): number {
  return temperature === undefined
    ? 0
    : Math.max(0, temperature - GROUND_THAW_FROM_C) *
        GROUND_THAW_PER_HOUR_PER_C;
}
/** The ground after a spell of falling rain or snow: what settles is snow, the rest is water, and what fell as rain eats into the snow. */
function afterFall(
  ground: Ground,
  spell: Spell,
  precipitation: Precipitation,
): Ground {
  const { hours, temperature } = spell,
    settling = settlingShare(precipitation, temperature),
    water =
      GROUND_WET_PER_HOUR[precipitation.intensity] *
      (precipitation.kind === "drizzle" ? GROUND_DRIZZLE_SHARE : 1) *
      hours;
  return {
    wet: ground.wet + water * (1 - settling),
    /** Flakes that melt as they land wet the ground but take no lying snow with them; only rain does. */
    snow:
      ground.snow +
      GROUND_SNOW_PER_HOUR[precipitation.intensity] * settling * hours -
      GROUND_RAIN_ON_SNOW * water * (1 - frozenShare(precipitation)),
  };
}
function afterSpell(ground: Ground, spell: Spell): Ground {
  const { hours, observation, temperature } = spell,
    thawed = Math.min(ground.snow, thawPerHour(temperature) * hours),
    fallen = observation.precipitation
      ? afterFall(ground, spell, observation.precipitation)
      : {
          ...ground,
          wet:
            ground.wet -
            (GROUND_DRY_PER_HOUR +
              GROUND_DRY_PER_HOUR_PER_MPS * (observation.wind?.speed ?? 0)) *
              hours,
        };
  // Snow that thaws does not vanish: it leaves the ground wet.
  return {
    wet: clamp(Math.max(0, fallen.wet) + thawed),
    snow: clamp(fallen.snow - thawed),
  };
}
/** The readable reports of the hours before the date, oldest first, each with the time it stands for. */
function spellsBefore(reports: readonly TimedReport[], date: Date): Spell[] {
  const end = date.getTime(),
    recent = reports
      .filter(
        ({ time }) =>
          time.getTime() <= end && time.getTime() >= end - GROUND_HISTORY_MS,
      )
      .toSorted((a, b) => a.time.getTime() - b.time.getTime());
  return recent.flatMap((report, index) => {
    const observation = parseMetar(report.raw),
      until = recent[index + 1]?.time.getTime() ?? end,
      hours =
        Math.min(until - report.time.getTime(), GROUND_REPORT_HOLD_MS) /
        HOUR_MS;
    return observation
      ? [{ hours, observation, temperature: metarTemperature(report.raw) }]
      : [];
  });
}
/** An estimate from the reports of the hours before, not a measurement: the same reports and moment always give the same ground. */
function groundAt(reports: readonly TimedReport[], date: Date): Ground {
  let ground: Ground = { wet: 0, snow: 0 };
  for (const spell of spellsBefore(reports, date)) {
    ground = afterSpell(ground, spell);
  }
  return ground;
}

export { groundAt };
export type { TimedReport };
