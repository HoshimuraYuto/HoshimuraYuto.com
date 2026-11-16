import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { weatherAt } from "../lib/weather/weather";
import type { Weather } from "../lib/weather/weather";
import { SKY_HIDDEN, SKY_SHOWN } from "./sky-dusk";
import { setupSkyHero } from "./sky-hero";

vi.mock(import("../lib/weather/weather"), async (importOriginal) => ({
  ...(await importOriginal()),
  weatherAt: vi.fn<typeof weatherAt>(),
}));

async function nothing(): Promise<undefined> {
  await Promise.resolve();
}
const RAIN: Weather = {
  time: new Date("2026-10-24T04:00:00Z"),
  cloudCover: 6 / 8,
  layers: [
    {
      amount: "broken",
      oktas: [5, 7],
      cover: 6 / 8,
      baseFeet: 3000,
      convective: false,
    },
  ],
  precipitation: { kind: "rain", intensity: "moderate" },
  thunder: false,
  obscuration: "mist",
  visibility: 4000,
  wind: { direction: 340, speed: 2 },
  origin: {
    kind: "observation",
    provider: "iem-metar",
    place: "RJTT",
    raw: "RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022",
    url: "",
  },
};
function renderHero(): HTMLElement {
  document.body.innerHTML = `
    <section>
      <p>
        <span data-sky-caption="time"></span>
        <span data-sky-caption="place"></span>
        <span data-sky-caption="moon"></span>
        <span data-sky-caption="weather"></span>
      </p>
    </section>`;
  const hero = document.querySelector("section");
  if (!hero) {
    throw new Error("no hero");
  }
  return hero;
}
function weatherSlot(hero: HTMLElement): Element | null {
  return hero.querySelector('[data-sky-caption="weather"]');
}

beforeEach(() => {
  vi.mocked(weatherAt).mockReturnValue(nothing());
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(weatherAt).mockReset();
  document.body.innerHTML = "";
});

describe(setupSkyHero, () => {
  test("?atの日時で撮影情報を書く", () => {
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-11-20T22:00");

    expect(hero).toHaveTextContent("2026-11-20 22:00 JST");
    expect(hero).toHaveTextContent("35.6586°N 139.7454°E");
    expect(hero).toHaveTextContent(/月齢\d+\.\d/u);
  });

  test("?atが不正なら現在の日時に戻す", () => {
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-02-30T12:00", {
      now: () => new Date("2026-11-12T03:00:00Z"),
    });

    expect(hero).toHaveTextContent("2026-11-12 12:00 JST");
  });

  test("昼か夜かを印す", () => {
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-11-12T12:00");
    expect(hero.dataset["daylight"]).toBe("day");

    setupSkyHero(hero, "?at=2026-11-20T22:00");
    expect(hero.dataset["daylight"]).toBe("night");
  });

  test("日時の指定がなければ1分ごとに描き直し、止める関数で止まる", () => {
    vi.useFakeTimers({ now: new Date("2026-11-12T03:00:00Z") });
    const hero = renderHero(),
      stop = setupSkyHero(hero, "");

    expect(hero).toHaveTextContent("2026-11-12 12:00 JST");
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    stop();

    expect(vi.getTimerCount()).toBe(0);
  });

  test("日時を指定したら描き直さない", () => {
    vi.useFakeTimers();
    setupSkyHero(renderHero(), "?at=2026-11-20T22:00");

    expect(vi.getTimerCount()).toBe(0);
  });

  test("天気を待たずに、最初の撮影情報を書く", () => {
    vi.mocked(weatherAt).mockReturnValue(
      new Promise<undefined>(() => undefined),
    );
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-10-24T13:00");

    expect(hero).toHaveTextContent("2026-10-24 13:00 JST");
    expect(weatherSlot(hero)).toBeEmptyDOMElement();
  });

  test("?atの日時の天気を尋ね、届いたら撮影情報に足す", async () => {
    vi.mocked(weatherAt).mockResolvedValue(RAIN);
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-10-24T13:00");

    await vi.waitFor(() => {
      expect(weatherSlot(hero)).toHaveTextContent(
        "雲量5–7/8 雨 もや RJTT 240400Z",
      );
    });
    expect(vi.mocked(weatherAt).mock.calls[0]?.[0]).toStrictEqual(
      new Date("2026-10-24T04:00:00Z"),
    );
  });

  test("天気が取れなければ、天気なしの撮影情報のままにする", async () => {
    const hero = renderHero();

    setupSkyHero(hero, "?at=2026-10-24T13:00");
    await vi.waitFor(() => {
      expect(weatherAt).toHaveBeenCalledTimes(1);
    });

    expect(hero).toHaveTextContent("2026-10-24 13:00 JST");
    expect(weatherSlot(hero)).toBeEmptyDOMElement();
  });

  test("止めた後に届いた天気は書かない", async () => {
    const { promise, resolve } = Promise.withResolvers<Weather | undefined>();
    vi.mocked(weatherAt).mockReturnValue(promise);
    const hero = renderHero(),
      stop = setupSkyHero(hero, "?at=2026-10-24T13:00");

    stop();
    resolve(RAIN);
    await promise;

    expect(weatherSlot(hero)).toBeEmptyDOMElement();
  });

  test("空が隠れている間は描き直さず、見えたら今の日時で描き直す", () => {
    vi.useFakeTimers({ now: new Date("2026-11-12T03:00:00Z") });
    const hero = renderHero(),
      stop = setupSkyHero(hero, "");

    hero.dispatchEvent(new Event(SKY_HIDDEN));
    vi.setSystemTime(new Date("2026-11-12T03:05:00Z"));
    vi.advanceTimersByTime(60_000);

    expect(hero).toHaveTextContent("2026-11-12 12:00 JST");

    hero.dispatchEvent(new Event(SKY_SHOWN));
    vi.advanceTimersToNextFrame();

    expect(hero).toHaveTextContent("2026-11-12 12:06 JST");
    stop();
  });

  test("日時の指定がなければ、10分ごとに天気を尋ね直す", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-12T03:00:00Z") });
    const stop = setupSkyHero(renderHero(), "");

    await vi.advanceTimersByTimeAsync(600_000);

    expect(weatherAt).toHaveBeenCalledTimes(2);
    stop();
  });
});
