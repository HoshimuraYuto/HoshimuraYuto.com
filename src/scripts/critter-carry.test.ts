import { describe, expect, test } from "vitest";

import { fall, grounded } from "./critter-carry";

describe(fall, () => {
  test("落ちるほど速くなる", () => {
    const first = fall({ mode: "falling", y: 400, vy: 0 }, 0.05),
      second = fall(first, 0.05);
    expect(400 - first.y).toBeLessThan(first.y - second.y);
  });

  test("地面に着いたら止まって、また歩ける状態に戻る", () => {
    expect(fall({ mode: "falling", y: 2, vy: 500 }, 0.05)).toStrictEqual(
      grounded(),
    );
  });
});
