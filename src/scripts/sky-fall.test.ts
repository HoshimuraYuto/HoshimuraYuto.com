import { afterEach, describe, expect, test, vi } from "vitest";

import { fakeContext, stubCanvases } from "./sky-canvas.test-helper";
import { startFall } from "./sky-fall";
import type { FallStage } from "./sky-fall";
import { flashAt } from "./sky-fall-motion";
import type { Fall, WeatherLook } from "./sky-look";

const RAIN: Fall = { kind: "rain", density: 1, slant: 0 };
function sequence(): () => number {
  let n = 0;
  return () => {
    n += 1;
    return (n * 0.61803398875) % 1;
  };
}

const WHITE = [255, 255, 255] as const;
const FALLING = { sheets: [], gloom: 0, veil: 0, thunder: false };
function stageFor(look: WeatherLook, part: Partial<FallStage> = {}) {
  const fake = fakeContext(),
    request = vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(7),
    cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
  stubCanvases(fake.ctx, [1280, 800]);
  return {
    ...fake,
    request,
    cancel,
    stage: {
      canvas: document.createElement("canvas"),
      look,
      color: WHITE,
      dustColor: WHITE,
      /** Ground far below the canvas, so no drop lands in view. */
      horizonAt: () => 10_000,
      brightness: 1,
      startedAt: 0,
      reduced: false,
      random: sequence(),
      ...part,
    },
  };
}
function momentWhen(lit: boolean): number {
  for (let t = 0; t < 120; t += 0.05) {
    if (flashAt(t) > 0.5 === lit && (lit || flashAt(t) === 0)) {
      return t;
    }
  }
  throw new Error("no such moment");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(startFall, () => {
  test("地面があれば、落ちた雨粒は筋をやめて、にじむ光として跳ねる", () => {
    const { stage, spies } = stageFor(
      { ...FALLING, fall: RAIN },
      { horizonAt: () => 512 },
    );

    startFall(stage);

    const splashes = spies.createRadialGradient.mock.calls.length,
      // Every stroke that does not start a streak's gradient is the rebound of one splash.
      streaks = spies.createLinearGradient.mock.calls.length;
    expect(splashes).toBeGreaterThan(0);
    expect(streaks).toBeLessThan(420);
    expect(spies.stroke).toHaveBeenCalledTimes(streaks + splashes);
    // The splash is laid flat on the ground: squeezed to 0.3 of its width in height.
    expect(spies.scale).toHaveBeenCalledWith(1, 0.3);
    expect(spies.scale).toHaveBeenCalledTimes(splashes);
  });

  test("ごく弱い霧雨は、地面を光らせるだけで、しぶきを上げない", () => {
    const drizzle: Fall = { kind: "rain", density: 0.21, slant: 0 },
      { stage, spies } = stageFor(
        { ...FALLING, fall: drizzle },
        { horizonAt: () => 512 },
      );

    startFall(stage);

    expect(spies.createRadialGradient.mock.calls.length).toBeGreaterThan(0);
    expect(spies.stroke).toHaveBeenCalledTimes(
      spies.createLinearGradient.mock.calls.length,
    );
  });

  test("地面があっても、雪は跳ねない", () => {
    const { stage, spies } = stageFor(
      { ...FALLING, fall: { ...RAIN, kind: "snow" } },
      { horizonAt: () => 512 },
    );

    startFall(stage);

    expect(spies.createRadialGradient).toHaveBeenCalledTimes(420);
    expect(spies.scale).not.toHaveBeenCalled();
  });

  test("止めると、予約を取り消して画面を消す", () => {
    const { stage, spies, cancel } = stageFor({ ...FALLING, fall: RAIN }),
      stop = startFall(stage);
    spies.clearRect.mockClear();

    stop();

    expect(cancel).toHaveBeenCalledWith(7);
    expect(spies.clearRect).toHaveBeenCalledWith(0, 0, 1280, 800);
  });

  test("動きを減らす設定では、1コマだけ描いて動かさない", () => {
    const { stage, spies, request } = stageFor(
      { ...FALLING, fall: RAIN },
      { reduced: true },
    );

    startFall(stage);

    expect(spies.stroke).toHaveBeenCalledTimes(420);
    expect(request).not.toHaveBeenCalled();
  });

  test("降るものも雷もなければ、何も描かず何も予約しない", () => {
    const { stage, spies, request } = stageFor({ ...FALLING, fall: undefined });

    startFall(stage);

    expect(spies.clearRect).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test("雷は、光る時刻にだけ空を鈍く明るくする", () => {
    const { stage, spies, request } = stageFor({
      ...FALLING,
      fall: undefined,
      thunder: true,
    });
    startFall(stage);
    const nextFrame = request.mock.calls[0]?.[0];
    spies.createRadialGradient.mockClear();

    nextFrame?.(momentWhen(false) * 1000);
    expect(spies.createRadialGradient).not.toHaveBeenCalled();

    nextFrame?.(momentWhen(true) * 1000);
    expect(spies.createRadialGradient).toHaveBeenCalledTimes(1);
  });

  test("動きを減らす設定では、雷を光らせない", () => {
    const { stage, spies } = stageFor(
      { ...FALLING, fall: undefined, thunder: true },
      { reduced: true, startedAt: momentWhen(true) * 1000 },
    );

    startFall(stage);

    expect(spies.createRadialGradient).not.toHaveBeenCalled();
  });
});
