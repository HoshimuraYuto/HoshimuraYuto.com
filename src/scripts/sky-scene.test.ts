import { describe, expect, test } from "vitest";

import { skyAt } from "../lib/sky/sky";
import type { Sky } from "../lib/sky/sky";
import { HORIZON_SHARE, sceneFor, toVector } from "./sky-scene";

const TOKYO = { latitude: 35.6586, longitude: 139.7454 };
const NOON = skyAt(new Date("2026-11-12T03:00:00Z"), TOKYO);
const NIGHT = skyAt(new Date("2026-11-20T13:00:00Z"), TOKYO);
function withSun(sky: Sky, altitude: number, azimuth: number): Sky {
  return {
    ...sky,
    sun: { altitude, azimuth },
  };
}

describe(toVector, () => {
  test.each([
    ["真南", { altitude: 0, azimuth: 180 }, [1, 0, 0]],
    ["真西", { altitude: 0, azimuth: 270 }, [0, 1, 0]],
    ["天頂", { altitude: 90, azimuth: 0 }, [0, 0, 1]],
  ] as const)("%sを[南, 西, 上]の向きにする", (_label, place, expected) => {
    const v = toVector(place);

    expect(v[0]).toBeCloseTo(expected[0]);
    expect(v[1]).toBeCloseTo(expected[1]);
    expect(v[2]).toBeCloseTo(expected[2]);
  });
});

describe(sceneFor, () => {
  test("地平線を画面の高さの決まった位置に置く", () => {
    const scene = sceneFor(NOON, 1280, 800);

    expect(scene.horizonAt(640)).toBeCloseTo(800 * HORIZON_SHARE, 0);
  });

  test("地平線は左右の端ほど上がる", () => {
    const scene = sceneFor(NOON, 1280, 800);

    expect(scene.horizonAt(0)).toBeLessThan(scene.horizonAt(640));
    expect(scene.horizonAt(1280)).toBeLessThan(scene.horizonAt(640));
  });

  test("南中する太陽を画面の中央より上に置く", () => {
    const sun = sceneFor(withSun(NOON, 40, 180), 1280, 800).sun;

    expect(sun?.[0]).toBeCloseTo(640, 0);
    expect(sun?.[1]).toBeLessThan(800 * HORIZON_SHARE);
  });

  test("南から見るので、西の太陽は右に来る", () => {
    const sun = sceneFor(withSun(NOON, 20, 225), 1280, 800).sun;

    expect(sun?.[0]).toBeGreaterThan(640);
  });

  test("沈んだ太陽は描かない", () => {
    expect(sceneFor(NIGHT, 1280, 800).sun).toBeUndefined();
  });

  test("夜は星を画面の中だけ、地平線より上に置く", () => {
    const scene = sceneFor(NIGHT, 1280, 800);

    expect(scene.stars.length).toBeGreaterThan(50);
    const xs = scene.stars.map((s) => s.x);

    expect(Math.min(...xs)).toBeGreaterThan(-20);
    expect(Math.max(...xs)).toBeLessThan(1300);
    expect(Math.max(...scene.stars.map((s) => s.y))).toBeLessThan(800);
    expect(Math.min(...scene.stars.map((s) => s.altitude))).toBeGreaterThan(0);
  });

  test("昼は星を置かない", () => {
    expect(sceneFor(NOON, 1280, 800).stars).toStrictEqual([]);
  });

  test("昼は1、夜は0の明るさを持つ", () => {
    expect(sceneFor(NOON, 1280, 800).day).toBe(1);
    expect(sceneFor(NIGHT, 1280, 800).day).toBe(0);
  });

  test("狭い画面では太陽の方を向き、太陽を画面の中に入れる", () => {
    const sun = sceneFor(withSun(NOON, 20, 225), 390, 844).sun;

    expect(sun?.[0]).toBeGreaterThan(0);
    expect(sun?.[0]).toBeLessThan(390);
  });
});
