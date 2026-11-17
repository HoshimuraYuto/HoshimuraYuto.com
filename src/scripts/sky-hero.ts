import { skyAt } from "../lib/sky/sky";
import type { Observer, Sky } from "../lib/sky/sky";
import {
  iemMetarSource,
  jmaForecastSource,
  weatherAt,
} from "../lib/weather/weather";
import type { Weather, WeatherSource } from "../lib/weather/weather";
import { prefersReducedMotion } from "../utils/motion";
import { seededRandom } from "../utils/random";
import { moodOf, showMood } from "./critter-mood";
import { formatWeather } from "./sky-caption";
import { debugWeather } from "./sky-debug";
import { SKY_HIDDEN, SKY_SHOWN } from "./sky-dusk";
import { startFall } from "./sky-fall";
import { fitCanvas, readPalette } from "./sky-light";
import { lookFor } from "./sky-look";
import { makeGrain, paintScene } from "./sky-paint";
import { CIVIL_TWILIGHT_DEG, sceneFor } from "./sky-scene";
import { formatJst, formatMoonAge, formatPlace, parseAt } from "./sky-time";
import { setupTyping } from "./sky-typing";
import type { Typing } from "./sky-typing";

interface HeroOptions {
  now?: () => Date;
  /** Lets `?metar=` stand in for the weather, to try weather Haneda has not reported. Only the dev server turns it on. */
  debug?: boolean;
}

/** The weather on screen and when it arrived, by `performance.now()`. */
interface Arrival {
  weather: Weather;
  at: number;
}

const TOKYO: Observer = { latitude: 35.6586, longitude: 139.7454 };
/** Observed at Tokyo International Airport (Haneda), about 11 km south of the observer; the forecast for the Tokyo region stands in when no report is at hand. */
const WEATHER_SOURCES: readonly WeatherSource[] = [
  iemMetarSource({ station: "RJTT" }),
  jmaForecastSource({ office: "130000", area: "130010" }),
];
/** The sky turns a quarter of a degree a minute; redrawing once a minute keeps it true without wasted frames. */
const TICK_MS = 60_000;
/** Routine reports come every 30 minutes; asking every 10 picks a new one up soon without loading the archive. */
const WEATHER_REFRESH_MS = 600_000;
/** Time the clouds take to gather once the weather is known. */
const ARRIVAL_MS = 2400;
function captionParts(sky: Sky): Record<string, string> {
  return {
    time: formatJst(sky.date),
    place: formatPlace(sky.observer.latitude, sky.observer.longitude),
    moon: formatMoonAge(sky.moon.age),
  };
}
function writeCaption(hero: HTMLElement, parts: Record<string, string>): void {
  for (const slot of hero.querySelectorAll<HTMLElement>("[data-sky-caption]")) {
    const part = parts[slot.dataset["skyCaption"] ?? ""];
    if (part !== undefined) {
      slot.textContent = part;
    }
  }
}
/**
 * The canvas fills the window while the hero is a capped column: watching only the hero misses a width change
 * past the cap, and the old bitmap is then stretched (the moon turns into an ellipse).
 */
function resizeTarget(hero: HTMLElement): Element {
  return hero.querySelector("[data-sky-canvas]") ?? hero;
}
function sizeOf({ width, height }: DOMRectReadOnly): string {
  return `${width}x${height}`;
}

interface Hero {
  element: HTMLElement;
  canvas: HTMLCanvasElement | undefined;
  ctx: CanvasRenderingContext2D | undefined;
  weatherSlot: Typing | undefined;
  previous: HTMLCanvasElement | undefined;
  fallCanvas: HTMLCanvasElement | undefined;
  grain: ReturnType<typeof makeGrain>;
  reduced: boolean;
  moment: () => Date;
  fetchWeather: () => Promise<Weather | undefined>;
}
interface HeroState {
  frame: number;
  arrival: Arrival | undefined;
  stopFall: () => void;
  stopped: boolean;
  /** The page's veil covers the sky once you scroll past it; painting it then is wasted work. */
  hidden: boolean;
}

