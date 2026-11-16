import {
  CLOUD_AMOUNT_BY_CODE,
  CLOUD_AMOUNT_OKTAS,
  CLOUD_HEIGHT_UNIT_FEET,
  KNOT_MPS,
  METAR_END_OF_OBSERVATION,
  OKTAS,
  VISIBILITY_AT_LEAST_CAP,
  VISIBILITY_CAP_METRES,
} from "./constants";
import type {
  CloudAmount,
  CloudLayer,
  IceKind,
  Intensity,
  Obscuration,
  Phenomenon,
  Precipitation,
  PrecipitationKind,
  Wind,
} from "./types";

/** The observed part of a METAR. The time is left to the caller, because the report itself carries no month. */
interface MetarObservation {
  cloudCover: number;
  layers: CloudLayer[];
  precipitation: Precipitation | undefined;
  thunder: boolean;
  obscuration: Obscuration | undefined;
  visibility: number | undefined;
  wind: Wind | undefined;
  phenomena?: Phenomenon[];
}

interface WeatherGroup {
  precipitation: Precipitation | undefined;
  thunder: boolean;
  obscuration: Obscuration | undefined;
  phenomena: Phenomenon[];
}

const WIND = /^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/u;
const VISIBILITY = /^\d{4}$/u;
const CLOUD = /^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU)?/u;
const VERTICAL_VISIBILITY = /^VV(\d{3}|\/\/\/)$/u;
/** Air temperature and dew point in whole °C, `M` for below zero (WMO-No. 306, FM 15, group T′T′/T′dT′d). */
const TEMPERATURE = /^(M?)(\d{2})\/(?:M?\d{2}|\/\/)?$/u;
/** No cloud to report: CAVOK, no significant cloud, none detected, and the older sky clear forms. */
const NO_CLOUD = new Set(["CAVOK", "NSC", "NCD", "SKC", "CLR"]);
/** WMO code table 4678: intensity or proximity, descriptor, precipitation, obscuration, other. */
const PRESENT_WEATHER =
  /^([-+]|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*)(BR|FG|FU|VA|DU|SA|HZ)?(PO|SQ|FC|SS|DS)?$/u;
