import { describe, expect, test } from "vitest";

import { hopOffset, nearestIndex, step } from "./critter";
import type { CritterState } from "./critter";

const bounds = { min: 10, max: 300 };
// Never pauses or turns: every roll is above the per-frame chances.
function steady(): number {
  return 1;
}
function walking(x: number, dir: 1 | -1 = 1): CritterState {
  return {
    x,
    dir,
    pause: 0,
  };
}
function tick(dt: number, random = steady) {
  return { dt, bounds, random };
}

describe(step, () => {
  test("向いている方向へ進む", () => {
    expect(step(walking(100), tick(0.05)).x).toBeGreaterThan(100);
    expect(step(walking(100, -1), tick(0.05)).x).toBeLessThan(100);
  });

  test("右端に着くと端で止まって左を向く", () => {
    expect(step(walking(299), tick(0.1))).toMatchObject({ x: 300, dir: -1 });
  });

  test("左端に着くと端で止まって右を向く", () => {
    expect(step(walking(11, -1), tick(0.1))).toMatchObject({ x: 10, dir: 1 });
  });

  test("立ち止まっている間は進まず、残り時間だけが減る", () => {
    const next = step({ x: 100, dir: 1, pause: 1 }, tick(0.05));
    expect(next.x).toBe(100);
    expect(next.pause).toBeCloseTo(0.95);
  });

  test("長いフレームでも一度に進むのは上限の時間分まで", () => {
    expect(step(walking(100), tick(5)).x).toBe(step(walking(100), tick(0.1)).x);
  });

  test("眠っている間は、乱数や残り時間に関係なくその場から動かない", () => {
    const next = step(walking(100), { ...tick(0.1, () => 0), resting: true });
    expect(next.x).toBe(100);
    expect(next.pause).toBeGreaterThan(0);
  });

  test("乱数が小さいと立ち止まり、向きを変える", () => {
    const next = step(
      walking(100),
      tick(0.05, () => 0),
    );
    expect(next.pause).toBeGreaterThan(0);
    expect(next.dir).toBe(-1);
  });
});

describe("step で逃げるとき", () => {
  test("目指す所へ歩くより速く向かい、途中では立ち止まらない", () => {
    const next = step(
      { ...walking(100), target: 300 },
      tick(0.1, () => 0),
    );
    expect(next.x).toBeGreaterThan(step(walking(100), tick(0.1)).x);
    expect(next).toMatchObject({ dir: 1, pause: 0, target: 300 });
  });

  test("着いたら目指す所を忘れて、また普通に歩く", () => {
    expect(step({ ...walking(299), target: 300 }, tick(0.1))).toStrictEqual({
      x: 300,
      dir: 1,
      pause: 0,
    });
  });
});

describe(nearestIndex, () => {
  test("落とした順ではなく、今いる所から一番近い星を選ぶ", () => {
    expect(nearestIndex([900, 120, 400], 100)).toBe(1);
  });

  test("星がなければ-1", () => {
    expect(nearestIndex([], 100)).toBe(-1);
  });
});

describe(hopOffset, () => {
  test("立ち止まっている間は跳ねない", () => {
    expect(hopOffset({ x: 3, dir: 1, pause: 0.5 })).toBe(0);
  });

  test("歩いている間は上方向(0以下)にだけ跳ねる", () => {
    expect(hopOffset(walking(3))).toBeLessThanOrEqual(0);
  });
});
