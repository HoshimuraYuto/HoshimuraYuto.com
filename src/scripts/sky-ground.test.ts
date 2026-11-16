import { afterEach, describe, expect, test, vi } from "vitest";

import type { Ground, Weather } from "../lib/weather/weather";
import { fakeContext, stubCanvases } from "./sky-canvas.test-helper";
import { lyingFor, paintLying, reflectSky } from "./sky-ground";
import type { Palette, Rgb } from "./sky-light";
import type { Scene } from "./sky-scene";

const BLACK: Rgb = [0, 0, 0];
const PALETTE: Palette = {
  nightTop: BLACK,
  nightLow: BLACK,
  dayTop: BLACK,
  dayLow: BLACK,
  duskLow: BLACK,
  ground: BLACK,
  sun: BLACK,
  sunLow: BLACK,
  moon: BLACK,
  starBlue: BLACK,
  starWhite: BLACK,
  starRed: BLACK,
  cloudDay: BLACK,
  cloudShade: BLACK,
  cloudNight: BLACK,
  cloudNightLow: BLACK,
  veilDay: BLACK,
  veilNight: BLACK,
  snowDay: [200, 210, 220],
  snowNight: [60, 70, 80],
  fall: BLACK,
  dust: BLACK,
};
/** 1280 × 800 px with a level horizon at 512 px: the ground is 288 px high, 160 × 37 cells of 8 px. */
const SCENE: Scene = {
  width: 1280,
  height: 800,
  focal: 400,
  horizonAt: () => 512,
  day: 1,
  sunAltitude: 40,
  limitingMagnitude: -2,
  sun: undefined,
  moon: undefined,
  stars: [],
};
const COLS = 160;
const WEATHER: Weather = {
  time: new Date("2026-02-07T22:00:00Z"),
  cloudCover: 0,
  layers: [],
  precipitation: undefined,
  thunder: false,
  obscuration: undefined,
  visibility: 10_000,
  wind: undefined,
  origin: {
    kind: "observation",
    provider: "iem-metar",
    place: "RJTT",
    raw: "",
    url: "",
  },
};
function paintingOn(lying: Ground | undefined, scene: Scene = SCENE) {
  const fake = fakeContext();
  stubCanvases(fake.ctx, [scene.width, scene.height]);
  return {
    ...fake,
    painter: { ctx: fake.ctx, scene, palette: PALETTE, look: undefined, lying },
  };
}
function cellsOf(
  spies: ReturnType<typeof fakeContext>["spies"],
  nth = 0,
): Uint8ClampedArray {
  const made = spies.createImageData.mock.results[nth];
  if (made?.type !== "return") {
    throw new Error("no bitmap was made");
  }
  return made.value.data;
}
function rowOf(cells: Uint8ClampedArray, row: number): number[] {
  return Array.from(
    { length: COLS },
    (_unused, col) => cells[(row * COLS + col) * 4 + 3] ?? 0,
  );
}
function total(values: Iterable<number>): number {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum;
}
function cover(cells: Uint8ClampedArray): number {
  return total(cells.filter((_value, index) => index % 4 === 3));
}
function snowCells(snow: number, scene: Scene = SCENE): Uint8ClampedArray {
  const { painter, spies } = paintingOn({ wet: 0, snow }, scene);
  paintLying(painter);
  return cellsOf(spies);
}
function sheenCells(wet: number): Uint8ClampedArray {
  const { painter, spies } = paintingOn({ wet, snow: 0 });
  reflectSky(painter);
  return cellsOf(spies);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(lyingFor, () => {
  test("直前の様子が分からない天気(予報)には、地面の様子がない", () => {
    expect(lyingFor(WEATHER, 1)).toBeUndefined();
  });

  test("天気が現れる途中は、その割合だけ溜まっている", () => {
    const weather = { ...WEATHER, ground: { wet: 0.8, snow: 0.4 } };

    expect(lyingFor(weather, 1)).toStrictEqual({ wet: 0.8, snow: 0.4 });
    expect(lyingFor(weather, 0.5)).toStrictEqual({ wet: 0.4, snow: 0.2 });
  });
});

describe(reflectSky, () => {
  test.each([
    ["地面の様子が分からない", undefined],
    ["地面が乾いている", { wet: 0, snow: 0.5 }],
  ])("%sときは、何も映さない", (_label, lying) => {
    const { painter, spies } = paintingOn(lying);

    expect(reflectSky(painter)).toBeUndefined();
    expect(spies.drawImage).not.toHaveBeenCalled();
  });

  test("濡れているほど、広く強く映す", () => {
    const damp = cover(sheenCells(0.2)),
      wet = cover(sheenCells(0.6)),
      soaked = cover(sheenCells(1));

    expect(damp).toBeGreaterThan(0);
    expect(wet).toBeGreaterThan(damp);
    expect(soaked).toBeGreaterThan(wet);
  });

  test("少し濡れた地面は、水たまりのところだけが映す", () => {
    const row = rowOf(sheenCells(0.3), 3);

    expect(row.some((alpha) => alpha === 0)).toBe(true);
    expect(row.some((alpha) => alpha > 0)).toBe(true);
  });

  test("同じ濡れ方なら、同じところが映る", () => {
    expect(sheenCells(0.5)).toStrictEqual(sheenCells(0.5));
  });
});

describe(paintLying, () => {
  test.each([
    ["地面の様子が分からない", undefined],
    ["地面に何もない", { wet: 0, snow: 0 }],
  ])("%sときは、何も描かない", (_label, lying) => {
    const { painter, spies } = paintingOn(lying);

    paintLying(painter);

    expect(spies.drawImage).not.toHaveBeenCalled();
  });

  test("地平線が曲がっていれば、いちばん高いところから置き、地平線より上の升は空ける", () => {
    // The horizon is at 500 px on the left and 513 px on the right.
    const curved = { ...SCENE, horizonAt: (x: number) => 500 + x / 100 },
      { painter, spies } = paintingOn({ wet: 0, snow: 1 }, curved);

    paintLying(painter);

    const cells = cellsOf(spies);
    expect(spies.drawImage.mock.calls[0]?.[2]).toBeCloseTo(500.04);
    // The first row is 4 px below the top: under the horizon on the left, above it on the right.
    expect(rowOf(cells, 0)[159]).toBe(0);
    expect(rowOf(cells, 1)[0]).toBeGreaterThan(0);
    expect(rowOf(cells, 3)[159]).toBeGreaterThan(0);
  });

  test("雪は地平線の手前に白く積もり、文字のある手前は地面のままにする", () => {
    const cells = snowCells(1);

    // Row 2 is 20 px below the horizon; row 14 is 116 px below, past the 0.36 of the ground the snow reaches.
    expect(Math.min(...rowOf(cells, 2))).toBeGreaterThan(0);
    expect(total(rowOf(cells, 14))).toBe(0);
  });

  test("積もるほど、広く濃く覆う", () => {
    const dusting = cover(snowCells(0.15)),
      half = cover(snowCells(0.5)),
      full = cover(snowCells(1));

    expect(dusting).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(dusting);
    expect(full).toBeGreaterThan(half);
  });

  test("濡れて雪もある地面には、映り込みの上に雪を置く", () => {
    const { painter, spies } = paintingOn({ wet: 1, snow: 0.5 }),
      reflection = document.createElement("canvas");

    paintLying(painter, reflection);

    const sources = spies.drawImage.mock.calls.map((call) => call[0]);
    expect(sources).toHaveLength(2);
    expect(sources[0]).toBe(reflection);
    expect(sources[1]).not.toBe(reflection);
  });
});
