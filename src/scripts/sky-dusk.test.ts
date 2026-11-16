import { describe, expect, test } from "vitest";

import { duskShare, setupSkyDusk, SKY_HIDDEN, SKY_SHOWN } from "./sky-dusk";

describe(duskShare, () => {
  test("一番上ではまだ暮れていない", () => {
    expect(duskShare(0, 800)).toBe(0);
  });

  test("画面の4割まで進むと暮れきり、それより先も暮れたまま", () => {
    expect(duskShare(800 * 0.4, 800)).toBe(1);
    expect(duskShare(5000, 800)).toBe(1);
  });

  test("画面の高さが0でも壊れない", () => {
    expect(duskShare(100, 0)).toBe(0);
  });
});

describe(setupSkyDusk, () => {
  test("暮れきったら空に隠れたと知らせ、戻ったら見えたと知らせる", async () => {
    const veil = document.createElement("div"),
      hero = document.createElement("section"),
      events: string[] = [];
    hero.addEventListener(SKY_HIDDEN, () => events.push("hidden"));
    hero.addEventListener(SKY_SHOWN, () => events.push("shown"));
    const stop = setupSkyDusk(veil, hero);

    expect(Number(veil.style.opacity)).toBe(0);

    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: innerHeight * 2,
    });
    dispatchEvent(new Event("scroll"));
    await new Promise(requestAnimationFrame);

    expect(Number(veil.style.opacity)).toBe(1);

    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 0,
    });
    dispatchEvent(new Event("scroll"));
    await new Promise(requestAnimationFrame);
    stop();

    expect(events).toStrictEqual(["hidden", "shown"]);
  });
});
