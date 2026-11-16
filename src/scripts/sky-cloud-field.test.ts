import { describe, expect, test } from "vitest";

import type { Weather } from "../lib/weather/weather";
import { defined } from "../test/defined";
import { cloudField } from "./sky-cloud-field";
import type { FieldGrid } from "./sky-cloud-field";
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
/** A 60 × 40 grid over a sky two focal lengths wide and one high. */
const GRID: FieldGrid = {
  cols: 60,
  rows: 40,
  at: (col, row) => [(col - 30) / 30, (40 - row) / 40],
};
/** The screen's own grid at 1280 × 800 px: 128 × 54 cells of 10 px, the horizon at 512 px. */
const SCREEN: FieldGrid = {
  cols: 128,
  rows: 54,
  at: (col, row) => {
    const up = (512 - (row + 0.5) * 10) / 417;
    return up < -0.04 ? undefined : [((col + 0.5) * 10 - 640) / 417, up];
  },
};
/** The same broken layer as 40 different reports, three and a half hours apart, each as its field on the screen. */
const SKIES = Array.from({ length: 40 }, (_unused, index) => {
  const time = new Date(Date.UTC(2026, 0, 1) + index * 12_600_000);
  return cloudField(lookFor({ ...BROKEN, time }, time).sheets, SCREEN);
});
/** The density at the middle of a cloud's soft edge: a cloud is drawn 0.4 as thick there as at its core. */
function edgeOf(field: Float32Array): number {
  return 0.4 * Math.max(...field);
}
function insideShare(field: Float32Array): number {
  const edge = edgeOf(field),
    sky = field.filter(
      (_density, index) =>
        SCREEN.at(index % SCREEN.cols, Math.floor(index / SCREEN.cols)) !==
        undefined,
    );
  return sky.filter((density) => density > edge).length / sky.length;
}
function cloudyShare(field: Float32Array): number {
  return field.filter((density) => density > 0.45).length / field.length;
}

describe(cloudField, () => {
  test.each([
    ["雲量1–2/8", 1.5 / 8],
    ["雲量3–4/8", 3.5 / 8],
    ["雲量5–7/8", 6 / 8],
  ])("%sの層は、その割合だけ空を覆う", (_label, cover) => {
    const field = cloudField(
      [{ cover, scale: 1, opacity: 1, seed: 1, offset: [0, 0] }],
      GRID,
    );

    expect(cloudyShare(field)).toBeCloseTo(cover, 1);
  });

  test("全天の雲は、切れ間を作らない", () => {
    const field = cloudField(
      [{ cover: 1, scale: 1, opacity: 1, seed: 1, offset: [0, 0] }],
      GRID,
    );

    expect(Math.min(...field)).toBeGreaterThanOrEqual(0.75);
  });

  test("層がなければ、どこにも雲を置かない", () => {
    expect(Math.max(...cloudField([], GRID))).toBe(0);
  });

  test("層を重ねると、1枚のときより空が隠れる", () => {
    const low = {
        cover: 0.4,
        scale: 1,
        opacity: 1,
        seed: 1,
        offset: [0, 0],
      } as const,
      high = {
        cover: 0.4,
        scale: 2,
        opacity: 1,
        seed: 99,
        offset: [0, 0],
      } as const,
      one = cloudField([low], GRID),
      both = cloudField([low, high], GRID);

    expect(both.some((density, index) => density < defined(one[index]))).toBe(
      false,
    );
    expect(cloudyShare(both)).toBeGreaterThan(cloudyShare(one));
  });

  test("同じ種なら同じ雲、違う種なら違う雲になる", () => {
    const sheet = {
      cover: 0.5,
      scale: 1,
      opacity: 1,
      seed: 7,
      offset: [0, 0],
    } as const;

    expect(cloudField([sheet], GRID)).toStrictEqual(cloudField([sheet], GRID));
    expect(cloudField([{ ...sheet, seed: 8 }], GRID)).not.toStrictEqual(
      cloudField([sheet], GRID),
    );
  });

  test("形が違っても、雲量は報のとおりにする", () => {
    for (const field of SKIES) {
      expect(insideShare(field)).toBeCloseTo(6 / 8, 2);
    }
  });

  test("地平線より下の升には雲を置かない", () => {
    const below: FieldGrid = { cols: 4, rows: 4, at: () => undefined },
      field = cloudField(
        [{ cover: 1, scale: 1, opacity: 1, seed: 1, offset: [0, 0] }],
        below,
      );

    expect(Math.max(...field)).toBe(0);
  });
});
