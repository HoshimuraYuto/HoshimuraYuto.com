import { afterEach, describe, expect, test, vi } from "vitest";

import type { Weather, WeatherSource } from "./types";
import { weatherAt } from "./weather";

const AT = new Date("2026-11-12T03:00:00Z");
function weatherFrom(provider: string): Weather {
  return {
    time: AT,
    cloudCover: 0.5,
    layers: [],
    precipitation: undefined,
    thunder: false,
    obscuration: undefined,
    visibility: undefined,
    wind: undefined,
    origin: { kind: "observation", provider, place: "RJTT", raw: "", url: "" },
  };
}
function answering(weather?: Weather): WeatherSource {
  return {
    weatherAt: () => Promise.resolve(weather),
  };
}
const failing: WeatherSource = {
  weatherAt: () => Promise.reject(new Error("network")),
};
afterEach(() => {
  vi.useRealTimers();
});

describe(weatherAt, () => {
  test("最初に答えた入手先の天気を返し、後ろには聞かない", async () => {
    const second = {
      weatherAt: vi.fn<WeatherSource["weatherAt"]>(() =>
        Promise.resolve(weatherFrom("b")),
      ),
    };

    const weather = await weatherAt(AT, [answering(weatherFrom("a")), second]);

    expect(weather?.origin.provider).toBe("a");
    expect(second.weatherAt).not.toHaveBeenCalled();
  });

  test("前の入手先が何も持たなければ、次に聞く", async () => {
    const weather = await weatherAt(AT, [
      answering(),
      answering(weatherFrom("b")),
    ]);

    expect(weather?.origin.provider).toBe("b");
  });

  test("前の入手先が失敗しても、次に聞く", async () => {
    const weather = await weatherAt(AT, [failing, answering(weatherFrom("b"))]);

    expect(weather?.origin.provider).toBe("b");
  });

  test("どこも答えなければ何も返さない", async () => {
    await expect(
      weatherAt(AT, [failing, answering()]),
    ).resolves.toBeUndefined();
    await expect(weatherAt(AT, [])).resolves.toBeUndefined();
  });

  test("時間切れでは何も返さず、入手先には中止を伝える", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const slow: WeatherSource = {
        weatherAt: (_date, context) => {
          ({ signal } = context);
          return new Promise<undefined>(() => undefined);
        },
      },
      pending = weatherAt(AT, [slow, answering(weatherFrom("b"))], {
        timeoutMs: 1000,
      });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBeUndefined();
    expect(signal?.aborted).toBe(true);
  });

  test("答えが出たら、時間切れのタイマーを残さない", async () => {
    vi.useFakeTimers();

    await weatherAt(AT, [answering(weatherFrom("a"))]);

    expect(vi.getTimerCount()).toBe(0);
  });
});
