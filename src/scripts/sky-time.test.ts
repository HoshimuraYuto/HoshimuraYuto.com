import { describe, expect, test } from "vitest";

import { formatJst, formatMoonAge, formatPlace, parseAt } from "./sky-time";

describe(parseAt, () => {
  test("日本時間として読む", () => {
    expect(parseAt("?at=2026-11-20T22:00")?.toISOString()).toBe(
      "2026-11-20T13:00:00.000Z",
    );
  });

  test.each([
    ["指定なし", ""],
    ["空", "?at="],
    ["書式違い", "?at=2026/11/20 22:00"],
    ["秒つき", "?at=2026-11-20T22:00:00"],
    ["存在しない日付", "?at=2026-02-30T12:00"],
    ["24時", "?at=2026-11-20T24:00"],
    ["60分", "?at=2026-11-20T22:60"],
  ])("%sなら何も返さない", (_label, search) => {
    expect(parseAt(search)).toBeUndefined();
  });
});

describe(formatJst, () => {
  test("日本時間の日付と時刻を書く", () => {
    expect(formatJst(new Date("2026-11-20T15:05:00Z"))).toBe(
      "2026-11-21 00:05 JST",
    );
  });
});

describe(formatPlace, () => {
  test("北緯東経を書く", () => {
    expect(formatPlace(35.6586, 139.7454)).toBe("35.6586°N 139.7454°E");
  });

  test("南緯西経を書く", () => {
    expect(formatPlace(-33.8688, -70.6693)).toBe("33.8688°S 70.6693°W");
  });
});

describe(formatMoonAge, () => {
  test("小数1桁で書く", () => {
    expect(formatMoonAge(11.248)).toBe("月齢11.2");
  });
});
