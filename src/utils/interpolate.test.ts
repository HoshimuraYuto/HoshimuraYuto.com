import { describe, expect, test } from "vitest";

import { interpolate } from "./interpolate";

const TABLE = [
  [0, 10],
  [10, 20],
  [20, 0],
] as const;

describe(interpolate, () => {
  test("表の点のあいだは直線で結ぶ", () => {
    expect(interpolate(TABLE, 5)).toBe(15);
    expect(interpolate(TABLE, 15)).toBe(10);
  });

  test("表の外では、端の値のまま", () => {
    expect(interpolate(TABLE, -5)).toBe(10);
    expect(interpolate(TABLE, 25)).toBe(0);
  });

  test("同じxが並んでも0で割らない", () => {
    expect(
      interpolate(
        [
          [0, 1],
          [5, 2],
          [5, 4],
          [10, 4],
        ],
        5,
      ),
    ).toBe(2);
  });
});
