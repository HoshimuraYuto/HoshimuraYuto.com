import { JMA_FIERCE_GUST_MPS, JMA_WIND_TERMS } from "../lib/weather/weather";
import type {
  CloudLayer,
  Intensity,
  Obscuration,
  Phenomenon,
  Precipitation,
  PrecipitationKind,
  Weather,
  Wind,
} from "../lib/weather/weather";
import { clamp, RAD } from "../utils/math";

/** One cloud layer as it is drawn: a field of noise cut so that `cover` of the sky is cloud. */
interface CloudSheet {
  cover: number;
  /** How fine the layer's texture is: higher layers are further away, so their masses look smaller. */
  scale: number;
  opacity: number;
  seed: number;
  /** How far the wind has carried the layer since the report, in units of the noise. */
  offset: readonly [number, number];
}

interface Fall {
  /** `sand` is dust or sand lifted by the wind: it is seen as fine grains that drift down, and lands without a splash. */
  kind: "rain" | "snow" | "sleet" | "sand";
  /** Share of the densest fall, 0 to 1. */
  density: number;
  /** Sideways travel per unit of fall, positive to the right of the screen. */
  slant: number;
  /** Share of the drops that are hard grains of ice, which bounce where they land. Left out when there are none. */
  ice?: number;
  /** How far the gusts swing the slant beyond the mean wind, 0 to 1. Left out in a steady wind. */
  gust?: number;
}

/** A strong wind. It is never drawn itself: it only bends and shakes what falls through it. */
interface Gale {
  /** 0 at the threshold of a fairly strong wind (10 m/s), 1 at a fierce one (30 m/s). */
  strength: number;
  /** How much the gusts rise above the mean wind, 0 to 1. */
  gust: number;
}

/** The weather turned into amounts the painter uses. Everything is 0 to 1 unless it says otherwise. */
interface WeatherLook {
  sheets: CloudSheet[];
  /** How dark the clouds are from below. */
  gloom: number;
  /** How much the air itself hides: fog, mist, and the grey of falling rain. */
  veil: number;
  fall: Fall | undefined;
  thunder: boolean;
  /** How far the veil is coloured by dust, sand, ash or smoke. Left out when the air is only grey. */
  dust?: number;
  /** Dust or sand the wind has lifted, falling through the same wind as the rain. Left out when there is none. */
  sand?: Fall;
  funnel?: boolean;
}

