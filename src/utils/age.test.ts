import { describe, expect, test } from "vitest";

import { daysBetween } from "./age";

describe(daysBetween, () => {
  test("日付の差を日数で返す", () => {
    expect(daysBetween("2023-03-08", new Date("2023-03-19T00:00:00Z"))).toBe(
      11,
    );
  });

  test("未来の日付は0日として扱う", () => {
    expect(daysBetween("2026-11-12", new Date("2026-11-11T00:00:00Z"))).toBe(0);
  });
});
