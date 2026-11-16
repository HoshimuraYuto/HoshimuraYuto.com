import { describe, expect, test } from "vitest";

import { localSiderealTime, normalizeDegrees } from "./time";

describe(normalizeDegrees, () => {
  test.each([
    [-10, 350],
    [370, 10],
    [720, 0],
    [180, 180],
  ])("%s°は%s°にする", (degrees, expected) => {
    expect(normalizeDegrees(degrees)).toBeCloseTo(expected);
  });
});

describe(localSiderealTime, () => {
  // Meeus, Astronomical Algorithms 2nd ed., example 12.a: 13h10m46.3668s.
  test("グリニッジでは、Meeusの例題12.aと同じ平均恒星時になる", () => {
    expect(localSiderealTime(new Date("1987-04-10T00:00:00Z"), 0)).toBeCloseTo(
      197.693195,
      5,
    );
  });

  test("東経の分だけ進む", () => {
    const date = new Date("1987-04-10T00:00:00Z");

    expect(localSiderealTime(date, 139.7454)).toBeCloseTo(
      normalizeDegrees(197.693195 + 139.7454),
      5,
    );
  });
});
