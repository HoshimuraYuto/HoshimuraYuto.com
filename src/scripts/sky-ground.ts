import type { Ground, Weather } from "../lib/weather/weather";
import { smooth } from "../utils/math";
import { valueNoise } from "./sky-cloud-field";
import { deviceScale, mix } from "./sky-light";
import type { Painter, Rgb } from "./sky-light";
import type { Scene } from "./sky-scene";

/** The part of the screen that holds ground, as a grid of cells. The horizon curves, so its first rows hold sky towards the middle. */
interface Band {
  cols: number;
  rows: number;
  /** Top of the grid on screen, px: the highest point of the horizon. */
  top: number;
  /** Height of the ground on screen straight ahead, px. */
  depth: number;
  /** Depth of each cell below its own horizon, px, row by row; negative where the cell holds sky. */
  below: Float32Array;
}

/** Size of a cell of what lies on the ground, px. It is drawn enlarged, so water and snow have no edge. */
const CELL = 8;
/** Height of sky mirrored in wet ground, as a share of the ground's height: stretched downwards, as on a rough wet road. */
const MIRRORED_SKY = 0.55;
/** Most of the mirrored light that wet ground gives back, and most that snow hides of the ground under it. */
const SHEEN = 0.45;
const SNOW_COVER = 0.6;
/** Puddles and drifts lie where the ground is low, which does not change from one day to the next: fixed seeds. */
const PUDDLE_SEED = 0x0b_0d;
const DRIFT_SEED = 0x51_0e;
/** One grid for the whole ground rather than upright strips: where translucent strips meet, the seam shows as a thin line. */
function bandOf({ scene: s }: Pick<Painter, "scene">): Band {
  const cols = Math.ceil(s.width / CELL),
    horizons = Array.from({ length: cols }, (_unused, col) =>
      s.horizonAt((col + 0.5) * CELL),
    ),
    top = Math.min(...horizons),
    rows = Math.ceil((s.height - top) / CELL) + 1,
    below = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (const [col, horizon] of horizons.entries()) {
      below[row * cols + col] = top + (row + 0.5) * CELL - horizon;
    }
  }
  return {
    cols,
    rows,
    top,
    depth: s.height - s.horizonAt(s.width / 2),
    below,
  };
}
/** Unevenness of the ground at a cell (its column, and its depth below the horizon in px), 0 to 1, laid out on the ground plane so that it packs together towards the horizon. */
function hollowAt(
  s: Scene,
  [col, below]: readonly [number, number],
  seed: number,
): number {
  const distance = 1 / (Math.max(0, below) / s.focal + 0.05),
    across = (((col + 0.5) * CELL - s.width / 2) / s.focal) * distance * 0.5,
    away = distance * 0.9;
  return (
    (2 * valueNoise(across, away, seed) +
      valueNoise(across * 2.3, away * 2.3, seed + 1)) /
    3
  );
}
/** How much of a cell is covered: a little water or snow lies in patches, a lot of it lies everywhere. */
function patchAt(hollow: number, amount: number): number {
  const cut = 1.08 - 1.3 * amount;
  return smooth(hollow, cut - 0.14, cut + 0.14) * (0.4 + 0.6 * amount);
}
/** Opacity of the sky's reflection: strongest at a grazing angle, near the horizon, and gone before the small text lower down. `below` is a share of the ground's height. */
function sheenAt(hollow: number, below: number, wet: number): number {
  return (
    SHEEN *
    patchAt(hollow, wet) *
    smooth(below, 0, 0.06) *
    (1 - smooth(below, 0.04, 0.6)) ** 1.5
  );
}
/** Opacity of the snow: far snow is seen edge-on as a pale band under the horizon; nearer, the dark ground stays, so the text on it stays readable. */
function snowAt(hollow: number, below: number, snow: number): number {
  return (
    SNOW_COVER *
    patchAt(hollow, snow) *
    smooth(below, 0, 0.05) *
    (1 - smooth(below, 0.03, 0.36))
  );
}
/** A small canvas of one colour, with the opacity of each cell worked out from its place; drawn enlarged it becomes a soft cover. */
function coverOf(
  band: Band,
  [r, g, b]: Rgb,
  alphaAt: (col: number, below: number) => number,
): HTMLCanvasElement | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = band.cols;
  canvas.height = band.rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return undefined;
  }
  const image = ctx.createImageData(band.cols, band.rows);
  for (const [index, below] of band.below.entries()) {
    image.data.set(
      [r, g, b, 255 * alphaAt(index % band.cols, below)],
      index * 4,
    );
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
function layOnGround(
  { ctx }: Painter,
  bitmap: HTMLCanvasElement,
  band: Band,
): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, band.top, band.cols * CELL, band.rows * CELL);
}
/**
 * The sky just above the horizon, upside down and cut to where the ground is wet. It has to be taken
 * before the ground is painted, because the ground's soft edge darkens the sky it is taken from.
 */
function reflectSky(painter: Painter): HTMLCanvasElement | undefined {
  const { ctx, scene: s, lying } = painter;
  if (!lying || lying.wet <= 0) {
    return undefined;
  }
  const band = bandOf(painter),
    mirror = document.createElement("canvas"),
    mirrorCtx = mirror.getContext("2d"),
    mask = coverOf(band, [0, 0, 0], (col, below) =>
      sheenAt(
        hollowAt(s, [col, below], PUDDLE_SEED),
        below / band.depth,
        lying.wet,
      ),
    ),
    ratio = deviceScale(ctx),
    horizon = s.horizonAt(s.width / 2),
    height = band.rows * CELL;
  if (!mirrorCtx || !mask) {
    return undefined;
  }
  mirror.width = band.cols;
  mirror.height = band.rows;
  mirrorCtx.imageSmoothingQuality = "high";
  // Flipped, so that the sky nearest the horizon lands on the ground nearest the horizon.
  mirrorCtx.setTransform(1, 0, 0, -1, 0, band.rows);
  // Mirrored about the horizon straight ahead: the reflection is too soft for the horizon's curve to show in it.
  mirrorCtx.drawImage(
    ctx.canvas,
    0,
    (horizon - (band.top + height - horizon) * MIRRORED_SKY) * ratio,
    s.width * ratio,
    height * MIRRORED_SKY * ratio,
    0,
    0,
    s.width / CELL,
    band.rows,
  );
  mirrorCtx.setTransform(1, 0, 0, 1, 0, 0);
  mirrorCtx.globalCompositeOperation = "destination-in";
  mirrorCtx.drawImage(mask, 0, 0);
  return mirror;
}
function paintLying(painter: Painter, reflection?: HTMLCanvasElement): void {
  const { scene: s, palette: p, lying } = painter;
  if (!lying) {
    return;
  }
  const band = bandOf(painter);
  if (reflection) {
    layOnGround(painter, reflection, band);
  }
  if (lying.snow <= 0) {
    return;
  }
  const snow = coverOf(band, mix(p.snowNight, p.snowDay, s.day), (col, below) =>
    snowAt(
      hollowAt(s, [col, below], DRIFT_SEED),
      below / band.depth,
      lying.snow,
    ),
  );
  if (snow) {
    layOnGround(painter, snow, band);
  }
}
/** The ground's cover at a share of its full amount, so that it arrives with the rest of the weather. */
function lyingFor(weather: Weather, share: number): Ground | undefined {
  return weather.ground
    ? { wet: weather.ground.wet * share, snow: weather.ground.snow * share }
    : undefined;
}

export { lyingFor, paintLying, reflectSky };
