import {
  DAY_MS,
  GROUND_HISTORY_MS,
  IEM_ASOS_URL,
  OBSERVATION_MAX_AGE_MS,
} from "./constants";
import { groundAt } from "./ground";
import type { TimedReport as Report } from "./ground";
import { parseMetar } from "./metar";
import type { Weather, WeatherSource } from "./types";

const ROW = /^([A-Z\d]{4}),(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}),(.+)$/u;
function dayParams(date: Date, index: 1 | 2): [string, string][] {
  return [
    [`year${index}`, String(date.getUTCFullYear())],
    [`month${index}`, String(date.getUTCMonth() + 1)],
    [`day${index}`, String(date.getUTCDate())],
  ];
}
/** The request covers whole UTC days: from the day the oldest report read (for the ground) falls on to the end of the date's own day. */
function requestUrl(station: string, date: Date): string {
  const params = new URLSearchParams([
    ["station", station],
    ["data", "metar"],
    ...dayParams(
      new Date(
        date.getTime() - Math.max(OBSERVATION_MAX_AGE_MS, GROUND_HISTORY_MS),
      ),
      1,
    ),
    ...dayParams(new Date(date.getTime() + DAY_MS), 2),
    ["tz", "UTC"],
    ["format", "onlycomma"],
  ]);
  return `${IEM_ASOS_URL}?${params.toString()}`;
}
function readRow(line: string, station: string): Report | undefined {
  const match = ROW.exec(line.trim());
  if (!match || match[1] !== station) {
    return undefined;
  }
  const [, , year, month, day, hour, minute, raw = ""] = match,
    time = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
  return Number.isNaN(time.getTime()) ? undefined : { time, raw };
}
function readRows(csv: string, station: string): Report[] {
  return csv.split("\n").flatMap((line) => readRow(line, station) ?? []);
}
/** Reports no later than the date and no older than the limit, newest first. */
function usableReports(reports: readonly Report[], date: Date): Report[] {
  return reports
    .filter(
      ({ time }) =>
        time.getTime() <= date.getTime() &&
        time.getTime() >= date.getTime() - OBSERVATION_MAX_AGE_MS,
    )
    .toSorted((a, b) => b.time.getTime() - a.time.getTime());
}
function toWeather(
  report: Report,
  station: string,
  url: string,
): Weather | undefined {
  const observation = parseMetar(report.raw);
  return (
    observation && {
      ...observation,
      time: report.time,
      origin: {
        kind: "observation",
        provider: "iem-metar",
        place: station,
        raw: report.raw,
        url,
      },
    }
  );
}
/**
 * METAR reports of one aerodrome from the Iowa Environmental Mesonet archive, which holds both
 * the past and the last hour. The weather at a moment is the newest report made no later than it.
 */
function iemMetarSource({ station }: { station: string }): WeatherSource {
  return {
    weatherAt: async (
      date,
      { fetch, signal, now },
    ): Promise<Weather | undefined> => {
      if (date.getTime() > now.getTime()) {
        return undefined;
      }
      const url = requestUrl(station, date),
        response = await fetch(url, { signal });
      if (!response.ok) {
        return undefined;
      }
      const reports = readRows(await response.text(), station);
      for (const report of usableReports(reports, date)) {
        const weather = toWeather(report, station, url);
        // The same response holds the hours before the report, which is all the ground needs.
        if (weather) {
          return { ...weather, ground: groundAt(reports, date) };
        }
      }
      return undefined;
    },
  };
}

export { iemMetarSource };
