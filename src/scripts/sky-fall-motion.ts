import { latticeHash } from "../utils/random";
import type { Fall } from "./sky-look";

/** One raindrop or snowflake. Positions are shares of the canvas, so a resize keeps the pattern. */
interface Drop {
  x: number;
  /** Where in its fall the drop is at time zero, 0 to 1. */
  phase: number;
  /** 0 far, 1 near: near drops are larger, brighter and faster. */
  depth: number;
  snow: boolean;
  /** Phase of a flake's side-to-side sway, radians. */
  sway: number;
  /** A hard grain of ice (hail, graupel, ice pellets): it falls as a point and bounces where it lands. */
  ice?: true;
  /** Dust or sand lifted by the wind: it drifts down and settles without a splash. */
  sand?: true;
}

interface Bounce {
  at: readonly [number, number];
  /** 0 as it lands, 1 when it lies still and is gone. */
  age: number;
  /** Radius of its light, px. */
  size: number;
  alpha: number;
}

interface Splash {
  /** Where the drop struck the ground, px. */
  at: readonly [number, number];
  /** 0 as the drop lands, 1 when the splash is gone. */
  age: number;
  /** Half-width of the light on the ground, px. */
  size: number;
  alpha: number;
}

/** Where and when the fall is seen: what its motion depends on, without the drawing context. */
interface FallMoment {
  width: number;
  height: number;
  /** Seconds since the weather arrived. */
  seconds: number;
  /** 0 to 1: lets the fall arrive gradually, and dims it at night. */
  strength: number;
  /** Height of the horizon on screen at a given x, px; `undefined` when there is no ground to land on. */
  horizonAt: ((x: number) => number) | undefined;
}

/** Drops at full density on a 1280 × 800 px canvas; scaled with the area, so a phone gets fewer. */
const DROPS_AT_FULL = 420;
const REFERENCE_AREA = 1280 * 800;
/** Seconds a near raindrop and a near snowflake take to cross the canvas. */
const RAIN_CROSSING_S = 0.75;
const SNOW_CROSSING_S = 9;
const SLEET_SNOW_SHARE = 0.4;
/** A drop is in view for this share of its fall; the rest is above the top and below the bottom. */
const FALL_SPAN = 1.1;
/** Sideways travel over a whole fall, as a share of the width, for a slant of 1. */
const SLANT_REACH = 0.6;
/** Where the nearest drops land, as a share of the height: past the bottom, so they fall through the view. */
const NEAR_GROUND = 1.2;
/** Seconds the splash of a near drop lasts. */
const SPLASH_S = 0.34;
/** Lightning is tried once per this many seconds, far below the three flashes a second that can trigger seizures (WCAG 2.3.1). */
const FLASH_PERIOD_S = 7;
const FLASH_RISE_S = 0.12;
const FLASH_DECAY_S = 0.9;
/** A flash starts this long before the end of its slot at the latest, so its rise and fade fit inside, with a margin. */
const FLASH_LENGTH_S = FLASH_RISE_S + FLASH_DECAY_S + 0.18;
const FLASH_SHARE = 0.66;
/** Keeps the lightning's hashes apart from the clouds' on the same lattice. */
const FLASH_SALT = 0x0f_1a_54;
/** Seconds a near grain of ice takes to cross the canvas: hail falls faster than snow, a little slower than rain. */
const ICE_CROSSING_S = 1;
/** Seconds a bouncing grain stays in view, and how high it bounces, as a share of its distance below the horizon plus a floor, px. */
const BOUNCE_S = 0.55;
const BOUNCE_HOP = 0.05;
const BOUNCE_HOP_MIN = 3;
/** Seconds a near grain of sand takes to fall across the canvas: light, so slower than rain, heavier than a snowflake. */
const SAND_CROSSING_S = 4;
/** Waves summed into the gusts: periods (s), weights and phases. Sines, so their sum has a closed-form integral and the gusts never need a running total. */
const GUST_WAVES: readonly { period: number; weight: number; phase: number }[] =
  [
    { period: 7.3, weight: 0.55, phase: 0.4 },
    { period: 3.1, weight: 0.3, phase: 1.3 },
    { period: 1.7, weight: 0.15, phase: 2.1 },
  ];
