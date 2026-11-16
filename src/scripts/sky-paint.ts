import { clamp, smooth } from "../utils/math";
import {
  paintClouds,
  paintFunnel,
  paintVeil,
  paintVeilOnGround,
} from "./sky-clouds";
import { paintLying, reflectSky } from "./sky-ground";
import { deviceScale, glow, mix, rgba } from "./sky-light";
import type { Painter, Palette, Rgb } from "./sky-light";
import type { SceneMoon } from "./sky-scene";

const GRAIN_SIZE = 128;
const GRAIN_ALPHA = 0.05;
/** The moon is drawn about three times life size, as through a long lens, so its phase reads. */
const MOON_SCALE = 0.042;
/** A crescent thinner than this lit share is lost in the glare of the sun and is not drawn. */
const MIN_MOON_FRACTION = 0.03;
/** Smallest moon radius, px, so its phase still reads on a phone. */
const MIN_MOON_RADIUS = 6;
/** Screen width, px, at which stars are drawn at their natural size. */
const REFERENCE_WIDTH = 1280;
/** The hot white core of a star or the sun's disc. */
const WARM_WHITE: Rgb = [255, 252, 246];
function starColor(ci: number, p: Palette): Rgb {
  if (ci < 0.1) {
    return p.starBlue;
  }
  return ci > 1.1 ? p.starRed : p.starWhite;
}
function paintSky({ ctx, scene: s, palette: p }: Painter): void {
  const horizon = s.horizonAt(s.width / 2),
    dusk = smooth(s.sunAltitude, -12, -2) * (1 - smooth(s.sunAltitude, 0, 10)),
    g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, rgba(mix(p.nightTop, p.dayTop, s.day)));
  g.addColorStop(
    1,
    rgba(mix(mix(p.nightLow, p.dayLow, s.day), p.duskLow, dusk * 0.7)),
  );
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s.width, s.height);
}
/** By day a bright veil hangs low in the sky, as in a hazy photograph. */
function paintHaze({ ctx, scene: s, palette: p }: Painter): void {
  if (s.day <= 0) {
    return;
  }
  const horizon = s.horizonAt(s.width / 2),
    top = horizon - s.height * 0.55,
    g = ctx.createLinearGradient(0, top, 0, horizon);
  g.addColorStop(0, rgba(p.dayLow, 0));
  g.addColorStop(1, rgba(p.dayLow, 0.16 * s.day));
  ctx.fillStyle = g;
  ctx.fillRect(0, top, s.width, horizon - top);
}
function paintStars({ ctx, scene: s, palette: p }: Painter): void {
  const unit = clamp(s.width / REFERENCE_WIDTH, 0.6, 1.4);
  for (const star of s.stars) {
    const fade =
        smooth(s.limitingMagnitude - star.magnitude, 0, 1) *
        smooth(star.altitude, 0, 8),
      radius = unit * clamp(16 - 3.2 * star.magnitude, 3, 18),
      alpha = clamp(1.1 - 0.16 * star.magnitude, 0.3, 1) * fade,
      at = [star.x, star.y] as const;
    glow(ctx, {
      at,
      radius,
      color: starColor(star.colorIndex, p),
      alpha: alpha * 0.7,
    });
    glow(ctx, { at, radius: radius * 0.3, color: WARM_WHITE, alpha });
  }
}
/** Bright limb towards the sun: a half disc closed by the terminator, an ellipse of half-width |1 − 2f|. */
function moonShape(
  ctx: CanvasRenderingContext2D,
  radius: number,
  fraction: number,
): void {
  const k = 1 - 2 * fraction,
    steps = 24;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    ctx.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  for (let i = steps; i >= 0; i -= 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    ctx.lineTo(k * radius * Math.cos(a), radius * Math.sin(a));
  }
  ctx.closePath();
}
/** Share of a lamp's light that gets through the weather: rain and storm cloud dim the moon and sun even in a gap. */
function through(look: Painter["look"]): number {
  return 1 - 0.75 * (look?.gloom ?? 0);
}
function paintMoon(
  { ctx, scene: s, palette: p, look }: Painter,
  moon: SceneMoon,
): void {
  if (moon.fraction < MIN_MOON_FRACTION) {
    return;
  }
  const radius = Math.max(MIN_MOON_RADIUS, s.focal * MOON_SCALE),
    strength =
      (1 - 0.55 * s.day) * smooth(moon.altitude, -1, 2) * through(look),
    color = mix(p.moon, p.sunLow, 0.6 * (1 - smooth(moon.altitude, 2, 14))),
    at = [moon.x, moon.y] as const,
    scale = deviceScale(ctx);
  glow(ctx, {
    at,
    radius: s.focal * 0.9,
    color,
    alpha: 0.16 * moon.fraction * strength * (1 - s.day),
  });
  glow(ctx, {
    at,
    radius: radius * 7,
    color,
    alpha: (0.12 + 0.3 * moon.fraction) * strength,
  });
  ctx.save();
  ctx.translate(moon.x, moon.y);
  ctx.rotate(moon.litAngle);
  moonShape(ctx, radius, moon.fraction);
  // shadowBlur ignores the transform, so it is scaled to device pixels by hand.
  ctx.shadowColor = rgba(color, 0.9 * strength);
  ctx.shadowBlur = radius * 1.6 * scale;
  ctx.fillStyle = rgba(color, 0.95 * strength);
  ctx.fill();
  ctx.restore();
}
function paintSun({ ctx, scene: s, palette: p, look }: Painter): void {
  if (!s.sun) {
    return;
  }
  const color = mix(p.sun, p.sunLow, 1 - smooth(s.sunAltitude, 0, 14)),
    k = 0.4 + 0.6 * s.day,
    at = s.sun,
    // Thick air (fog, dust, ash) hides the disc first and leaves a wide dull glow.
    disc = through(look) * (1 - 0.85 * (look?.veil ?? 0));
  glow(ctx, { at, radius: s.focal * 1.6, color, alpha: 0.22 * k });
  glow(ctx, { at, radius: s.focal * 0.5, color, alpha: 0.3 * k });
  glow(ctx, {
    at,
    radius: s.focal * 0.1,
    color: WARM_WHITE,
    alpha: 0.7 * disc,
  });
  glow(ctx, { at, radius: s.focal * 0.03, color: WARM_WHITE, alpha: disc });
}
/** The ground has no edge: it is filled with a wide soft shadow of its own colour. */
function paintGround({ ctx, scene: s, palette: p }: Painter): void {
  const left = -s.width * 0.1,
    right = s.width * 1.1,
    bottom = s.height * 1.2;
  ctx.save();
  ctx.shadowColor = rgba(p.ground);
  ctx.shadowBlur = s.height * 0.06 * deviceScale(ctx);
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  for (let x = left; x <= right; x += s.width / 40) {
    ctx.lineTo(x, s.horizonAt(x) + s.height * 0.015);
  }
  ctx.lineTo(right, bottom);
  ctx.closePath();
  ctx.fillStyle = rgba(p.ground);
  ctx.fill();
  ctx.restore();
}
function makeGrain(random: () => number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_SIZE;
  canvas.height = GRAIN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const image = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = random() * 255;
    image.data.set([v, v, v, 255], i);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
function paintGrain(
  { ctx, scene: s }: Painter,
  grain: HTMLCanvasElement,
): void {
  const pattern = ctx.createPattern(grain, "repeat");
  if (!pattern) {
    return;
  }
  ctx.globalAlpha = GRAIN_ALPHA;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, s.width, s.height);
  ctx.globalAlpha = 1;
}
/** Light only, nothing with an edge: every lamp in the sky is added as a soft glow, then the weather is laid over them. */
function paintScene(painter: Painter, grain: HTMLCanvasElement): void {
  const { ctx, scene } = painter;
  paintSky(painter);
  ctx.globalCompositeOperation = "lighter";
  paintHaze(painter);
  paintStars(painter);
  if (scene.moon) {
    paintMoon(painter, scene.moon);
  }
  paintSun(painter);
  ctx.globalCompositeOperation = "source-over";
  paintClouds(painter);
  paintFunnel(painter);
  paintVeil(painter);
  const reflection = reflectSky(painter);
  paintGround(painter);
  paintLying(painter, reflection);
  paintVeilOnGround(painter);
  paintGrain(painter, grain);
}

export { makeGrain, paintScene, starColor };
