import { describe, expect, test } from "vitest";

import { defined } from "../test/defined";
import {
  bounceOf,
  dropAt,
  flashAt,
  gustAt,
  makeDrops,
  splashOf,
} from "./sky-fall-motion";
import type { Drop, FallMoment, Splash } from "./sky-fall-motion";
import type { Fall } from "./sky-look";

const RAIN: Fall = { kind: "rain", density: 1, slant: 0 };
const HAIL: Fall = { ...RAIN, ice: 1 };
const SAND: Fall = { kind: "sand", density: 1, slant: 0.6 };
const AREA = 1280 * 800;
const HORIZON = 512;
function sequence(): () => number {
  let n = 0;
  return () => {
    n += 1;
    return (n * 0.61803398875) % 1;
  };
}
/** A moment on a 1280 × 800 px canvas whose ground starts at a level horizon. */
function frameAt(seconds: number, part: Partial<FallMoment> = {}): FallMoment {
  return {
    width: 1280,
    height: 800,
    seconds,
    strength: 1,
    horizonAt: () => HORIZON,
    ...part,
  };
}
const DROP: Drop = { x: 0.5, phase: 0, depth: 1, snow: false, sway: 0 };
function fallen(snow: boolean): number {
  return (
    dropAt({ ...DROP, snow }, RAIN, frameAt(0.5))[1] -
    dropAt({ ...DROP, snow }, RAIN, frameAt(0))[1]
  );
}
function flashesIn(seconds: number): number {
  let count = 0;
  for (let t = 0.02; t < seconds; t += 0.02) {
    if (flashAt(t) > 0 && flashAt(t - 0.02) === 0) {
      count += 1;
    }
  }
  return count;
}
/** A far drop falling straight down the middle. Its ground is the horizon, which it meets 1.045 s after time zero; its splash lasts 0.187 s. */
const FAR: Drop = { ...DROP, depth: 0 };
const ICE: Drop = { ...FAR, ice: true };
const GRAIN: Drop = { ...FAR, sand: true };
function splashAt(
  seconds: number,
  fall: Fall = RAIN,
  drop: Drop = FAR,
): Splash {
  const splash = splashOf(drop, fall, frameAt(seconds));
  if (!splash) {
    throw new Error(`no splash at ${seconds} s`);
  }
  return splash;
}
function groundless(seconds: number): FallMoment {
  return frameAt(seconds, { horizonAt: undefined });
}
function bounceAt(seconds: number) {
  return bounceOf(ICE, HAIL, frameAt(seconds));
}
/** Every hundredth of a second of the first second and a half, in which every drop falls at least once. */
const MOMENTS = Array.from({ length: 150 }, (_unused, i) => i / 100);
/** Every twentieth of a second over two minutes: long enough that a drift built up over time would show. */
// A jump this far sideways is a wrap round the canvas, not wind.
const WRAP_PX = 640;
const LONG_RUN = Array.from({ length: 2400 }, (_unused, i) => i / 20);