/** How far the gusts swing the wind's speed about its mean at most: below 1, so a gust can slacken the wind but never turn it back. */
const GUST_SWING = 0.5;
function isSnow(kind: Fall["kind"], random: () => number): boolean {
  return kind === "snow" || (kind === "sleet" && random() < SLEET_SNOW_SHARE);
}
function makeDrops(fall: Fall, area: number, random: () => number): Drop[] {
  const count = Math.round(
    DROPS_AT_FULL * fall.density * Math.min(1.5, area / REFERENCE_AREA),
  );
  return Array.from({ length: count }, () => {
    if (fall.kind === "sand") {
      return {
        x: random(),
        phase: random(),
        depth: random(),
        snow: false,
        sway: random() * Math.PI * 2,
        sand: true,
      };
    }
    const drop: Drop = {
      x: random(),
      phase: random(),
      depth: random(),
      snow: isSnow(fall.kind, random),
      sway: random() * Math.PI * 2,
    };
    // Drawn only when there is ice, so a fall without ice gets the same drops from the same seed.
    return fall.ice !== undefined && random() < fall.ice
      ? { ...drop, snow: false, ice: true }
      : drop;
  });
}
function crossingOf(drop: Drop): number {
  if (drop.ice) {
    return ICE_CROSSING_S;
  }
  if (drop.sand) {
    return SAND_CROSSING_S;
  }
  return drop.snow ? SNOW_CROSSING_S : RAIN_CROSSING_S;
}
/** Share of its whole fall a drop covers in a second. */
function speedOf(drop: Drop): number {
  return (0.45 + 0.55 * drop.depth) / crossingOf(drop);
}
/** How far the gusts push the wind beyond its mean at a moment, about −1 to 1: it swells and slackens, unevenly. */
function gustAt(seconds: number): number {
  return GUST_WAVES.reduce(
    (sum, { period, weight, phase }) =>
      sum + weight * Math.sin((2 * Math.PI * seconds) / period + phase),
    0,
  );
}
/**
 * How far a gusty wind has carried something by a moment, in seconds of the mean wind: the integral of
 * 1 + swing × gust. It only ever grows, so what the wind carries is never pulled back when a gust dies.
 */
