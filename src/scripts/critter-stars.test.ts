import { describe, expect, test } from "vitest";

import { dropsStar, starTop } from "./critter-stars";

describe(starTop, () => {
  test("押した所から落ち始め、だんだん速くなる", () => {
    expect(starTop(100, 0, 800)).toBe(100);
    expect(starTop(100, 0.2, 800) - starTop(100, 0.1, 800)).toBeGreaterThan(
      starTop(100, 0.1, 800) - 100,
    );
  });

  test("画面の下で止まる", () => {
    expect(starTop(100, 10, 800)).toBe(800);
  });
});

describe(dropsStar, () => {
  test("空そのものを押すと星が落ちる", () => {
    document.body.innerHTML = "<section><h1>name</h1></section>";
    expect(dropsStar(document.querySelector("h1"))).toBe(true);
  });

  test("リンクやボタン、キャラクターを押したときは落ちない", () => {
    document.body.innerHTML =
      '<a href="#log"><span>tail</span></a><button type="button">b</button><div class="critter"><i></i></div>';
    for (const selector of ["span", "button", ".critter i"]) {
      expect(dropsStar(document.querySelector(selector))).toBe(false);
    }
  });
});
