import { JMA_FIERCE_GUST_MPS, JMA_WIND_TERMS } from "../lib/weather/weather";
import type {
  CloudLayer,
  IceKind,
  Intensity,
  Obscuration,
  Phenomenon,
  Precipitation,
  PrecipitationKind,
  Weather,
  Wind,
} from "../lib/weather/weather";
import { pad } from "../utils/jst";

/** Japanese names as JMA uses them for METAR codes: GR ひょう, GS あられ, PL 凍雨. */
const WORD_BY_ICE: Readonly<Record<IceKind, string>> = {
  hail: "ひょう",
  graupel: "あられ",
  icePellets: "凍雨",
};
const WORD_BY_KIND: Readonly<Record<PrecipitationKind, string>> = {
  drizzle: "霧雨",
  rain: "雨",
  snow: "雪",
  sleet: "みぞれ",
  ...WORD_BY_ICE,
};
/** Dust raised by the wind has no word of its own: it is named by its obscuration (砂じん) and its wind. */
const WORD_BY_PHENOMENON: Readonly<Record<Phenomenon, string>> = {
  squall: "スコール",
  funnel: "竜巻",
  duststorm: "砂じんあらし",
  dustWhirl: "塵旋風",
  blowingDust: "",
};
const WORD_BY_INTENSITY: Readonly<Record<Intensity, string>> = {
  light: "弱い",
  moderate: "",
  heavy: "強い",
};
const WORD_BY_OBSCURATION: Readonly<Record<Obscuration, string>> = {
  fog: "霧",
  mist: "もや",
  haze: "煙霧",
  smoke: "煙",
  ash: "火山灰",
  dust: "砂じん",
};
/** The METAR's own day-and-time group, so the report can be looked up. */
function reportCode(place: string, time: Date): string {
  return `${place} ${pad(time.getUTCDate())}${pad(time.getUTCHours())}${pad(time.getUTCMinutes())}Z`;
}
/** The widest layer's amount in oktas, as the report gives it: a range, because a METAR names a class and not a number. */
function cloudWords(layers: readonly CloudLayer[]): string {
  const widest = layers.toSorted((a, b) => b.cover - a.cover)[0];
  if (!widest) {
    return "";
  }
  const [low, high] = widest.oktas;
  return `雲量${low === high ? low : `${low}–${high}`}/8`;
}
function precipitationWords(
  precipitation: Precipitation | undefined,
): string[] {
  if (!precipitation) {
    return [];
  }
  const { intensity, kind, ice, freezing } = precipitation;
  return [
    `${WORD_BY_INTENSITY[intensity]}${freezing === true ? "着氷性の" : ""}${WORD_BY_KIND[kind]}`,
    ice === undefined ? "" : `${WORD_BY_ICE[ice]}まじり`,
  ];
}
/** JMA's word for the wind's strength, from the mean speed or, for 猛烈な風, a gust; nothing below やや強い風. */
function windWords(wind: Wind | undefined): string {
  if (!wind) {
    return "";
  }
  const fierce = (wind.gust ?? 0) >= JMA_FIERCE_GUST_MPS,
    term =
      JMA_WIND_TERMS.findLast(({ from }) => wind.speed >= from)?.term ?? "";
  return fierce ? (JMA_WIND_TERMS.at(-1)?.term ?? term) : term;
}
function observedWords(weather: Weather): string[] {
  const { obscuration, thunder } = weather;
  return [
    cloudWords(weather.layers),
    thunder ? "雷" : "",
    ...precipitationWords(weather.precipitation),
    obscuration === undefined ? "" : WORD_BY_OBSCURATION[obscuration],
    ...(weather.phenomena ?? []).map(
      (phenomenon) => WORD_BY_PHENOMENON[phenomenon],
    ),
    windWords(weather.wind),
  ];
}
function formatWeather(weather?: Weather): string {
  if (!weather) {
    return "";
  }
  const { origin } = weather,
    words =
      origin.kind === "forecast"
        ? ["気象庁予報", ...origin.raw.split(/\s+/u).slice(1)]
        : [...observedWords(weather), reportCode(origin.place, weather.time)];
  return words.filter((word) => word !== "").join(" ");
}

export { formatWeather };
