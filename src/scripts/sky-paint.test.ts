import { describe, expect, test } from "vitest";

import { parseRgb, rgba } from "./sky-light";
import type { Palette } from "./sky-light";
import { starColor } from "./sky-paint";

const BLACK = [0, 0, 0] as const,
  PALETTE: Palette = {
    nightTop: BLACK,
    nightLow: BLACK,
    dayTop: BLACK,
    dayLow: BLACK,
    duskLow: BLACK,
    ground: BLACK,
    sun: BLACK,
    sunLow: BLACK,
    moon: BLACK,
    starBlue: [1, 1, 1],
    starWhite: [2, 2, 2],
    starRed: [3, 3, 3],
    cloudDay: BLACK,
    cloudShade: BLACK,
    cloudNight: BLACK,
    cloudNightLow: BLACK,
    veilDay: BLACK,
    veilNight: BLACK,
    snowDay: BLACK,
    snowNight: BLACK,
    fall: BLACK,
    dust: BLACK,
  };

describe(parseRgb, () => {
  test("#rrggbbを読む", () => {
    expect(parseRgb(" #0a10ff ")).toStrictEqual([10, 16, 255]);
  });

  test("読めない値は黒にする", () => {
    expect(parseRgb("red")).toStrictEqual([0, 0, 0]);
  });
});

describe(rgba, () => {
  test("不透明度を0〜1に収める", () => {
    expect(rgba([10.4, 20.6, 30], 1.5)).toBe("rgb(10 21 30 / 1.000)");
    expect(rgba([0, 0, 0], -1)).toBe("rgb(0 0 0 / 0.000)");
  });
});

describe(starColor, () => {
  test.each([
    ["青白い星", -0.2, PALETTE.starBlue],
    ["白い星", 0.6, PALETTE.starWhite],
    ["赤い星", 1.6, PALETTE.starRed],
  ])("%sの色を色指数で選ぶ", (_label, ci, expected) => {
    expect(starColor(ci, PALETTE)).toBe(expected);
  });
});
