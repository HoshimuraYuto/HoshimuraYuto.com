import { describe, expect, test } from "vitest";

import { bearingOnSky, equatorialToHorizontal } from "./horizon";

describe(bearingOnSky, () => {
  const MOON = { altitude: 0, azimuth: 180 };

  test.each([
    ["真上", { altitude: 40, azimuth: 180 }, 0],
    ["右(西)", { altitude: 0, azimuth: 270 }, 90],
    ["真下", { altitude: -40, azimuth: 180 }, 180],
    ["左(東)", { altitude: 0, azimuth: 90 }, 270],
  ] as const)("%sにある点への向きは%s°", (_where, to, expected) => {
    expect(bearingOnSky(MOON, to)).toBeCloseTo(expected);
  });

  test("天頂の近くでも、方位の差に引きずられず、大円の向きを返す", () => {
    // Both near the zenith and 90° apart in azimuth: the great circle runs almost straight up.
    expect(
      bearingOnSky(
        { altitude: 89, azimuth: 180 },
        { altitude: 89, azimuth: 270 },
      ),
    ).toBeLessThan(50);
  });
});

describe(equatorialToHorizontal, () => {
  test("恒星時と赤経が等しい星は、子午線上で北緯ぶん天頂から離れる", () => {
    const place = equatorialToHorizontal({ ra: 100, dec: 0 }, 100, 35);

    expect(place.altitude).toBeCloseTo(55);
    expect(place.azimuth).toBeCloseTo(180);
  });

  test("天の北極は、北の空に緯度と同じ高さで見える", () => {
    const place = equatorialToHorizontal({ ra: 0, dec: 90 }, 123, 35);

    expect(place.altitude).toBeCloseTo(35);
    expect(place.azimuth % 360).toBeCloseTo(0);
  });
});
