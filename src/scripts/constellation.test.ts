import { describe, expect, test } from "vitest";

import {
  centreWords,
  constellationFor,
  figureLines,
  nameFor,
  project,
} from "./constellation";
import type { ChartStar } from "./constellation";

const PATHS = ["/foo", "/blog/old-post", "/a", "/works/2019/", "/こんにちは"];

describe(project, () => {
  test("中心の星は図の真ん中に、東は左に置く", () => {
    const centre = { ra: 80, dec: 20 },
      middle = project(
        { ra: 80, dec: 20, magnitude: 1, colorIndex: 0 },
        centre,
      ),
      east = project({ ra: 85, dec: 20, magnitude: 1, colorIndex: 0 }, centre);

    expect(middle?.x).toBeCloseTo(50);
    expect(middle?.y).toBeCloseTo(50);
    expect(east?.x).toBeLessThan(50);
  });

  test("範囲の外の星は置かない", () => {
    expect(
      project(
        { ra: 200, dec: 20, magnitude: 1, colorIndex: 0 },
        { ra: 80, dec: 20 },
      ),
    ).toBeUndefined();
  });
});

describe(constellationFor, () => {
  test("同じURLなら同じ星座、末尾の / の有無は同じURLとみなす", () => {
    expect(constellationFor("/works/2019/")).toStrictEqual(
      constellationFor("/works/2019"),
    );
  });

  test("URLが違えば空の別の場所になる", () => {
    const centres = new Set(
      PATHS.map((path) => constellationFor(path).ra.toFixed(3)),
    );

    expect(centres.size).toBe(PATHS.length);
  });

  test.each(PATHS)(
    "%s でも、図に収まる星があり、明るい星から順に結ぶ",
    (path) => {
      const { stars, lines } = constellationFor(path);

      expect(stars.length).toBeGreaterThanOrEqual(6);
      expect(lines).toHaveLength(5);
      const xs = stars.map((star) => star.x),
        ys = stars.map((star) => star.y);

      expect(Math.min(...xs, ...ys)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...xs, ...ys)).toBeLessThanOrEqual(100);
    },
  );
});

describe(figureLines, () => {
  test("どの星も1回だけ加わり、全体が1本につながる", () => {
    const stars: ChartStar[] = [
        { x: 0, y: 0, magnitude: 1 },
        { x: 10, y: 0, magnitude: 2 },
        { x: 50, y: 50, magnitude: 3 },
        { x: 12, y: 3, magnitude: 4 },
      ],
      lines = figureLines(stars),
      reached = new Set(lines.flat());

    expect(lines).toStrictEqual([
      [0, 1],
      [1, 3],
      [3, 2],
    ]);
    expect(reached.size).toBe(stars.length);
  });
});

describe("文言", () => {
  test.each([
    [{ ra: 78, dec: 23.4 }, "赤経5時12分 赤緯+23°"],
    [{ ra: 0, dec: -5.2 }, "赤経0時0分 赤緯−5°"],
  ] as const)("%o は「%s」", (centre, words) => {
    expect(centreWords(centre)).toBe(words);
  });

  test("星座の名前はURLのパスから付ける", () => {
    expect(nameFor("/blog/old-post/")).toBe("blog/old-post");
  });
});
