import type { CloudAmount } from "./types";

export const OKTAS = 8;

/**
 * Okta range of each METAR cloud amount: few 1–2, scattered 3–4, broken 5–7, overcast 8.
 * WMO-No. 306, Manual on Codes, Volume I.1, FM 15 METAR, regulation 15.9.1.1.
 */
export const CLOUD_AMOUNT_OKTAS: Readonly<
  Record<CloudAmount, readonly [number, number]>
> = {
  few: [1, 2],
  scattered: [3, 4],
  broken: [5, 7],
  overcast: [8, 8],
};

/** METAR abbreviations of the cloud amounts. WMO-No. 306, FM 15, regulation 15.9.1.1. */
export const CLOUD_AMOUNT_BY_CODE: Readonly<Record<string, CloudAmount>> = {
  FEW: "few",
  SCT: "scattered",
  BKN: "broken",
  OVC: "overcast",
};

/** A METAR cloud base is written in hundreds of feet (BKN045 = 4500 ft). WMO-No. 306, FM 15, regulation 15.9 (group NsNsNshshshs). */
export const CLOUD_HEIGHT_UNIT_FEET = 100;

/** Visibility of 10 km or more is written 9999, and CAVOK implies it. WMO-No. 306, FM 15, regulations 15.6 and 15.10. */
export const VISIBILITY_CAP_METRES = 10_000;
export const VISIBILITY_AT_LEAST_CAP = "9999";

/** One knot in metres per second: 1852 m (international nautical mile) / 3600 s. */
export const KNOT_MPS = 1852 / 3600;

/**
 * Groups that end the observed part of a METAR. What follows is the trend forecast or national remarks,
 * not the weather at the time of the report. WMO-No. 306, FM 15, regulations 15.14 (trend) and 15.15 (RMK).
 */
export const METAR_END_OF_OBSERVATION: readonly string[] = [
  "NOSIG",
  "BECMG",
  "TEMPO",
  "RMK",
];

/**
 * How long a report stands for the weather after it. Routine reports at RJTT come every 30 minutes;
 * two hours bridges a few missing reports without showing weather that has clearly passed. Chosen for this site.
 */
export const OBSERVATION_MAX_AGE_MS = 2 * 3_600_000;

/**
 * How far back the reports are read to tell what lies on the ground. Chosen for this site: long enough for
 * wet ground to dry (see GROUND_DRY_PER_HOUR), and short enough that the request stays within two or three days.
 */
export const GROUND_HISTORY_MS = 6 * 3_600_000;

/** Longest a report stands for the time after it when the next one is missing, for the ground. Chosen for this site. */
export const GROUND_REPORT_HOLD_MS = 3_600_000;

/**
 * Share of fully wet ground that one hour of rain adds, by intensity. Not measured values: a METAR gives a class,
 * not an amount. Chosen for this site so that light rain soaks the ground in a little over an hour and heavy rain in minutes.
 */
export const GROUND_WET_PER_HOUR = {
  light: 0.8,
  moderate: 2,
  heavy: 5,
} as const;

/** Drizzle wets the ground at this share of the rate of rain of the same intensity. Chosen for this site. */
export const GROUND_DRIZZLE_SHARE = 0.5;

/**
 * Share of fully wet ground that dries in an hour without rain, in still air, and the extra for each m/s of wind.
 * Chosen for this site: soaked ground is dry after five hours of calm, sooner in a breeze.
 */
export const GROUND_DRY_PER_HOUR = 0.2;
export const GROUND_DRY_PER_HOUR_PER_MPS = 0.02;

/** Share of full snow cover that one hour of snow adds when all of it settles, by intensity. Chosen for this site. */
export const GROUND_SNOW_PER_HOUR = {
  light: 0.25,
  moderate: 0.7,
  heavy: 1.5,
} as const;

/** Share of sleet that is snow. Chosen for this site. */
export const GROUND_SLEET_SNOW_SHARE = 0.5;

/**
 * Air temperatures, °C, at and below which all falling snow settles, and at and above which none does;
 * between them a share settles. Chosen for this site: around freezing snow lies, a few degrees above it melts as it lands.
 */
export const GROUND_SNOW_SETTLES_AT_C = 1;
export const GROUND_SNOW_MELTS_AT_C = 4;

/** Share of full snow cover that melts in an hour for each °C of air temperature above 2 °C. Chosen for this site. */
export const GROUND_THAW_FROM_C = 2;
export const GROUND_THAW_PER_HOUR_PER_C = 0.08;

/** Share of the water falling as rain that lying snow loses to it. Chosen for this site. */
export const GROUND_RAIN_ON_SNOW = 0.2;

/** Longest wait for all sources together. Chosen for this site: past this the sky stays as it is. */
export const WEATHER_TIMEOUT_MS = 8000;

export const DAY_MS = 86_400_000;

/** Iowa Environmental Mesonet ASOS/METAR download. https://mesonet.agron.iastate.edu/request/download.phtml */
export const IEM_ASOS_URL =
  "https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py";

/** Japan Meteorological Agency forecast JSON, one file per forecast office. No published specification. */
export const JMA_FORECAST_URL =
  "https://www.jma.go.jp/bosai/forecast/data/forecast";

/** Cloud cover assumed for a forecast by the hundreds digit of the JMA code (1 fine, 2 cloudy, 3 rain, 4 snow; TELOPS table). JMA gives no amount, so these are rough values chosen for this site. */
export const JMA_COVER_BY_CODE_CLASS: Readonly<Record<string, number>> = {
  "1": 0.2,
  "2": 0.85,
  "3": 1,
  "4": 1,
};

/** JMA weather code for fog, the one code in the 200s whose name is not "cloudy". TELOPS table, as above. */
export const JMA_FOG_CODE = "209";

/** JMA codes in the 300s whose name starts with snow ("snow or rain"), so they are drawn as snow. TELOPS table, as above. */
export const JMA_SNOW_FIRST_CODES: readonly string[] = ["340", "361", "371"];

/** JMA codes named heavy rain, rain with storm, heavy snow, snow with strong wind and snowstorm. TELOPS table, as above. */
export const JMA_HEAVY_CODES: readonly string[] = [
  "306",
  "308",
  "405",
  "406",
  "407",
];

/** JMA codes named rain with thunder and snow with thunder. TELOPS table, as above. */
export const JMA_THUNDER_CODES: readonly string[] = ["350", "450"];
