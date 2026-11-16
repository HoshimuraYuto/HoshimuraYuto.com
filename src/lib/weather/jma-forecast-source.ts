import {
  DAY_MS,
  JMA_COVER_BY_CODE_CLASS,
  JMA_FOG_CODE,
  JMA_FORECAST_URL,
  JMA_HEAVY_CODES,
  JMA_SNOW_FIRST_CODES,
  JMA_THUNDER_CODES,
} from "./constants";
import type { Precipitation, Weather, WeatherSource } from "./types";

interface Period {
  start: Date;
  code: string;
  text: string;
}

interface ForecastPlace {
  /** Forecast office whose file is fetched, e.g. `130000` for Tokyo. */
  office: string;
  /** Area inside that file, e.g. `130010` for the Tokyo region. */
  area: string;
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null;
}
function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function field(value: unknown, key: string): unknown {
  return isObject(value) ? value[key] : undefined;
}
/** The short-range forecast is the first time series of the first report in the file. */
function readPeriods(
  body: unknown,
  area: string,
): { issued: Date; periods: Period[] } | undefined {
  const report = list(body)[0],
    series = list(field(report, "timeSeries"))[0],
    times = list(field(series, "timeDefines")),
    place = list(field(series, "areas")).find(
      (candidate) => field(field(candidate, "area"), "code") === area,
    ),
    codes = list(field(place, "weatherCodes")),
    texts = list(field(place, "weathers")),
    issued = new Date(text(field(report, "reportDatetime"))),
    periods = times.map((time, index) => ({
      start: new Date(text(time)),
      code: text(codes[index]),
      text: text(texts[index]),
    }));
  return Number.isNaN(issued.getTime()) || periods.length === 0
    ? undefined
    : { issued, periods };
}
/** A period runs to the start of the next one; the last one is a whole day. */
function periodAt(periods: readonly Period[], date: Date): Period | undefined {
  return periods.find((period, index) => {
    const end =
      periods[index + 1]?.start.getTime() ?? period.start.getTime() + DAY_MS;
    return period.start.getTime() <= date.getTime() && date.getTime() < end;
  });
}
function precipitationOf(code: string): Precipitation | undefined {
  const codeClass = code.charAt(0),
    intensity = JMA_HEAVY_CODES.includes(code) ? "heavy" : "moderate";
  if (codeClass === "4" || JMA_SNOW_FIRST_CODES.includes(code)) {
    return { kind: "snow", intensity };
  }
  return codeClass === "3" ? { kind: "rain", intensity } : undefined;
}
/** Only the leading weather of a code is drawn: "fine, later rain" is drawn as fine for the whole period. */
function toWeather(
  period: Period,
  issued: Date,
  origin: { place: string; url: string },
): Weather | undefined {
  const cloudCover = JMA_COVER_BY_CODE_CLASS[period.code.charAt(0)];
  if (!/^\d{3}$/u.test(period.code) || cloudCover === undefined) {
    return undefined;
  }
  return {
    time: issued,
    cloudCover,
    layers: [],
    precipitation: precipitationOf(period.code),
    thunder: JMA_THUNDER_CODES.includes(period.code),
    obscuration: period.code === JMA_FOG_CODE ? "fog" : undefined,
    visibility: undefined,
    wind: undefined,
    origin: {
      kind: "forecast",
      provider: "jma-forecast",
      raw: `${period.code} ${period.text}`.trim(),
      ...origin,
    },
  };
}
/**
 * The Japan Meteorological Agency's forecast for one area. It holds only the latest issue,
 * so it answers for moments from that issue onwards and has nothing for the past.
 */
function jmaForecastSource({ office, area }: ForecastPlace): WeatherSource {
  return {
    weatherAt: async (
      date,
      { fetch, signal },
    ): Promise<Weather | undefined> => {
      const url = `${JMA_FORECAST_URL}/${office}.json`,
        response = await fetch(url, { signal });
      if (!response.ok) {
        return undefined;
      }
      const forecast = readPeriods(await response.json(), area),
        period = forecast && periodAt(forecast.periods, date);
      return forecast && period
        ? toWeather(period, forecast.issued, { place: area, url })
        : undefined;
    },
  };
}

export { jmaForecastSource };
