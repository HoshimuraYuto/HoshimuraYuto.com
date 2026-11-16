import { screen } from "@testing-library/dom";
import { describe, expect, test } from "vitest";

import { defined } from "../test/defined";
import { activityState, agoWords, setupActivity } from "./activity";

const LAST = "2026-11-13T12:00:00+09:00";
function hoursAfter(hours: number): Date {
  return new Date(Date.parse(LAST) + hours * 3_600_000);
}

describe(activityState, () => {
  test.each([
    [0.5, "working"],
    [2.9, "working"],
    [3, "recent"],
    [23, "recent"],
    [24 * 6, "recent"],
    [24 * 7, "quiet"],
  ] as const)("最後のcommitから%f時間後は %s", (hours, state) => {
    expect(activityState(LAST, hoursAfter(hours))).toBe(state);
  });
});

describe(agoWords, () => {
  test.each([
    [0.5, "1時間以内"],
    [5, "5時間前"],
    [50, "2日前"],
  ] as const)("%f時間後は「%s」", (hours, words) => {
    expect(agoWords(LAST, hoursAfter(hours))).toBe(words);
  });
});

describe(setupActivity, () => {
  test("今の時刻から状態と経過を書き込む", () => {
    document.body.innerHTML = `
      <p data-activity data-last-at="${LAST}">
        <span data-activity-label></span><span data-activity-ago></span>
      </p>`;
    const root = defined(
      document.querySelector<HTMLElement>("[data-activity]"),
      "the activity",
    );

    setupActivity(root, () => hoursAfter(1));

    expect(root.dataset["state"]).toBe("working");
    expect(screen.getByText("いま作業中")).toBeInTheDocument();
    expect(screen.getByText("1時間前")).toBeInTheDocument();
  });
});
