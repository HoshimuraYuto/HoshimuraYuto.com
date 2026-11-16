import { describe, expect, test } from "vitest";

import { creatureCells } from "./dot-creature";

describe(creatureCells, () => {
  test("左右対称の形になる", () => {
    const cells = creatureCells("/foo"),
      keys = new Set(cells.map(({ x, y }) => `${x},${y}`));

    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every(({ x, y }) => keys.has(`${9 - x},${y}`))).toBe(true);
  });

  test("同じURLなら同じ生き物、違うURLなら違う生き物", () => {
    expect(creatureCells("/foo/")).toStrictEqual(creatureCells("/foo"));
    expect(creatureCells("/foo")).not.toStrictEqual(creatureCells("/bar"));
  });
});
