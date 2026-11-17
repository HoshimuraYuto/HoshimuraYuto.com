import { describe, expect, test } from "vitest";

import type { Weather } from "../lib/weather/weather";
import { defined } from "../test/defined";
import { lookFor } from "./sky-look";

const AT = new Date("2026-10-24T04:00:00Z");
const CLEAR: Weather = {
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
};
const BROKEN: Weather = {
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
};
function veilAt(visibility: number): number {
  return lookFor({ ...CLEAR, visibility }, AT).veil;
}

describe(lookFor, () => {
  test("雲のない天気は、何も描かない", () => {
    expect(lookFor(CLEAR, AT)).toStrictEqual({
      sheets: [],
      gloom: 0,
      veil: 0,
      fall: undefined,
      thunder: false,
    });
  });

  test("雲の層ごとに1枚ずつ、低い層ほど濃く粗く描く", () => {
    const { sheets } = lookFor(
        {
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
              amount: "broken",
              oktas: [5, 7],
              cover: 6 / 8,
              baseFeet: 12_000,
              convective: false,
            },
          ],
        },
        AT,
      ),
      [low, high] = sheets;

    expect(sheets.map((sheet) => sheet.cover)).toStrictEqual([1.5 / 8, 6 / 8]);
    expect(defined(low).opacity).toBeGreaterThan(defined(high).opacity);
    expect(defined(low).scale).toBeLessThan(defined(high).scale);
    expect(defined(low).seed).not.toBe(defined(high).seed);
  });

  test("層のない天気(予報)は、全体の雲量で1枚描く", () => {
    const { sheets } = lookFor({ ...CLEAR, cloudCover: 0.85 }, AT);

    expect(sheets.map((sheet) => sheet.cover)).toStrictEqual([0.85]);
  });

  test("同じ報と同じ日時なら、同じ見た目になる", () => {
    const later = new Date("2026-10-24T04:20:00Z");

    expect(lookFor(BROKEN, later)).toStrictEqual(lookFor(BROKEN, later));
  });

  test("報から時間がたつと、雲は風下へ流れる", () => {
    // The wind is from the east (90°), so on a south-facing screen the cloud travels to the right.
    const atReport = lookFor(BROKEN, AT).sheets[0],
      later = lookFor(BROKEN, new Date("2026-10-24T04:20:00Z")).sheets[0];

    expect(atReport?.offset).toStrictEqual([-0, -0]);
    expect(later?.offset[0]).toBeLessThan(0);
    expect(later?.offset[1]).toBeCloseTo(0);
  });

  test.each([
    [
      "弱い雨",
      { kind: "rain", intensity: "light" },
      { kind: "rain", density: 0.35 },
    ],
    [
      "強い雨",
      { kind: "rain", intensity: "heavy" },
      { kind: "rain", density: 1 },
    ],
    [
      "霧雨",
      { kind: "drizzle", intensity: "moderate" },
      { kind: "rain", density: 0.39 },
    ],
    [
      "雪",
      { kind: "snow", intensity: "moderate" },
      { kind: "snow", density: 0.65 },
    ],
    [
      "みぞれ",
      { kind: "sleet", intensity: "light" },
      { kind: "sleet", density: 0.35 },
    ],
  ] as const)("%sを降るものにする", (_label, precipitation, expected) => {
    const { fall } = lookFor({ ...BROKEN, precipitation }, AT);

    expect(fall?.kind).toBe(expected.kind);
    expect(fall?.density).toBeCloseTo(expected.density);
  });

  test("降るものは風下へ傾き、雪は雨より大きく流される", () => {
    const rain = lookFor(
        { ...BROKEN, precipitation: { kind: "rain", intensity: "moderate" } },
        AT,
      ),
      snow = lookFor(
        { ...BROKEN, precipitation: { kind: "snow", intensity: "moderate" } },
        AT,
      );

    expect(rain.fall?.slant).toBeGreaterThan(0);
    expect(defined(snow.fall).slant).toBeGreaterThan(defined(rain.fall).slant);
  });

  test("雨が強いほど、雲を暗くする", () => {
    function gloomOf(intensity: "light" | "heavy"): number {
      return lookFor(
        { ...BROKEN, precipitation: { kind: "rain", intensity } },
        AT,
      ).gloom;
    }

    expect(lookFor(BROKEN, AT).gloom).toBeLessThan(gloomOf("light"));
    expect(gloomOf("light")).toBeLessThan(gloomOf("heavy"));
  });

  test("視程が悪いほど、幕を濃くする", () => {
    expect(veilAt(8000)).toBeLessThan(veilAt(4000));
    expect(veilAt(4000)).toBeLessThan(veilAt(1000));
  });
});

const LIGHT_RAIN = { kind: "rain", intensity: "light" } as const;
function windOf(speed: number, gust?: number): Weather {
  return {
    ...BROKEN,
    wind: { direction: 90, speed, ...(gust === undefined ? {} : { gust }) },
  };
}
function rainIn(weather: Weather) {
  return lookFor({ ...weather, precipitation: LIGHT_RAIN }, AT).fall;
}
function rainSlantAt(speed: number): number {
  return defined(rainIn(windOf(speed))).slant;
}

describe("特殊な天気", () => {
  test("風そのものは描かない: 晴れた日の強風でも、降るものも砂も出さない", () => {
    const look = lookFor(windOf(25, 40), AT);

    expect(look.fall).toBeUndefined();
    expect(look).not.toHaveProperty("sand");
  });

  test("猛烈な風(30m/s)より強い風でも、傾きは決まった上限で止まる", () => {
    expect(rainSlantAt(60)).toBeCloseTo(1.5);
  });

  test("突風の差が大きいほど、雨の傾きを揺らす", () => {
    expect(rainIn(windOf(12, 14))?.gust).toBeLessThan(
      defined(rainIn(windOf(12, 24))?.gust),
    );
  });

  test("風が弱ければ、突風の揺れを付けない", () => {
    expect(rainIn(windOf(5, 8))).not.toHaveProperty("gust");
  });

  test("砂じんあらしは、報の視程によらず景色を隠し、砂の粒を降らせる", () => {
    const look = lookFor({ ...BROKEN, phenomena: ["duststorm"] }, AT);

    expect(look.veil).toBeGreaterThanOrEqual(0.8);
    expect(look.sand?.kind).toBe("sand");
    expect(look.sand?.density).toBe(1);
  });

  test("スコールは、報の風が弱くても雨を突風で揺らす", () => {
    expect(rainIn({ ...windOf(3), phenomena: ["squall"] })?.gust).toBe(1);
  });

  test("竜巻は、漏斗雲を描く印を付ける", () => {
    expect(lookFor({ ...BROKEN, phenomena: ["funnel"] }, AT).funnel).toBe(true);
    expect(lookFor(BROKEN, AT)).not.toHaveProperty("funnel");
  });
});
