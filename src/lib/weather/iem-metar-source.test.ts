import { describe, expect, test, vi } from "vitest";

import rain from "./fixtures/iem-rjtt-2026-10-24.csv?raw";
import { iemMetarSource } from "./iem-metar-source";
import type { WeatherContext } from "./types";

const NOW = new Date("2026-11-12T10:00:00Z");
function contextWith(
  body: string,
  status = 200,
): WeatherContext & { fetch: ReturnType<typeof vi.fn> } {
  return {
    fetch: vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(body, { status })),
    ),
    signal: new AbortController().signal,
    now: NOW,
  };
}
const source = iemMetarSource({ station: "RJTT" });

describe(iemMetarSource, () => {
  test("指定した日時以前で最も新しい報を、その時刻の観測として返す", async () => {
    const weather = await source.weatherAt(
      new Date("2026-10-24T04:10:00Z"),
      contextWith(rain),
    );

    expect(weather?.time).toStrictEqual(new Date("2026-10-24T04:00:00Z"));
    expect(weather?.precipitation).toStrictEqual({
      kind: "rain",
      intensity: "moderate",
    });
    expect(weather?.origin).toMatchObject({
      kind: "observation",
      provider: "iem-metar",
      place: "RJTT",
      raw: "RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022 TEMPO FEW005 BKN008",
    });
  });

  test("報の時刻ちょうどなら、その報を返す", async () => {
    const weather = await source.weatherAt(
      new Date("2026-10-24T04:30:00Z"),
      contextWith(rain),
    );

    expect(weather?.time).toStrictEqual(new Date("2026-10-24T04:30:00Z"));
  });

  test("2時間前から当日までの範囲を、UTCで問い合わせる", async () => {
    const context = contextWith(rain);

    await source.weatherAt(new Date("2026-10-24T01:00:00Z"), context);

    const url = new URL(String(context.fetch.mock.calls[0]?.[0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py",
    );
    expect(Object.fromEntries(url.searchParams)).toStrictEqual({
      station: "RJTT",
      data: "metar",
      year1: "2026",
      month1: "10",
      day1: "23",
      year2: "2026",
      month2: "10",
      day2: "25",
      tz: "UTC",
      format: "onlycomma",
    });
  });

  test("地面の様子を読むために、6時間前が入る日から問い合わせる", async () => {
    const context = contextWith(rain);

    // Six hours before 04:00Z is the day before; two hours before is not.
    await source.weatherAt(new Date("2026-10-24T04:00:00Z"), context);

    const url = new URL(String(context.fetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get("day1")).toBe("23");
    expect(url.searchParams.get("day2")).toBe("25");
    expect(context.fetch).toHaveBeenCalledTimes(1);
  });

  test("同じ応答の、直前の数時間の報から、地面の様子を添える", async () => {
    // Light rain is reported from 00:00Z on, so by 04:10Z the ground is soaked.
    const weather = await source.weatherAt(
      new Date("2026-10-24T04:10:00Z"),
      contextWith(rain),
    );

    expect(weather?.ground).toStrictEqual({ wet: 1, snow: 0 });
  });

  test("降り始めたばかりなら、地面はまだ少ししか濡れていない", async () => {
    // The fixture's first report, light rain, is at 00:00Z.
    const weather = await source.weatherAt(
      new Date("2026-10-24T00:15:00Z"),
      contextWith(rain),
    );

    expect(weather?.ground?.wet).toBeCloseTo(0.2);
  });

  test("2時間以内に報がなければ何も返さない", async () => {
    // The fixture starts at 2026-10-24 00:00Z, so nothing in it is within two hours before 2026-10-23 21:00Z.
    const weather = await source.weatherAt(
      new Date("2026-10-23T21:00:00Z"),
      contextWith(rain),
    );

    expect(weather).toBeUndefined();
  });

  test("まだ来ていない日時は、問い合わせずに何も返さない", async () => {
    const context = contextWith(rain);

    const weather = await source.weatherAt(
      new Date("2026-11-13T00:00:00Z"),
      context,
    );

    expect(weather).toBeUndefined();
    expect(context.fetch).not.toHaveBeenCalled();
  });

  test.each([
    ["失敗の応答", rain, 422],
    ["表でない応答", "Invalid times provided.", 200],
    ["見出しだけの応答", "station,valid,metar\n", 200],
    ["別の地点の応答", rain.replaceAll("RJTT", "RJAA"), 200],
  ])("%sは何も返さない", async (_label, body, status) => {
    const weather = await source.weatherAt(
      new Date("2026-10-24T04:10:00Z"),
      contextWith(body, status),
    );

    expect(weather).toBeUndefined();
  });

  test("読めない報は飛ばし、その前の報を返す", async () => {
    const body = rain.replace(
      "RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022 TEMPO FEW005 BKN008",
      "RJTT 240400Z NIL",
    );

    const weather = await source.weatherAt(
      new Date("2026-10-24T04:10:00Z"),
      contextWith(body),
    );

    expect(weather?.time).toStrictEqual(new Date("2026-10-24T03:30:00Z"));
  });
});