describe(splashOf, () => {
  test("地面に届く前の雨粒は、跳ねない", () => {
    expect(splashOf(FAR, RAIN, frameAt(1))).toBeUndefined();
  });

  test("遠い雨粒は、地平線に落ちたところで跳ねる", () => {
    const splash = splashAt(1.08);

    expect(splash.at).toStrictEqual([640, HORIZON]);
    expect(splash.age).toBeGreaterThan(0);
    expect(splash.age).toBeLessThan(0.3);
  });

  test("跳ねは時間とともに進み、すぐに消える", () => {
    expect(splashAt(1.15).age).toBeGreaterThan(splashAt(1.08).age);
    expect(splashOf(FAR, RAIN, frameAt(1.3))).toBeUndefined();
  });

  test("近い雨粒ほど、地平線より手前(画面の下)に、大きく跳ねる", () => {
    // A drop of this depth meets its ground, 609 px down, 0.709 s after time zero.
    const splash = splashAt(0.75, RAIN, { ...DROP, depth: 0.6 });

    expect(splash.at[1]).toBeGreaterThan(HORIZON);
    expect(splash.at[1]).toBeLessThan(800);
    expect(splash.size).toBeGreaterThan(splashAt(1.08).size);
  });

  test("いちばん近い雨粒は、画面の下の外に落ちるので跳ねを描かない", () => {
    expect(
      MOMENTS.every(
        (seconds) => splashOf(DROP, RAIN, frameAt(seconds)) === undefined,
      ),
    ).toBe(true);
  });

  test("地面のない画面では、跳ねない", () => {
    expect(
      MOMENTS.every(
        (seconds) => splashOf(FAR, RAIN, groundless(seconds)) === undefined,
      ),
    ).toBe(true);
  });

  test("風で傾いた雨は風下に落ち、跳ねは落ちた場所から動かない", () => {
    const slanted: Fall = { ...RAIN, slant: 0.5 },
      early = splashAt(1.08, slanted),
      late = splashAt(1.15, slanted);

    expect(early.at[0]).toBeGreaterThan(640);
    expect(late.at[0]).toBeCloseTo(early.at[0]);
  });

  test("地平線が曲がっていれば、落ちた場所の高さで跳ねる", () => {
    const splash = splashOf(
      { ...FAR, x: 0.25 },
      RAIN,
      frameAt(1.08, { horizonAt: (x) => 400 + x / 4 }),
    );

    expect(splash?.at).toStrictEqual([320, 480]);
  });
});

describe(makeDrops, () => {
  test("降り方が強いほど、粒を増やす", () => {
    const light = makeDrops({ ...RAIN, density: 0.35 }, AREA, sequence()),
      heavy = makeDrops(RAIN, AREA, sequence());

    expect(heavy).toHaveLength(420);
    expect(light).toHaveLength(147);
  });

  test("狭い画面では粒を減らし、広い画面でも1.5倍までにする", () => {
    expect(makeDrops(RAIN, 390 * 844, sequence())).toHaveLength(135);
    expect(makeDrops(RAIN, AREA * 4, sequence())).toHaveLength(630);
  });

  test.each([
    ["雨", "rain", 0],
    ["雪", "snow", 1],
  ] as const)("%sは全部同じ種類の粒にする", (_label, kind, share) => {
    const drops = makeDrops({ ...RAIN, kind }, AREA, sequence());

    expect(drops.filter((drop) => drop.snow).length / drops.length).toBe(share);
  });

  test("みぞれは雨と雪を混ぜる", () => {
    const drops = makeDrops({ ...RAIN, kind: "sleet" }, AREA, sequence()),
      snow = drops.filter((drop) => drop.snow).length / drops.length;

    expect(snow).toBeGreaterThan(0.25);
    expect(snow).toBeLessThan(0.55);
  });

  test("同じ乱数列なら、同じ粒になる", () => {
    expect(makeDrops(RAIN, AREA, sequence())).toStrictEqual(
      makeDrops(RAIN, AREA, sequence()),
    );
  });
});

describe(dropAt, () => {
  test("時間がたつと下へ落ちる", () => {
    const [, before] = dropAt(DROP, RAIN, frameAt(0.1)),
      [, after] = dropAt(DROP, RAIN, frameAt(0.3));

    expect(after).toBeGreaterThan(before);
  });

  test("画面の上の外から入り、下の外へ抜けて、また上へ戻る", () => {
    const heights = Array.from(
      { length: 200 },
      (_unused, i) => dropAt(DROP, RAIN, frameAt(i / 50))[1],
    );

    expect(Math.min(...heights)).toBeLessThan(0);
    expect(Math.max(...heights)).toBeGreaterThan(800);
    expect(Math.max(...heights)).toBeLessThanOrEqual(800 * 1.05);
  });

  test("雪は雨よりゆっくり落ちる", () => {
    expect(fallen(true)).toBeLessThan(fallen(false) / 5);
  });

  test("風で傾いた雨は、落ちるほど風下へずれる", () => {
    const slanted: Fall = { ...RAIN, slant: 0.5 },
      [start] = dropAt(DROP, slanted, frameAt(0)),
      [later] = dropAt(DROP, slanted, frameAt(0.4));

    expect(later).toBeGreaterThan(start);
  });

  test("横にはみ出した粒は、反対側から入り直す", () => {
    const edge: Drop = { ...DROP, x: 0.99 },
      [x] = dropAt(edge, { ...RAIN, slant: 0.7 }, frameAt(0.5));

    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1280);
  });
});

