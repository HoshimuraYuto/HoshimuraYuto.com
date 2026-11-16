import type { Ground } from "../lib/weather/weather";
import { clamp } from "../utils/math";
import type { WeatherLook } from "./sky-look";
import type { Scene } from "./sky-scene";

type Rgb = readonly [number, number, number];

/** Colours read from CSS custom properties on the hero, so the palette lives in the stylesheet. */
interface Palette {
  nightTop: Rgb;
  nightLow: Rgb;
  dayTop: Rgb;
  dayLow: Rgb;
  duskLow: Rgb;
  ground: Rgb;
  sun: Rgb;
  sunLow: Rgb;
  moon: Rgb;
  starBlue: Rgb;
  starWhite: Rgb;
  starRed: Rgb;
  cloudDay: Rgb;
  cloudShade: Rgb;
  cloudNight: Rgb;
  cloudNightLow: Rgb;
  veilDay: Rgb;
  veilNight: Rgb;
  snowDay: Rgb;
  snowNight: Rgb;
  fall: Rgb;
  dust: Rgb;
}

/** What every paint step needs. `look` is undefined while there is no weather to draw. */
interface Painter {
  ctx: CanvasRenderingContext2D;
  scene: Scene;
  palette: Palette;
  look: WeatherLook | undefined;
  lying?: Ground | undefined;
}

interface Light {
  at: readonly [number, number];
  radius: number;
  color: Rgb;
  alpha: number;
}

/** Device pixels per CSS px are capped here: past 2x the sky's soft gradients look no sharper and cost 4x the pixels. */
const MAX_PIXEL_RATIO = 2;
/** A glow this faint changes no 8-bit pixel, so it is skipped. */
const INVISIBLE_ALPHA = 0.004;

function mix(a: Rgb, b: Rgb, k: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
}
function rgba(c: Rgb, alpha = 1): string {
  return `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])} / ${clamp(alpha, 0, 1).toFixed(3)})`;
}
function parseRgb(text: string): Rgb {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(text.trim());
  if (!hex) {
    return [0, 0, 0];
  }
  const [, r = "0", g = "0", b = "0"] = hex;
  return [
    Number.parseInt(r, 16),
    Number.parseInt(g, 16),
    Number.parseInt(b, 16),
  ];
}
function readPalette(style: CSSStyleDeclaration): Palette {
  function read(name: string): Rgb {
    return parseRgb(style.getPropertyValue(`--sky-${name}`));
  }
  return {
    nightTop: read("night-top"),
    nightLow: read("night-low"),
    dayTop: read("day-top"),
    dayLow: read("day-low"),
    duskLow: read("dusk-low"),
    ground: read("ground"),
    sun: read("sun"),
    sunLow: read("sun-low"),
    moon: read("moon"),
    starBlue: read("star-blue"),
    starWhite: read("star-white"),
    starRed: read("star-red"),
    cloudDay: read("cloud-day"),
    cloudShade: read("cloud-shade"),
    cloudNight: read("cloud-night"),
    cloudNightLow: read("cloud-night-low"),
    veilDay: read("veil-day"),
    veilNight: read("veil-night"),
    snowDay: read("snow-day"),
    snowNight: read("snow-night"),
    fall: read("fall"),
    dust: read("dust"),
  };
}
function glow(
  ctx: CanvasRenderingContext2D,
  { at, radius, color, alpha }: Light,
): void {
  if (alpha <= INVISIBLE_ALPHA || radius <= 0) {
    return;
  }
  const g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.4, rgba(color, alpha * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(at[0] - radius, at[1] - radius, radius * 2, radius * 2);
}
/** Device pixels per CSS px on a canvas set up by fitCanvas, for effects (shadowBlur) that ignore the transform. */
function deviceScale(ctx: CanvasRenderingContext2D): number {
  return ctx.getTransform().a;
}
/** Matches the canvas to its box at the device's pixel ratio, so drawing is in CSS px. Returns the box's size. */
function fitCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): readonly [width: number, height: number] {
  const { width, height } = canvas.getBoundingClientRect(),
    ratio = Math.min(MAX_PIXEL_RATIO, globalThis.devicePixelRatio);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return [width, height];
}

export { deviceScale, fitCanvas, glow, mix, parseRgb, readPalette, rgba };
export type { Painter, Palette, Rgb };
