import { screen } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GLITCH_COMPLETE, setupGlitchHunt } from "./glitch";

describe(setupGlitchHunt, () => {
  const onComplete = vi.fn<() => void>();

  beforeEach(() => {
    onComplete.mockReset();
    document.body.innerHTML = `
      <button type="button" data-glitch aria-describedby="hint">Engineer</button>
      <button type="button" data-glitch aria-describedby="hint">Uses</button>
      <p id="hint" hidden>ずれている。押すと直る</p>
      <p role="status"><span data-glitch-count></span><span data-glitch-message></span></p>`;
    document.body.addEventListener(GLITCH_COMPLETE, onComplete, { once: true });
    setupGlitchHunt(document, screen.getByRole("status"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("ずれた箇所を押すと直り、残りの数を知らせる", () => {
    const glitch = screen.getByRole("button", { name: "Engineer" });
    glitch.click();

    expect(glitch).toHaveAttribute("data-fixed");
    expect(glitch).not.toHaveAccessibleDescription();
    expect(screen.getByRole("status")).toHaveTextContent("1/2あと1つ");
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("直した箇所をもう一度押しても、数は変わらない", () => {
    const glitch = screen.getByRole("button", { name: "Engineer" });
    glitch.click();
    glitch.click();

    expect(screen.getByRole("status")).toHaveTextContent("1/2あと1つ");
  });

  test("全部直すと、お礼を知らせて完了を通知する", () => {
    screen.getByRole("button", { name: "Engineer" }).click();
    screen.getByRole("button", { name: "Uses" }).click();

    expect(screen.getByRole("status")).toHaveTextContent("2/2ぜんぶ直った");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("知らせは、しばらくすると消える", () => {
    vi.useFakeTimers();
    screen.getByRole("button", { name: "Engineer" }).click();
    expect(screen.getByRole("status")).toHaveAttribute("data-visible");

    vi.advanceTimersByTime(6000);

    expect(screen.getByRole("status")).not.toHaveAttribute("data-visible");
  });
});
