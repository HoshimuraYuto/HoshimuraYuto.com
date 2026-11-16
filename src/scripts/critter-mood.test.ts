import { describe, expect, test } from "vitest";

import type { Weather } from "../lib/weather/types";
import { moodOf } from "./critter-mood";

function weather(part: Partial<Weather>): Weather {
  return {
    time: new Date("2026-11-13T06:00:00Z"),
    cloudCover: 0,
    layers: [],
    precipitation: undefined,
    thunder: false,
    obscuration: undefined,
    visibility: undefined,
    wind: undefined,
    origin: {
      kind: "observation",
      provider: "iem-metar",
      place: "RJTT",
      raw: "",
      url: "",
    },
    ...part,
  };
}

describe(moodOf, () => {
  test("雨・霧雨・雷なら傘", () => {
    expect(
      moodOf(
        weather({ precipitation: { kind: "rain", intensity: "light" } }),
        true,
      ),
    ).toBe("rain");
    expect(
      moodOf(
        weather({ precipitation: { kind: "drizzle", intensity: "light" } }),
        false,
      ),
    ).toBe("rain");
    expect(moodOf(weather({ thunder: true }), true)).toBe("rain");
  });

  test("雪なら帽子", () => {
    expect(
      moodOf(
        weather({ precipitation: { kind: "snow", intensity: "light" } }),
        true,
      ),
    ).toBe("snow");
  });

  test("昼で雲が少なければサングラス、夜や曇りなら何もなし", () => {
    expect(moodOf(weather({ cloudCover: 0.2 }), true)).toBe("sun");
    expect(moodOf(weather({ cloudCover: 0.2 }), false)).toBe("plain");
    expect(moodOf(weather({ cloudCover: 0.75 }), true)).toBe("plain");
  });

  test("天気が分からなければ何もなし", () => {
    expect(moodOf(undefined, true)).toBe("plain");
  });
});
