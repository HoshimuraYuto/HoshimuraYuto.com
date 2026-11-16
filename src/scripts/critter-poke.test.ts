import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { pokeReply, setupPoke } from "./critter-poke";

function getCritter(): HTMLElement {
  const critter = document.querySelector<HTMLElement>(".critter");
  if (!critter) {
    throw new Error("critter was not rendered");
  }
  return critter;
}

describe(pokeReply, () => {
  test("続けてつつくほど返事が変わる", () => {
    expect([0, 1, 2, 3].map((n) => pokeReply(n).text)).toStrictEqual([
      "!",
      "なに?",
      "くすぐったい",
      "…",
    ]);
  });

  test("5回目で怒って逃げる", () => {
    expect(pokeReply(4)).toStrictEqual({ text: "もう!", flee: true });
  });

  test("眠っているときは寝言だけで、逃げない", () => {
    expect(pokeReply(4, true)).toStrictEqual({ text: "zz…", flee: false });
  });
});

describe(setupPoke, () => {
  let react: ReturnType<typeof vi.fn<(flee: boolean) => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div class="critter"><span class="critter__say" hidden></span></div>';
    react = vi.fn<(flee: boolean) => void>();
    setupPoke(getCritter(), { asleep: () => false, react });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("つつくと返事が出て、しばらくすると消える", () => {
    getCritter().click();
    const bubble = getCritter().querySelector(".critter__say");

    expect(bubble).toBeVisible();
    expect(bubble).toHaveTextContent("!");

    vi.advanceTimersByTime(1500);

    expect(bubble).not.toBeVisible();
  });

  test("5回続けてつつくと逃げる合図を出し、次はまた最初の返事から", () => {
    for (let i = 0; i < 5; i += 1) {
      getCritter().click();
    }

    expect(react).toHaveBeenLastCalledWith(true);

    getCritter().click();

    expect(getCritter().querySelector(".critter__say")).toHaveTextContent("!");
  });

  test("間が空くと、また最初の返事から", () => {
    getCritter().click();
    vi.advanceTimersByTime(3000);
    getCritter().click();

    expect(getCritter().querySelector(".critter__say")).toHaveTextContent("!");
  });
});