function makeHero(
  element: HTMLElement,
  search: string,
  { now = () => new Date(), debug = false }: HeroOptions,
): Hero {
  const canvas =
      element.querySelector<HTMLCanvasElement>("[data-sky-canvas]") ??
      undefined,
    fixed = parseAt(search),
    reduced = prefersReducedMotion(),
    weatherSlot = element.querySelector<HTMLElement>(
      '[data-sky-caption="weather"]',
    );
  function moment(): Date {
    return fixed ?? now();
  }
  return {
    element,
    canvas,
    ctx: canvas?.getContext("2d") ?? undefined,
    weatherSlot: weatherSlot
      ? setupTyping(weatherSlot, { reduced })
      : undefined,
    previous:
      element.querySelector<HTMLCanvasElement>("[data-sky-previous]") ??
      undefined,
    fallCanvas:
      element.querySelector<HTMLCanvasElement>("[data-sky-fall]") ?? undefined,
    grain: makeGrain(seededRandom(1)),
    reduced,
    moment,
    fetchWeather: async () =>
      (debug ? debugWeather(search, moment()) : undefined) ??
      (await weatherAt(moment(), WEATHER_SOURCES)),
  };
}
/** Everything on the page that follows the sky besides the picture: caption, day or night, the critters' gear. */
function markHero(hero: Hero, sky: Sky, weather: Weather | undefined): void {
  const skyIsLit = sky.sun.altitude > CIVIL_TWILIGHT_DEG,
    sunIsUp = sky.sun.altitude > 0;
  writeCaption(hero.element, captionParts(sky));
  if (weather) {
    hero.weatherSlot?.write(formatWeather(weather));
  }
  hero.element.dataset["daylight"] = skyIsLit ? "day" : "night";
  showMood(moodOf(weather, sunIsUp));
}
function paintHero(hero: Hero, { arrival }: HeroState): void {
  const date = hero.moment(),
    sky = skyAt(date, TOKYO);
  markHero(hero, sky, arrival?.weather);
  if (hero.canvas && hero.ctx) {
    const [width, height] = fitCanvas(hero.canvas, hero.ctx);
    paintScene(
      {
        ctx: hero.ctx,
        scene: sceneFor(sky, width, height),
        palette: readPalette(getComputedStyle(hero.element)),
        look: arrival && lookFor(arrival.weather, date),
        lying: arrival?.weather.ground,
      },
      hero.grain,
    );
  }
}
function fadeInOverPrevious(hero: Hero): void {
  const { canvas, previous } = hero,
    ctx = previous?.getContext("2d");
  if (hero.reduced || !canvas || !previous || !ctx) {
    return;
  }
  previous.width = canvas.width;
  previous.height = canvas.height;
  ctx.drawImage(canvas, 0, 0);
  canvas
    .animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ARRIVAL_MS,
      easing: "ease-in-out",
    })
    .addEventListener("finish", () => {
      // A zero size frees the bitmap: the copy is only needed while the fade runs.
      previous.width = 0;
    });
}
function drawFrame(hero: Hero, state: HeroState): void {
  if (!state.hidden) {
    paintHero(hero, state);
  }
}
function scheduleDraw(hero: Hero, state: HeroState): void {
  cancelAnimationFrame(state.frame);
  state.frame = requestAnimationFrame(() => {
    drawFrame(hero, state);
  });
}
function restartFall(hero: Hero, state: HeroState): void {
  state.stopFall();
  state.stopFall = () => undefined;
  const { arrival } = state;
  if (state.hidden || !arrival || !hero.fallCanvas) {
    return;
  }
  const date = hero.moment(),
    sky = skyAt(date, TOKYO),
    { width, height } = hero.fallCanvas.getBoundingClientRect(),
    scene = sceneFor(sky, width, height),
    palette = readPalette(getComputedStyle(hero.element));
  state.stopFall = startFall({
    canvas: hero.fallCanvas,
    look: lookFor(arrival.weather, date),
    horizonAt: scene.horizonAt,
    color: palette.fall,
    dustColor: palette.dust,
    brightness: 0.55 + 0.45 * scene.day,
    startedAt: arrival.at,
    reduced: hero.reduced,
    random: seededRandom(2),
  });
}
function refresh(hero: Hero, state: HeroState): void {
  restartFall(hero, state);
  scheduleDraw(hero, state);
}
/** Runs after the first sky is on screen, and a failure leaves that sky as it is. */
async function loadWeather(hero: Hero, state: HeroState): Promise<void> {
  const weather = await hero.fetchWeather();
  if (!weather && !state.arrival) {
    hero.weatherSlot?.settle();
  }
  if (
    state.stopped ||
    !weather ||
    weather.origin.raw === state.arrival?.weather.origin.raw
  ) {
    return;
  }
  state.arrival = { weather, at: performance.now() };
  fadeInOverPrevious(hero);
  refresh(hero, state);
}
/** Keeps a live sky moving: the sky turns every minute, and new reports are asked for. Returns a stop function. */
function startClock(hero: Hero, state: HeroState): () => void {
  const timer = setInterval(() => {
      scheduleDraw(hero, state);
    }, TICK_MS),
    poll = setInterval(() => void loadWeather(hero, state), WEATHER_REFRESH_MS);
  return () => {
    clearInterval(timer);
    clearInterval(poll);
  };
}
function watchHero(hero: Hero, state: HeroState): () => void {
  function onHidden(): void {
    state.hidden = true;
    cancelAnimationFrame(state.frame);
    restartFall(hero, state);
  }
  function onShown(): void {
    state.hidden = false;
    refresh(hero, state);
  }
  const target = resizeTarget(hero.element);
  let size = sizeOf(target.getBoundingClientRect());
  const observer =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(([entry]) => {
          // It also reports once on observe, with the size the first sky was already painted at.
          const next = entry ? sizeOf(entry.contentRect) : "";
          if (next !== size) {
            size = next;
            refresh(hero, state);
          }
        });
  observer?.observe(target);
  hero.element.addEventListener(SKY_HIDDEN, onHidden);
  hero.element.addEventListener(SKY_SHOWN, onShown);
  return () => {
    observer?.disconnect();
    hero.element.removeEventListener(SKY_HIDDEN, onHidden);
    hero.element.removeEventListener(SKY_SHOWN, onShown);
  };
}
function setupSkyHero(
  element: HTMLElement,
  search: string,
  options: HeroOptions = {},
): () => void {
  const hero = makeHero(element, search, options),
    state: HeroState = {
      frame: 0,
      arrival: undefined,
      stopFall: () => undefined,
      stopped: false,
      hidden: false,
    },
    // A fixed moment is a photograph: it does not move on, and its weather does not change.
    live = parseAt(search) === undefined,
    stopClock = live ? startClock(hero, state) : () => undefined,
    stopWatching = watchHero(hero, state);
  drawFrame(hero, state);
  void loadWeather(hero, state);
  return () => {
    state.stopped = true;
    stopClock();
    stopWatching();
    cancelAnimationFrame(state.frame);
    state.stopFall();
    hero.weatherSlot?.stop();
  };
}

export { setupSkyHero, TOKYO };
