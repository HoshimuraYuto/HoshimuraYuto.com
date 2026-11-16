import { describe, expect, test } from "vitest";

import type { Weather } from "../lib/weather/weather";
import { formatWeather } from "./sky-caption";

const AT = new Date("2026-10-24T04:00:00Z"),
  CLEAR: Weather = {
    time: AT,
    cloudCover: 0,
    layers: [],
    precipitation: undefined,
    thunder: false,
    obscuration: undefined,
    visibility: 10_000,
    wind: { direction: 90, speed: 5 },
    origin: {
      kind: "observation",
      provider: "iem-metar",
      place: "RJTT",
      raw: "",
      url: "",
    },
  },
  BROKEN: Weather = {
    ...CLEAR,
    cloudCover: 6 / 8,
    layers: [
      {
        amount: "broken",
        oktas: [5, 7],
        cover: 6 / 8,
        baseFeet: 3000,
        convective: false,
      },
    ],
  },
  SPECIAL: readonly (readonly [
    label: string,
    weather: Weather,
    text: string,
  ])[] = [
    [
      "あられまじりの雨",
      {
        ...BROKEN,
        precipitation: { kind: "rain", intensity: "light", ice: "graupel" },
      },
      "雲量5–7/8 弱い雨 あられまじり RJTT 240400Z",
    ],
    [
      "凍雨",
      { ...BROKEN, precipitation: { kind: "icePellets", intensity: "light" } },
      "雲量5–7/8 弱い凍雨 RJTT 240400Z",
    ],
    [
      "着氷性の雨",
      {
        ...BROKEN,
        precipitation: { kind: "rain", intensity: "moderate", freezing: true },
      },
      "雲量5–7/8 着氷性の雨 RJTT 240400Z",
    ],
    [
      "スコールと強い風",
      { ...BROKEN, phenomena: ["squall"], wind: { direction: 320, speed: 18 } },
      "雲量5–7/8 スコール 強い風 RJTT 240400Z",
    ],
    [
      "台風の暴風",
      { ...BROKEN, wind: { direction: 170, speed: 34, gust: 44 } },
      "雲量5–7/8 猛烈な風 RJTT 240400Z",
    ],
    [
      "平均は強い風でも、瞬間50m/s以上",
      { ...BROKEN, wind: { direction: 70, speed: 16, gust: 51 } },
      "雲量5–7/8 猛烈な風 RJTT 240400Z",
    ],
    [
      "砂じんあらし",
      { ...BROKEN, obscuration: "dust", phenomena: ["duststorm"] },
      "雲量5–7/8 砂じん 砂じんあらし RJTT 240400Z",
    ],
  ];

describe(formatWeather, () => {
  test("天気がなければ空文字にする", () => {
    expect(formatWeather()).toBe("");
  });

  test("観測は、雲量・現象・報の地点と日時を並べる", () => {
    const weather: Weather = {
      ...BROKEN,
      precipitation: { kind: "rain", intensity: "light" },
      obscuration: "mist",
    };

    expect(formatWeather(weather)).toBe("雲量5–7/8 弱い雨 もや RJTT 240400Z");
  });

  test("雷と強い降り方を書く", () => {
    const weather: Weather = {
      ...BROKEN,
      thunder: true,
      precipitation: { kind: "rain", intensity: "heavy" },
    };

    expect(formatWeather(weather)).toBe("雲量5–7/8 雷 強い雨 RJTT 240400Z");
  });

  test("雲量は、最も広い層のものを書く", () => {
    const weather: Weather = {
      ...BROKEN,
      layers: [
        {
          amount: "few",
          oktas: [1, 2],
          cover: 1.5 / 8,
          baseFeet: 1000,
          convective: false,
        },
        {
          amount: "overcast",
          oktas: [8, 8],
          cover: 1,
          baseFeet: 3000,
          convective: false,
        },
      ],
    };

    expect(formatWeather(weather)).toBe("雲量8/8 RJTT 240400Z");
  });

  test("雲の報のない観測は、地点と日時だけ書く", () => {
    expect(formatWeather(CLEAR)).toBe("RJTT 240400Z");
  });

  test("やや強い風(10m/s)より弱い風は書かない", () => {
    expect(
      formatWeather({ ...BROKEN, wind: { direction: 90, speed: 9.9 } }),
    ).toBe("雲量5–7/8 RJTT 240400Z");
  });

  test("予報は、気象庁の文をそのまま書く", () => {
    const weather: Weather = {
      ...CLEAR,
      origin: {
        kind: "forecast",
        provider: "jma-forecast",
        place: "130010",
        raw: "211 くもり　昼前　から　晴れ",
        url: "",
      },
    };

    expect(formatWeather(weather)).toBe("気象庁予報 くもり 昼前 から 晴れ");
  });

  test.each(SPECIAL)("%sを書く", (_label, weather, text) => {
    expect(formatWeather(weather)).toBe(text);
  });
});
