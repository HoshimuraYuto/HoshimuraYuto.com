import { describe, expect, test } from "vitest";

import { DAY_MS, SYNODIC_MONTH_DAYS } from "./constants";
import { limitingMagnitude, skyAt } from "./sky";
import type { Horizontal, SunMoonSource } from "./sky";

const TOKYO = { latitude: 35.6586, longitude: 139.7454 };
const AT = new Date("2026-11-20T13:00:00Z");
const NEW_MOON = new Date("2026-11-09T07:02:00Z");
// The real phase runs up to about ±0.5 day off the mean month: 0.5 / 29.5 of a month.
const UNEVEN_PHASE = 0.017;
const NIGHT_SUN: Horizontal = { altitude: -30, azimuth: 0 };

function sourceWith(
  sun: Horizontal,
  moon: Horizontal = { altitude: 30, azimuth: 180 },
  phase = 0.25,
): SunMoonSource {
  return {
    sun: () => sun,
    moon: () => moon,
    moonPhase: () => ({ fraction: 0.5, phase }),
  };
}
function unevenMoon(): SunMoonSource {
  return {
    ...sourceWith(NIGHT_SUN),
    moonPhase: (date) => {
      const months =
          (date.getTime() - NEW_MOON.getTime()) / (SYNODIC_MONTH_DAYS * DAY_MS),
        uneven = months + UNEVEN_PHASE * Math.sin(2 * Math.PI * months);
      return { fraction: 0.5, phase: uneven - Math.floor(uneven) };
    },
  };
}

describe("skyAt: the moon", () => {
  test.each([1, 7.4, 15, 28])(
    "月齢は%s日前の新月から数える(満ち欠けの速さが一定でなくても)",
    (days) => {
      const date = new Date(NEW_MOON.getTime() + days * DAY_MS);

      expect(skyAt(date, TOKYO, unevenMoon()).moon.age).toBeCloseTo(days, 3);
    },
  );

  test.each([
    [0.25, true],
    [0.75, false],
  ])("位相が%sなら、満ちていく途中かは%s", (phase, waxing) => {
    const sky = skyAt(AT, TOKYO, sourceWith(NIGHT_SUN, undefined, phase));

    expect(sky.moon.waxing).toBe(waxing);
  });

  test.each([
    ["真上", { altitude: 60, azimuth: 180 }, 0],
    ["右(西)", { altitude: 0, azimuth: 270 }, 90],
    ["左(東)", { altitude: 0, azimuth: 90 }, 270],
  ] as const)(
    "光る縁は太陽の方を向く: 太陽が月の%sなら%s°",
    (_where, sun, angle) => {
      const sky = skyAt(
        AT,
        TOKYO,
        sourceWith(sun, { altitude: 0, azimuth: 180 }),
      );

      expect(sky.moon.brightLimbAngle).toBeCloseTo(angle);
    },
  );
});

describe("skyAt: stars", () => {
  test("太陽が出ている間は、星を出さない", () => {
    const sky = skyAt(AT, TOKYO, sourceWith({ altitude: 30, azimuth: 180 }));

    expect(sky.stars).toStrictEqual([]);
  });

  test("夜が暗くなれば、地平線より上にある星表の星をすべて出す", () => {
    const sky = skyAt(AT, TOKYO, sourceWith(NIGHT_SUN));

    expect(sky.limitingMagnitude).toBe(5);
    expect(sky.stars.length).toBeGreaterThan(500);
  });
});

describe(limitingMagnitude, () => {
  test.each([
    [10, -2],
    [-3, -2],
    [-9, 2.4],
    [-18, 5],
    [-40, 5],
  ])("太陽の高度が%s°なら、%s等までの星が見える", (sunAltitude, expected) => {
    expect(limitingMagnitude(sunAltitude)).toBeCloseTo(expected);
  });
});
