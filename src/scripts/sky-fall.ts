import { smooth } from "../utils/math";
import {
  bounceOf,
  dropAt,
  flashAt,
  flashPlaceAt,
  groundUnder,
  makeDrops,
  splashOf,
} from "./sky-fall-motion";
import type { Bounce, Drop, FallMoment, Splash } from "./sky-fall-motion";
import { fitCanvas, glow, mix, rgba } from "./sky-light";
import type { Rgb } from "./sky-light";
import type { Fall, WeatherLook } from "./sky-look";

interface Streak {
  head: readonly [number, number];
  along: readonly [number, number];
  length: number;
  color: Rgb;
  alpha: number;
  width: number;
}

interface FallFrame extends FallMoment {
  ctx: CanvasRenderingContext2D;
  color: Rgb;
  dustColor: Rgb;
}

interface FallStage {
  canvas: HTMLCanvasElement;
  look: WeatherLook;
  color: Rgb;
  /** 0 to 1: how brightly the drops catch the light; lower at night. */
  brightness: number;
  horizonAt: (x: number) => number;
  dustColor: Rgb;
  /** `performance.now()` when the weather arrived, so a restart after a resize does not fade in again. */
  startedAt: number;
  /** With reduced motion one still frame is painted and nothing moves. */
  reduced: boolean;
  random: () => number;
}