describe(flashAt, () => {
  test("明るさを0〜1に収める", () => {
    const levels = Array.from({ length: 6000 }, (_unused, i) =>
      flashAt(i / 50),
    );

    expect(Math.min(...levels)).toBe(0);
    expect(Math.max(...levels)).toBeLessThanOrEqual(1);
    expect(Math.max(...levels)).toBeGreaterThan(0.9);
  });

  test("光るのは7秒に1回までにする", () => {
    // WCAG 2.3.1 allows at most three flashes in any one second; this stays far below it.
    expect(flashesIn(120)).toBeLessThanOrEqual(Math.ceil(120 / 7));
    expect(flashesIn(120)).toBeGreaterThan(5);
  });
});

describe("氷の粒", () => {
  test("ひょうは全部の粒を氷にし、雨は氷にしない", () => {
    expect(makeDrops(HAIL, AREA, sequence()).every((drop) => drop.ice)).toBe(
      true,
    );
    expect(makeDrops(RAIN, AREA, sequence()).some((drop) => drop.ice)).toBe(
      false,
    );
  });

  test("まじりの氷は、粒の一部だけにする", () => {
    const drops = makeDrops({ ...RAIN, ice: 0.35 }, AREA, sequence()),
      share = drops.filter((drop) => drop.ice).length / drops.length;

    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.5);
  });

  test("地面に着いた氷の粒は、地面より上へ跳ね、やがて消える", () => {
    const heights = MOMENTS.map((t) => bounceAt(t + 1)?.at[1]).filter(
      (y) => y !== undefined,
    );

    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeLessThan(HORIZON);
    expect(Math.max(...heights)).toBeLessThanOrEqual(HORIZON);
    expect(bounceAt(30)).toBeUndefined();
  });
});

describe("砂", () => {
  test("砂じんは、全部の粒を砂にする", () => {
    expect(makeDrops(SAND, AREA, sequence()).every((drop) => drop.sand)).toBe(
      true,
    );
  });

  test("砂の粒は、風下へ流されながら落ちる", () => {
    const before = dropAt(GRAIN, SAND, frameAt(0.2)),
      after = dropAt(GRAIN, SAND, frameAt(0.4));

    expect(after[0]).toBeGreaterThan(before[0]);
    expect(after[1]).toBeGreaterThan(before[1]);
  });
});

describe("突風", () => {
  test("突風は、強まっては弱まる", () => {
    const levels = MOMENTS.map((t) => gustAt(t * 6));

    expect(Math.max(...levels)).toBeGreaterThan(0.2);
    expect(Math.min(...levels)).toBeLessThan(0);
  });

  test.each([
    ["雨粒", RAIN, FAR],
    ["砂の粒", SAND, GRAIN],
  ] as const)(
    "突風が弱まっても、%sは風上へ戻らない(開いてから時間が経っても)",
    (_label, fall, drop) => {
      const gusty: Fall = { ...fall, slant: 0.5, gust: 1 },
        near: Drop = { ...drop, depth: 1 },
        places = LONG_RUN.map((t) => dropAt(near, gusty, frameAt(t))),
        // A drop that starts a new fall, or wraps round the side, is not a step back.
        steps = places
          .slice(1)
          .map((after, i) => [defined(places[i]), after] as const)
          .filter(([before, after]) => after[1] >= before[1])
          .map(([before, after]) => after[0] - before[0])
          .filter((step) => Math.abs(step) <= WRAP_PX);

      expect(steps.length).toBeGreaterThan(1000);
      expect(Math.min(...steps)).toBeGreaterThanOrEqual(0);
    },
  );

  test("突風のある雨は、傾きが時刻で変わる", () => {
    const gusty: Fall = { ...RAIN, slant: 0.5, gust: 1 },
      xs = [0, 1, 2, 3].map(
        (t) => dropAt({ ...FAR, depth: 1 }, gusty, frameAt(t + 0.3))[0],
      );

    expect(new Set(xs.map((x) => Math.round(x))).size).toBeGreaterThan(1);
  });
});
