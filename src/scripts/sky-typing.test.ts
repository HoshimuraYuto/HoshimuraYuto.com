import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { setupTyping } from "./sky-typing";

function slot(): HTMLElement {
  document.body.innerHTML = "<span data-typing></span>";
  const element = document.querySelector("span");
  if (!element) {
    throw new Error("no slot");
  }
  return element;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe(setupTyping, () => {
  test("一文字ずつ打ち込み、打ち終えたらキャレットの印を外す", () => {
    const element = slot(),
      typing = setupTyping(element, { reduced: false });

    typing.write("雨 RJTT");
    vi.advanceTimersByTime(30 * 2);
    expect(element).toHaveTextContent("雨");
    expect(element).toHaveAttribute("data-typing");

    vi.advanceTimersByTime(30 * 10);
    expect(element).toHaveTextContent("雨 RJTT");
    expect(element).not.toHaveAttribute("data-typing");
  });

  test("前の文の続きでなければ、初めから打ち直す", () => {
    const element = slot(),
      typing = setupTyping(element, { reduced: false });
    typing.write("雨");
    vi.advanceTimersByTime(300);

    typing.write("雪");
    vi.advanceTimersByTime(300);

    expect(element.textContent).toBe("雪");
  });

  test("動きを減らす設定では、すぐに全文を出す", () => {
    const element = slot();

    setupTyping(element, { reduced: true }).write("雨 RJTT");

    expect(element.textContent).toBe("雨 RJTT");
    expect(element).not.toHaveAttribute("data-typing");
  });

  test("何も届かないと分かったら、キャレットの印を外す", () => {
    const element = slot();

    setupTyping(element, { reduced: false }).settle();

    expect(element).not.toHaveAttribute("data-typing");
  });
});