const LIQUID = new Set(["DZ", "RA", "UP"]);
const SNOWY = new Set(["SN", "SG"]);
const ICE_BY_CODE: Readonly<Record<string, IceKind>> = {
  GR: "hail",
  GS: "graupel",
  PL: "icePellets",
};
const KIND_BY_CODE: Readonly<Record<string, PrecipitationKind>> = {
  DZ: "drizzle",
  RA: "rain",
  UP: "rain",
  SN: "snow",
  SG: "snow",
  ...ICE_BY_CODE,
};
const INTENSITY_BY_SIGN: Readonly<Record<string, Intensity>> = {
  "-": "light",
  "+": "heavy",
};
const OBSCURATION_BY_CODE: Readonly<Record<string, Obscuration>> = {
  BR: "mist",
  FG: "fog",
  FU: "smoke",
  VA: "ash",
  DU: "dust",
  SA: "dust",
  HZ: "haze",
};
const PHENOMENON_BY_CODE: Readonly<Record<string, Phenomenon>> = {
  SQ: "squall",
  FC: "funnel",
  DS: "duststorm",
  SS: "duststorm",
  PO: "dustWhirl",
};
/** Fog that does not cover the aerodrome (shallow, patches, partial) is drawn as mist. */
const PARTIAL_FOG = new Set(["MI", "BC", "PR"]);
/** Blowing (BL) and drifting (DR) lift dust or sand off the ground: dust carried by the wind. */
const RAISED_BY_WIND = new Set(["BL", "DR"]);
function coverOf(amount: CloudAmount): number {
  const [low, high] = CLOUD_AMOUNT_OKTAS[amount];
  return (low + high) / 2 / OKTAS;
}
function baseFeet(hundreds: string): number | undefined {
  return /^\d+$/u.test(hundreds)
    ? Number(hundreds) * CLOUD_HEIGHT_UNIT_FEET
    : undefined;
}
function readWind(token: string): Wind | undefined {
  const match = WIND.exec(token);
  if (!match) {
    return undefined;
  }
  const [, direction = "", speed = "0", gust, unit = "KT"] = match,
    scale = unit === "KT" ? KNOT_MPS : 1;
  return {
    direction: direction === "VRB" ? undefined : Number(direction),
    speed: Number(speed) * scale,
    ...(gust === undefined ? {} : { gust: Number(gust) * scale }),
  };
}
function readCloud(token: string): CloudLayer | undefined {
  const vertical = VERTICAL_VISIBILITY.exec(token);
  // A sky hidden by fog or snow is reported as vertical visibility; from the ground that is a whole grey sky.
  if (vertical) {
    return {
      amount: "overcast",
      oktas: CLOUD_AMOUNT_OKTAS.overcast,
      cover: 1,
      baseFeet: baseFeet(vertical[1] ?? ""),
      convective: false,
    };
  }
  const match = CLOUD.exec(token),
    amount = CLOUD_AMOUNT_BY_CODE[match?.[1] ?? ""];
  if (!match || amount === undefined) {
    return undefined;
  }
  return {
    amount,
    oktas: CLOUD_AMOUNT_OKTAS[amount],
    cover: coverOf(amount),
    baseFeet: baseFeet(match[2] ?? ""),
    convective: match[3] !== undefined,
  };
}
/** The first type named is the dominant one; rain and snow together are sleet. */
function precipitationKind(
  codes: readonly string[],
): PrecipitationKind | undefined {
  const liquid = codes.some((code) => LIQUID.has(code)),
    snowy = codes.some((code) => SNOWY.has(code));
  if (liquid && snowy) {
    return "sleet";
  }
  return KIND_BY_CODE[codes[0] ?? ""] ?? undefined;
}
function readPrecipitation(
  types: string,
  sign: string | undefined,
  descriptor: string | undefined,
): Precipitation | undefined {
  const codes = types.match(/../gu) ?? [],
    kind = precipitationKind(codes);
  if (kind === undefined) {
    return undefined;
  }
  const ice = codes
    .map((code) => ICE_BY_CODE[code])
    .find((found) => found !== undefined);
  return {
    kind,
    intensity: INTENSITY_BY_SIGN[sign ?? ""] ?? "moderate",
    ...(ice !== undefined && ice !== kind ? { ice } : {}),
    ...(descriptor === "FZ" ? { freezing: true } : {}),
  };
}
function readObscuration(
  code: string | undefined,
  descriptor: string | undefined,
): Obscuration | undefined {
  const obscuration = OBSCURATION_BY_CODE[code ?? ""];
  return obscuration === "fog" && PARTIAL_FOG.has(descriptor ?? "")
    ? "mist"
    : obscuration;
}
function readPhenomena(
  obscuration: Obscuration | undefined,
  descriptor: string | undefined,
  other: string | undefined,
): Phenomenon[] {
  const named = PHENOMENON_BY_CODE[other ?? ""],
    raised = obscuration === "dust" && RAISED_BY_WIND.has(descriptor ?? "");
  return [
    ...(named === undefined ? [] : [named]),
    ...(raised ? (["blowingDust"] as const) : []),
  ];
}
const NOTHING: WeatherGroup = {
  precipitation: undefined,
  thunder: false,
  obscuration: undefined,
  phenomena: [],
};
function readWeather(token: string): WeatherGroup | undefined {
  const match = token === "" ? undefined : PRESENT_WEATHER.exec(token);
  if (!match) {
    return undefined;
  }
  const [, sign, descriptor, types = "", code, other] = match,
    obscuration = readObscuration(code, descriptor);
  // "In the vicinity" is weather that is not at the aerodrome, so nothing of it is drawn.
  if (sign === "VC") {
    return NOTHING;
  }
  return {
    precipitation: readPrecipitation(types, sign, descriptor),
    thunder: descriptor === "TS",
    obscuration,
    phenomena: readPhenomena(obscuration, descriptor, other),
  };
}
function observedTokens(raw: string): string[] {
  const tokens = raw.trim().split(/\s+/u),
    end = tokens.findIndex((token) => METAR_END_OF_OBSERVATION.includes(token));
  return end === -1 ? tokens : tokens.slice(0, end);
}
function readVisibility(tokens: readonly string[]): number | undefined {
  if (tokens.includes("CAVOK")) {
    return VISIBILITY_CAP_METRES;
  }
  const token = tokens.find((candidate) => VISIBILITY.test(candidate));
  if (token === undefined) {
    return undefined;
  }
  return token === VISIBILITY_AT_LEAST_CAP
    ? VISIBILITY_CAP_METRES
    : Number(token);
}
function mergeWeather(
  groups: readonly WeatherGroup[],
): Omit<MetarObservation, "cloudCover" | "layers" | "visibility" | "wind"> {
  const phenomena = [...new Set(groups.flatMap((group) => group.phenomena))];
  return {
    precipitation: groups.find((group) => group.precipitation !== undefined)
      ?.precipitation,
    thunder: groups.some((group) => group.thunder),
    obscuration: groups.find((group) => group.obscuration !== undefined)
      ?.obscuration,
    ...(phenomena.length > 0 ? { phenomena } : {}),
  };
}
function metarTemperature(raw: string): number | undefined {
  for (const token of observedTokens(raw)) {
    const match = TEMPERATURE.exec(token);
    if (match) {
      const degrees = Number(match[2]);
      // `M00` is a temperature between −0.5 and 0 °C; it is read as 0, not −0.
      return match[1] === "M" && degrees !== 0 ? -degrees : degrees;
    }
  }
  return undefined;
}
/**
 * Reads the observed part of a METAR or SPECI. Returns `undefined` when the text has neither a cloud group
 * nor a visibility, which is what a report in a changed or unknown form looks like.
 */
function parseMetar(raw: string): MetarObservation | undefined {
  const tokens = observedTokens(raw),
    layers = tokens.flatMap((token) => readCloud(token) ?? []),
    visibility = readVisibility(tokens),
    skyReported =
      layers.length > 0 || tokens.some((token) => NO_CLOUD.has(token));
  if (!skyReported && visibility === undefined) {
    return undefined;
  }
  return {
    /** Each layer's amount is judged as if it were alone, so the widest layer is the least the sky is covered. */
    cloudCover: Math.max(0, ...layers.map((layer) => layer.cover)),
    layers,
    ...mergeWeather(tokens.flatMap((token) => readWeather(token) ?? [])),
    visibility,
    wind: tokens
      .map((token) => readWind(token))
      .find((wind) => wind !== undefined),
  };
}

export { metarTemperature, parseMetar };
export type { MetarObservation };
