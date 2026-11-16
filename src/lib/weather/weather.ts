import { WEATHER_TIMEOUT_MS } from "./constants";
import type { Weather, WeatherContext, WeatherSource } from "./types";

interface WeatherOptions {
  fetch?: typeof fetch;
  now?: Date;
  timeoutMs?: number;
}

async function askSource(
  source: WeatherSource,
  date: Date,
  context: WeatherContext,
): Promise<Weather | undefined> {
  try {
    return await source.weatherAt(date, context);
  } catch {
    // A source that fails counts as one that has nothing, so the next one is asked.
    return undefined;
  }
}
/** Sources are asked one after another: a later one is only a fallback for an earlier one. */
async function firstAnswer(
  date: Date,
  sources: readonly WeatherSource[],
  context: WeatherContext,
): Promise<Weather | undefined> {
  const [source, ...rest] = sources;
  if (!source || context.signal.aborted) {
    return undefined;
  }
  return (
    (await askSource(source, date, context)) ?? firstAnswer(date, rest, context)
  );
}
/**
 * The weather at a moment, from the first source that has it. Never rejects: a failed request,
 * a response in an unknown form and a timeout all give `undefined`, so the caller can draw without weather.
 */
async function weatherAt(
  date: Date,
  sources: readonly WeatherSource[],
  options: WeatherOptions = {},
): Promise<Weather | undefined> {
  const controller = new AbortController(),
    context: WeatherContext = {
      fetch: options.fetch ?? ((input, init) => globalThis.fetch(input, init)),
      signal: controller.signal,
      now: options.now ?? new Date(),
    };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve();
    }, options.timeoutMs ?? WEATHER_TIMEOUT_MS);
  });
  try {
    return (
      (await Promise.race([firstAnswer(date, sources, context), timeout])) ??
      undefined
    );
  } finally {
    clearTimeout(timer);
  }
}

export { weatherAt };
export { JMA_FIERCE_GUST_MPS, JMA_WIND_TERMS } from "./constants";
export { iemMetarSource } from "./iem-metar-source";
export { jmaForecastSource } from "./jma-forecast-source";
export { parseMetar } from "./metar";
export type { WeatherOptions };
export type {
  CloudAmount,
  CloudLayer,
  Ground,
  IceKind,
  Intensity,
  Obscuration,
  Phenomenon,
  Precipitation,
  PrecipitationKind,
  Weather,
  WeatherContext,
  WeatherOrigin,
  WeatherSource,
  Wind,
} from "./types";
