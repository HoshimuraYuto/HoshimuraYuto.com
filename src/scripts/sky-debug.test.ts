import { describe, expect, test } from "vitest";

import { defined } from "../test/defined";
import { debugWeather, sampleHref, WEATHER_SAMPLES } from "./sky-debug";

const AT = new Date("2026-06-01T06:00:00Z");
const MADE = WEATHER_SAMPLES.find(
  (sample): sample is (typeof WEATHER_SAMPLES)[number] & { metar: string } =>
    typeof sample.metar === "string",
);

describe(debugWeather, () => {
  test("?metar=の作例を、その日時の天気にする", () => {
    const weather = debugWeather(
      "?at=2026-06-01T15:00&metar=RJTT 010600Z 25012G28KT 5000 +TSGRRA FEW020CB BKN030 22/18 Q1004",
      AT,
    );

    expect(weather?.precipitation?.kind).toBe("hail");
    expect(weather?.time).toStrictEqual(AT);
    expect(weather?.origin.provider).toBe("debug");
  });

  test.each([
    ["指定がない", "?at=2026-06-01T15:00"],
    ["読めない", "?metar=hello"],
  ])("作例が%sときは何も返さず、本物の天気に任せる", (_label, search) => {
    expect(debugWeather(search, AT)).toBeUndefined();
  });
});

describe("作例の一覧", () => {
  test("作例のリンクは、日時と報を両方持つ", () => {
    const made = defined(MADE),
      params = new URLSearchParams(sampleHref(made));

    expect(params.get("at")).toBe(made.at);
    expect(params.get("metar")).toBe(made.metar);
  });
});
