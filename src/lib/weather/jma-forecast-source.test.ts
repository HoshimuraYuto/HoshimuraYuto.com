import { describe, expect, test, vi } from "vitest";

import forecast from "./fixtures/jma-forecast-130000.txt?raw";
import { jmaForecastSource } from "./jma-forecast-source";
import type { WeatherContext } from "./types";

function contextWith(
  body: string,
  status = 200,
): WeatherContext & { fetch: ReturnType<typeof vi.fn> } {
  return {
    fetch: vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(body, { status })),
    ),
    signal: new AbortController().signal,
    now: new Date("2026-11-12T10:00:00Z"),
  };
}
const tokyo = jmaForecastSource({ office: "130000", area: "130010" });
function withCode(code: string): string {
  return forecast.replace('"weatherCodes":["100"', `"weatherCodes":["${code}"`);
}

// The fixture was issued at 2026-11-12T17:00+09:00 for 東京地方: 100 晴れ from 11-12 17:00,
// 211 くもり 昼前 から 晴れ from 11-13 00:00, 111 晴れ 後 くもり from 11-14 00:00.
describe(jmaForecastSource, () => {
  test("日時が入る期間の予報を返す", async () => {
    const weather = await tokyo.weatherAt(
      new Date("2026-11-12T18:00:00+09:00"),
      contextWith(forecast),
    );

    expect(weather).toStrictEqual({
      time: new Date("2026-11-12T17:00:00+09:00"),
      cloudCover: 0.2,
      layers: [],
      precipitation: undefined,
      thunder: false,
      obscuration: undefined,
      visibility: undefined,
      wind: undefined,
      origin: {
        kind: "forecast",
        provider: "jma-forecast",
        place: "130010",
        raw: "100 晴れ",
        url: "https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json",
      },
    });
  });

  test("次の期間は、その期間のコードで返す", async () => {
    const weather = await tokyo.weatherAt(
      new Date("2026-11-13T12:00:00+09:00"),
      contextWith(forecast),
    );

    expect(weather?.cloudCover).toBe(0.85);
    expect(weather?.origin.raw).toBe("211 くもり　昼前　から　晴れ");
  });

  test.each([
    ["発表より前", "2026-11-12T16:59:00+09:00"],
    ["最後の期間より後", "2026-11-15T00:00:00+09:00"],
  ])("%sの日時は何も返さない", async (_label, at) => {
    await expect(
      tokyo.weatherAt(new Date(at), contextWith(forecast)),
    ).resolves.toBeUndefined();
  });

  test.each([
    ["雨", "300", { kind: "rain", intensity: "moderate" }],
    ["大雨", "306", { kind: "rain", intensity: "heavy" }],
    ["雪", "400", { kind: "snow", intensity: "moderate" }],
    ["雪か雨", "340", { kind: "snow", intensity: "moderate" }],
  ])("%sのコードを降るものにする", async (_label, code, precipitation) => {
    const weather = await tokyo.weatherAt(
      new Date("2026-11-12T18:00:00+09:00"),
      contextWith(withCode(code)),
    );

    expect(weather?.precipitation).toStrictEqual(precipitation);
    expect(weather?.cloudCover).toBe(1);
  });

  test("霧と雷のコードを読む", async () => {
    const at = new Date("2026-11-12T18:00:00+09:00"),
      fog = await tokyo.weatherAt(at, contextWith(withCode("209"))),
      thunder = await tokyo.weatherAt(at, contextWith(withCode("350")));

    expect(fog?.obscuration).toBe("fog");
    expect(thunder?.thunder).toBe(true);
  });

  test.each([
    ["失敗の応答", forecast, 500],
    ["形の違う応答", "{}", 200],
    ["空の配列", "[]", 200],
    ["地域のない応答", forecast.replaceAll("130010", "999999"), 200],
    ["知らない形のコード", withCode("9x"), 200],
    ["知らない分類のコード", withCode("900"), 200],
  ])("%sは何も返さない", async (_label, body, status) => {
    const weather = await tokyo.weatherAt(
      new Date("2026-11-12T18:00:00+09:00"),
      contextWith(body, status),
    );

    expect(weather).toBeUndefined();
  });
});