function windRun(seconds: number, gust: number): number {
  return (
    seconds +
    GUST_SWING *
      gust *
      GUST_WAVES.reduce(
        (sum, { period, weight, phase }) =>
          sum +
          ((weight * period) / (2 * Math.PI)) *
            (Math.cos(phase) -
              Math.cos((2 * Math.PI * seconds) / period + phase)),
        0,
      )
  );
}
/** The slant at a moment: in a gusty wind it swells and slackens, always the same way round. */
function slantAt(fall: Fall, seconds: number): number {
  return fall.slant * (1 + GUST_SWING * (fall.gust ?? 0) * gustAt(seconds));
}
/** Position of a drop, px. It wraps round, starting above the top so that it does not pop in. */
function dropAt(
  drop: Drop,
  fall: Fall,
  frame: Pick<FallMoment, "width" | "height" | "seconds">,
): readonly [number, number] {
  const speed = speedOf(drop),
    travel = (drop.phase + frame.seconds * speed) % 1,
    // Sideways, a drop goes where the wind has carried it since this fall began; a gust speeds it up, a lull slows it, neither throws it back.
    began = frame.seconds - travel / speed,
    gust = fall.gust ?? 0,
    carried = (windRun(frame.seconds, gust) - windRun(began, gust)) * speed,
    sway = drop.snow ? Math.sin(frame.seconds * 0.7 + drop.sway) * 0.012 : 0,
    x = (((drop.x + fall.slant * carried * SLANT_REACH + sway) % 1) + 1) % 1;
  return [x * frame.width, (travel * FALL_SPAN - 0.05) * frame.height];
}
/** Height on screen at which a drop meets the ground, px: far drops at the horizon, near ones lower, the nearest below the view. */
function groundUnder(
  drop: Drop,
  x: number,
  frame: Pick<FallMoment, "height" | "horizonAt">,
): number {
  if (!frame.horizonAt) {
    return Number.POSITIVE_INFINITY;
  }
  const horizon = frame.horizonAt(x);
  // Even ground runs away towards the horizon, so most of it, and most of the rain on it, is seen close under the horizon.
  return horizon + (frame.height * NEAR_GROUND - horizon) * drop.depth ** 3;
}
/** The splash of a drop that has met its ground; `undefined` while it still falls, once the splash is over, and where it lies out of view. */
function splashOf(
  drop: Drop,
  fall: Fall,
  frame: FallMoment,
): Splash | undefined {
  const [x, y] = dropAt(drop, fall, frame),
    ground = groundUnder(drop, x, frame),
    fallHeight = FALL_SPAN * frame.height,
    age =
      (y - ground) /
      (speedOf(drop) * fallHeight) /
      (SPLASH_S * (0.55 + 0.45 * drop.depth)),
    // The drop has gone on falling out of sight since it landed; the splash stays where it struck.
    back =
      (slantAt(fall, frame.seconds) *
        SLANT_REACH *
        frame.width *
        (y - ground)) /
      fallHeight,
    // Heavier rain strikes harder: a wider light and a higher rebound.
    size = (2.6 + 9 * drop.depth ** 2) * (0.7 + 0.6 * fall.density);
  if (age < 0 || age >= 1 || ground > frame.height + size) {
    return undefined;
  }
  return {
    at: [(((x - back) % frame.width) + frame.width) % frame.width, ground],
    age,
    size,
    alpha:
      (0.22 + 0.3 * drop.depth) * (0.6 + 0.4 * fall.density) * frame.strength,
  };
}
/** A grain of ice that has met its ground, bouncing: it leaps up and drops back twice, smaller each time, then lies still and fades. `undefined` while it still falls and once it is gone. */
function bounceOf(
  drop: Drop,
  fall: Fall,
  frame: FallMoment,
): Bounce | undefined {
  const [x, y] = dropAt(drop, fall, frame),
    ground = groundUnder(drop, x, frame),
    fallHeight = FALL_SPAN * frame.height,
    age = (y - ground) / (speedOf(drop) * fallHeight) / BOUNCE_S,
    size = 1 + 2.4 * drop.depth;
  if (age < 0 || age >= 1 || ground > frame.height + size) {
    return undefined;
  }
  const horizon = frame.horizonAt?.(x) ?? ground,
    hop = BOUNCE_HOP_MIN + BOUNCE_HOP * (ground - horizon),
    // Two hops, the second a third as high: |sin| traces the arcs, the falling envelope takes the height away.
    lift =
      hop * Math.abs(Math.sin(Math.PI * 2 * Math.sqrt(age))) * (1 - age) ** 1.5,
    drift = slantAt(fall, frame.seconds) * hop * 3 * age;
  return {
    at: [
      (((x + drift) % frame.width) + frame.width) % frame.width,
      ground - lift,
    ],
    age,
    size,
    alpha: (0.45 + 0.4 * drop.depth) * frame.strength * (1 - age),
  };
}
/** Pseudo-random share for the nth lightning slot; the same slot always gives the same flash in every engine. */
function slotShare(slot: number, salt: number): number {
  return latticeHash(slot, salt, FLASH_SALT);
}
/** Brightness of the lightning at a moment, 0 to 1: about two slots in three flash, each a quick rise and a slow fade. */
function flashAt(seconds: number): number {
  const slot = Math.floor(seconds / FLASH_PERIOD_S),
    since =
      seconds -
      slot * FLASH_PERIOD_S -
      slotShare(slot, 1) * (FLASH_PERIOD_S - FLASH_LENGTH_S);
  if (slotShare(slot, 2) > FLASH_SHARE || since < 0) {
    return 0;
  }
  return since < FLASH_RISE_S
    ? since / FLASH_RISE_S
    : Math.max(0, 1 - (since - FLASH_RISE_S) / FLASH_DECAY_S);
}
/** Where the lightning of the slot at a moment lights the cloud, as shares of the width and height: high in the sky. */
function flashPlaceAt(seconds: number): readonly [number, number] {
  const slot = Math.floor(seconds / FLASH_PERIOD_S);
  return [0.15 + 0.7 * slotShare(slot, 3), 0.1 + 0.25 * slotShare(slot, 4)];
}

export {
  bounceOf,
  dropAt,
  flashAt,
  flashPlaceAt,
  groundUnder,
  gustAt,
  makeDrops,
  splashOf,
};
export type { Bounce, Drop, FallMoment, Splash };