/** Height assumed for a layer that gives none: the middle of the range a METAR reports. */
const DEFAULT_BASE_FEET = 6500;
const LOW_FEET = 1000;
const HIGH_FEET = 20_000;
/** Seconds of a 1 m/s wind that move a low layer by one unit of noise; picked so that a breeze visibly reshapes the sky in half an hour. */
const DRIFT_SECONDS = 9000;
const VEIL_BY_OBSCURATION: Readonly<Record<Obscuration, number>> = {
  fog: 0.7,
  mist: 0.2,
  haze: 0.2,
  smoke: 0.3,
  /** Falling ash dims the whole sky to a brown grey, more than smoke or dust. */
  ash: 0.55,
  dust: 0.4,
};
/** How far each kind of thick air is tinted by the dust colour; fog and mist are water and stay grey. */
const DUST_BY_OBSCURATION: Readonly<Record<Obscuration, number>> = {
  fog: 0,
  mist: 0,
  haze: 0.3,
  smoke: 0.5,
  ash: 0.6,
  dust: 0.85,
};
/** A dust or sand storm hides most of the view, whatever the visibility says. */
const DUSTSTORM_VEIL = 0.8;
/** Share of the drops that are ice when grains are mixed into rain or snow (SHRAGS, SHSNGS). Chosen for this site. */
const MIXED_ICE_SHARE = 0.35;
/** Wind speeds, m/s, at which a gale starts to show and at which it is drawn at full strength: JMA's やや強い風 and 猛烈な風. */
const GALE_FROM_MPS = JMA_WIND_TERMS[0]?.from ?? 10;
const GALE_FULL_MPS = JMA_WIND_TERMS.at(-1)?.from ?? 30;
/** Gusts this far above the mean wind, m/s, swing the rain as far as it goes. Chosen for this site. */
const GUST_FULL_SPREAD_MPS = 12;
/** Raised dust, a dust storm or a squall is drawn as at least this strong a gale, whatever the reported wind. */
const RAISED_GALE = 0.35;
const SQUALL_GALE = 0.55;
/** How much further sideways the same wind carries a grain of sand than a raindrop: it is light and falls slowly. Chosen for this site. */
const SAND_DRIFT = 3;
/** Share of the densest fall that lifted sand fills: a dust storm, and dust only raised by the wind. Chosen for this site. */
const SAND_DENSITY = { storm: 1, raised: 0.45 } as const;
const VEIL_BY_INTENSITY: Readonly<Record<Intensity, number>> = {
  light: 0.12,
  moderate: 0.25,
  heavy: 0.45,
};
const GLOOM_BY_INTENSITY: Readonly<Record<Intensity, number>> = {
  light: 0.5,
  moderate: 0.7,
  heavy: 0.9,
};
const DENSITY_BY_INTENSITY: Readonly<Record<Intensity, number>> = {
  light: 0.35,
  moderate: 0.65,
  heavy: 1,
};
const FALL_BY_KIND: Readonly<Record<PrecipitationKind, Fall["kind"]>> = {
  drizzle: "rain",
  rain: "rain",
  hail: "rain",
  graupel: "rain",
  icePellets: "rain",
  sleet: "sleet",
  snow: "snow",
};
const ICE_KINDS: ReadonlySet<PrecipitationKind> = new Set([
  "hail",
  "graupel",
  "icePellets",
]);
/** Wind as screen travel: facing south, a wind from the east carries cloud to the right, one from the north away from the viewer. */
function windTravel(wind: Wind | undefined): readonly [number, number] {
  if (!wind || wind.direction === undefined) {
    return [0, 0];
  }
  return [
    Math.sin(wind.direction * RAD) * wind.speed,
    Math.cos(wind.direction * RAD) * wind.speed,
  ];
}
function sheetsFor(weather: Weather, date: Date): CloudSheet[] {
  const layers: readonly Pick<CloudLayer, "cover" | "baseFeet">[] =
      weather.layers.length > 0
        ? weather.layers
        : [{ cover: weather.cloudCover, baseFeet: undefined }],
    seconds = Math.max(0, (date.getTime() - weather.time.getTime()) / 1000),
    [right, away] = windTravel(weather.wind),
    seed = Math.floor(weather.time.getTime() / 60_000);
  return layers
    .filter((layer) => layer.cover > 0)
    .map((layer, index) => {
      const height = Math.sqrt(
          clamp(
            ((layer.baseFeet ?? DEFAULT_BASE_FEET) - LOW_FEET) /
              (HIGH_FEET - LOW_FEET),
            0,
            1,
          ),
        ),
        drift = seconds / DRIFT_SECONDS / (1 + 2 * height);
      return {
        cover: layer.cover,
        scale: 1 + 1.8 * height,
        opacity: 0.95 - 0.4 * height,
        seed: seed + index * 7919,
        /** The pattern moves with the wind, so the noise is read from where the cloud came from. */
        offset: [-right * drift, -away * drift] as const,
      };
    });
}
/** 10 km and more hides nothing; each halving of the visibility hides a fixed step more, down to 200 m. */
function veilByVisibility(visibility: number | undefined): number {
  return visibility === undefined
    ? 0
    : clamp(Math.log(10_000 / Math.max(200, visibility)) / Math.log(50), 0, 1);
}
function reports(weather: Weather, phenomenon: Phenomenon): boolean {
  return weather.phenomena?.includes(phenomenon) ?? false;
}
function veilFor(weather: Weather): number {
  return Math.max(
    veilByVisibility(weather.visibility),
    weather.obscuration === undefined
      ? 0
      : VEIL_BY_OBSCURATION[weather.obscuration],
    weather.precipitation
      ? VEIL_BY_INTENSITY[weather.precipitation.intensity]
      : 0,
    reports(weather, "duststorm") ? DUSTSTORM_VEIL : 0,
  );
}
function dustFor(weather: Weather): number {
  return Math.max(
    weather.obscuration === undefined
      ? 0
      : DUST_BY_OBSCURATION[weather.obscuration],
    reports(weather, "duststorm") ? 1 : 0,
  );
}
function gloomFor(weather: Weather): number {
  if (weather.precipitation) {
    return GLOOM_BY_INTENSITY[weather.precipitation.intensity];
  }
  // A squall is a sudden wind, not a cloud: Haneda's 2024-02-27 squall blew under a nearly clear sky, so it does not darken it.
  if (weather.thunder || reports(weather, "funnel")) {
    return 0.8;
  }
  return weather.cloudCover >= 1 ? 0.45 : 0.3 * weather.cloudCover;
}
/** Mean wind and gusts on the scale from a fairly strong wind to a fierce one; a fierce gust alone makes it fierce. */
function galeStrength(wind: Wind | undefined): number {
  if (!wind) {
    return 0;
  }
  const byMean = (wind.speed - GALE_FROM_MPS) / (GALE_FULL_MPS - GALE_FROM_MPS),
    byGust =
      wind.gust === undefined
        ? 0
        : (wind.gust - GALE_FROM_MPS) / (JMA_FIERCE_GUST_MPS - GALE_FROM_MPS);
  return clamp(Math.max(byMean, byGust), 0, 1);
}
function raisedSand(weather: Weather): boolean {
  return reports(weather, "blowingDust") || reports(weather, "duststorm");
}
function galeFor(weather: Weather): Gale | undefined {
  const strength = Math.max(
      galeStrength(weather.wind),
      raisedSand(weather) ? RAISED_GALE : 0,
      reports(weather, "squall") ? SQUALL_GALE : 0,
    ),
    spread =
      weather.wind?.gust === undefined
        ? 0
        : weather.wind.gust - weather.wind.speed;
  if (strength <= 0) {
    return undefined;
  }
  return {
    strength,
    gust: Math.max(
      clamp(spread / GUST_FULL_SPREAD_MPS, 0, 1),
      reports(weather, "squall") ? 1 : 0,
    ),
  };
}
/** Sideways travel per unit of fall for something the wind carries `drift` times as far as rain: one wind, so everything leans the same way. */
function slantFor(
  wind: Wind | undefined,
  gale: Gale | undefined,
  drift: number,
): number {
  // A gale may lay things over further than a breeze ever does; without one the limit is 0.7.
  const reach = 0.7 + 0.8 * (gale?.strength ?? 0);
  return clamp((windTravel(wind)[0] / 12) * drift, -reach, reach);
}
function sandFor(weather: Weather, gale: Gale | undefined): Fall | undefined {
  if (!raisedSand(weather)) {
    return undefined;
  }
  return {
    kind: "sand",
    density: reports(weather, "duststorm")
      ? SAND_DENSITY.storm
      : SAND_DENSITY.raised,
    slant: slantFor(weather.wind, gale, SAND_DRIFT),
    ...(gale && gale.gust > 0 ? { gust: gale.gust } : {}),
  };
}
function iceShare(precipitation: Precipitation): number {
  if (ICE_KINDS.has(precipitation.kind)) {
    return 1;
  }
  return precipitation.ice === undefined ? 0 : MIXED_ICE_SHARE;
}
function fallFor(
  precipitation: Precipitation | undefined,
  wind: Wind | undefined,
  gale: Gale | undefined,
): Fall | undefined {
  if (!precipitation) {
    return undefined;
  }
  const kind = FALL_BY_KIND[precipitation.kind],
    ice = iceShare(precipitation);
  return {
    kind,
    density:
      DENSITY_BY_INTENSITY[precipitation.intensity] *
      (precipitation.kind === "drizzle" ? 0.6 : 1),
    /** Snow is carried further sideways than rain by the same wind. */
    slant: slantFor(wind, gale, kind === "snow" ? 2.5 : 1),
    ...(ice > 0 ? { ice } : {}),
    ...(gale && gale.gust > 0 ? { gust: gale.gust } : {}),
  };
}
function lookFor(weather: Weather, date: Date): WeatherLook {
  const gale = galeFor(weather),
    dust = dustFor(weather),
    sand = sandFor(weather, gale);
  return {
    sheets: sheetsFor(weather, date),
    gloom: gloomFor(weather),
    veil: veilFor(weather),
    fall: fallFor(weather.precipitation, weather.wind, gale),
    thunder: weather.thunder,
    ...(dust > 0 ? { dust } : {}),
    ...(sand ? { sand } : {}),
    ...(reports(weather, "funnel") ? { funnel: true } : {}),
  };
}

export { lookFor };
export type { CloudSheet, Fall, WeatherLook };