/** Height of a splash's light relative to its width: it lies on the ground and is seen nearly edge-on. */
const SPLASH_FLAT = 0.3;
/** Rain finer than this (light drizzle) wets the ground without throwing droplets up. */
const REBOUND_FROM_DENSITY = 0.3;
/** Seconds the fall takes to reach full strength after the weather arrives. */
const FADE_IN_S = 3;
const WHITE: Rgb = [255, 255, 255];
/** The droplets a drop throws back up: short arcs of light, carried downwind as they rise. */
function paintRebound(fall: Fall, frame: FallFrame, s: Splash): void {
  const { ctx } = frame;
  const count = fall.density > 0.8 ? 3 : 2;
  const hop = s.size * (0.8 + 1.4 * fall.density);
  const from = Math.max(0, s.age - 0.22);
  function pointAt(index: number, age: number): readonly [number, number] {
    return [
      s.at[0] +
        (s.size * 0.9 * (index - (count - 1) / 2) + fall.slant * hop * 1.6) *
          age,
      s.at[1] - hop * (index % 2 === 0 ? 1 : 0.65) * 4 * age * (1 - age),
    ];
  }
  ctx.strokeStyle = rgba(frame.color, s.alpha * (1 - s.age));
  ctx.lineWidth = 0.5 + 0.6 * (s.size / 16);
  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    ctx.moveTo(...pointAt(index, from));
    ctx.lineTo(...pointAt(index, s.age));
  }
  ctx.stroke();
}
/** Where a drop lands, a flat light spreads over the ground and fades: light with no edge, like everything else in this sky. */
function paintSplash(fall: Fall, frame: FallFrame, s: Splash): void {
  const { ctx } = frame,
    radius = s.size * (0.35 + 0.65 * Math.sqrt(s.age)),
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(
    0,
    rgba(mix(frame.color, WHITE, 0.4), s.alpha * (1 - s.age) ** 2),
  );
  g.addColorStop(1, rgba(frame.color, 0));
  ctx.save();
  ctx.translate(s.at[0] + fall.slant * s.size * 1.5 * s.age, s.at[1]);
  ctx.scale(1, SPLASH_FLAT);
  ctx.fillStyle = g;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
  if (fall.density >= REBOUND_FROM_DENSITY) {
    paintRebound(fall, frame, s);
  }
}
/** A dash fading out behind a moving point: `along` is its direction of travel, (sideways, down). */
function paintStreak(
  { ctx }: FallFrame,
  { head, along, length, color, alpha, width }: Streak,
): void {
  const norm = Math.hypot(along[0], along[1]),
    tail = [
      head[0] - (along[0] / norm) * length,
      head[1] - (along[1] / norm) * length,
    ] as const,
    g = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, alpha));
  ctx.strokeStyle = g;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(tail[0], tail[1]);
  ctx.lineTo(head[0], head[1]);
  ctx.stroke();
}
/** A raindrop is a short streak of light, fading towards its tail, until it meets the ground. */
function paintRain(drop: Drop, fall: Fall, frame: FallFrame): void {
  const { ctx } = frame,
    [x, y] = dropAt(drop, fall, frame);
  if (y > groundUnder(drop, x, frame)) {
    const splash = splashOf(drop, fall, frame);
    if (splash) {
      paintSplash(fall, frame, splash);
    }
    return;
  }
  const length = frame.height * (0.02 + 0.045 * drop.depth),
    tail = [x - fall.slant * length * 0.6, y - length] as const,
    g = ctx.createLinearGradient(tail[0], tail[1], x, y);
  g.addColorStop(0, rgba(frame.color, 0));
  g.addColorStop(
    1,
    rgba(frame.color, (0.1 + 0.3 * drop.depth) * frame.strength),
  );
  ctx.strokeStyle = g;
  ctx.lineWidth = 0.6 + 0.9 * drop.depth;
  ctx.beginPath();
  ctx.moveTo(tail[0], tail[1]);
  ctx.lineTo(x, y);
  ctx.stroke();
}
/** A snowflake is a small soft light with no edge, like a star that falls. */
function paintSnow(drop: Drop, fall: Fall, frame: FallFrame): void {
  const { ctx } = frame,
    [x, y] = dropAt(drop, fall, frame),
    radius = 1.2 + 3.4 * drop.depth,
    g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(
    0,
    rgba(
      mix(frame.color, WHITE, 0.5),
      (0.25 + 0.5 * drop.depth) * frame.strength,
    ),
  );
  g.addColorStop(1, rgba(frame.color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
/** A grain of ice is a hard point of light, smaller and brighter than a snowflake, with no tail. */
function paintIceLight(
  frame: FallFrame,
  { at, size, alpha }: Omit<Bounce, "age">,
): void {
  const { ctx, color } = frame,
    g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], size * 1.6);
  g.addColorStop(0, rgba(mix(color, WHITE, 0.7), alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.5));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(at[0] - size * 1.6, at[1] - size * 1.6, size * 3.2, size * 3.2);
}
function paintIce(drop: Drop, fall: Fall, frame: FallFrame): void {
  const [x, y] = dropAt(drop, fall, frame);
  if (y > groundUnder(drop, x, frame)) {
    const bounce = bounceOf(drop, fall, frame);
    if (bounce) {
      paintIceLight(frame, bounce);
    }
    return;
  }
  // Falling, a grain is blurred into a short bright dash along its path; a round point would read as a star.
  paintStreak(frame, {
    head: [x, y],
    along: [fall.slant * 0.6, 1],
    length: frame.height * (0.008 + 0.014 * drop.depth),
    color: mix(frame.color, WHITE, 0.6),
    alpha: (0.4 + 0.5 * drop.depth) * frame.strength,
    width: 1.1 + 1.5 * drop.depth,
  });
}
/** A grain of sand is a faint dash in the colour of dust, blurred along its path; it settles on the ground without a trace. */
function paintSand(drop: Drop, fall: Fall, frame: FallFrame): void {
  const [x, y] = dropAt(drop, fall, frame);
  if (y > groundUnder(drop, x, frame)) {
    return;
  }
  paintStreak(frame, {
    head: [x, y],
    along: [fall.slant, 1],
    length: frame.height * (0.006 + 0.016 * drop.depth),
    color: frame.dustColor,
    alpha: (0.25 + 0.4 * drop.depth) * frame.strength,
    width: 0.6 + 0.9 * drop.depth,
  });
}
function paintFall(drops: readonly Drop[], fall: Fall, frame: FallFrame): void {
  frame.ctx.lineCap = "round";
  for (const drop of drops) {
    if (drop.ice) {
      paintIce(drop, fall, frame);
    } else if (drop.sand) {
      paintSand(drop, fall, frame);
    } else {
      (drop.snow ? paintSnow : paintRain)(drop, fall, frame);
    }
  }
}
/** Lightning is seen as cloud lit from inside: a wide dull light high in the sky, never a bolt. */
function paintFlash(frame: FallFrame): void {
  const level = flashAt(frame.seconds),
    [across, down] = flashPlaceAt(frame.seconds);
  if (level <= 0) {
    return;
  }
  frame.ctx.globalCompositeOperation = "lighter";
  glow(frame.ctx, {
    at: [across * frame.width, down * frame.height],
    radius: Math.max(frame.width, frame.height) * 0.6,
    color: mix(frame.color, WHITE, 0.4),
    alpha: 0.2 * level * frame.strength,
  });
  frame.ctx.globalCompositeOperation = "source-over";
}
/** Runs the rain, the snow and the lightning on their own canvas, so the sky under them is not redrawn every frame. Returns a stop function. */
function startFall(stage: FallStage): () => void {
  const { canvas, look } = stage,
    context = canvas.getContext("2d");
  if (!context) {
    return () => undefined;
  }
  const ctx: CanvasRenderingContext2D = context,
    [width, height] = fitCanvas(canvas, ctx),
    drops = look.fall ? makeDrops(look.fall, width * height, stage.random) : [],
    grains = look.sand
      ? makeDrops(look.sand, width * height, stage.random)
      : [];
  let request = 0;
  function paint(time: number): void {
    const seconds = Math.max(0, (time - stage.startedAt) / 1000),
      strength =
        stage.brightness * (stage.reduced ? 1 : smooth(seconds, 0, FADE_IN_S)),
      frame: FallFrame = {
        ctx,
        width,
        height,
        seconds,
        color: stage.color,
        strength,
        horizonAt: stage.horizonAt,
        dustColor: stage.dustColor,
      };
    ctx.clearRect(0, 0, width, height);
    if (look.sand) {
      paintFall(grains, look.sand, frame);
    }
    if (look.fall) {
      paintFall(drops, look.fall, frame);
    }
    if (look.thunder && !stage.reduced) {
      paintFlash(frame);
    }
    if (!stage.reduced) {
      request = requestAnimationFrame(paint);
    }
  }
  if (look.fall || look.thunder || look.sand) {
    paint(stage.reduced ? stage.startedAt : performance.now());
  }
  return () => {
    cancelAnimationFrame(request);
    ctx.clearRect(0, 0, width, height);
  };
}

export { startFall };
export type { FallStage };
