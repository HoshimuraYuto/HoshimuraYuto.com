import { clamp } from "../utils/math";
import { prefersReducedMotion } from "../utils/motion";
import { fall, grounded, setupCarry } from "./critter-carry";
import type { Carry } from "./critter-carry";
import { say, setupPoke } from "./critter-poke";
import type { Star } from "./critter-stars";

export interface CritterState {
  x: number;
  dir: 1 | -1;
  pause: number;
  /** Where it is running to; while set it neither stops nor turns. */
  target?: number;
}

interface CritterBounds {
  min: number;
  max: number;
}

interface CritterTick {
  dt: number;
  bounds: CritterBounds;
  random?: () => number;
  /** Asleep at the page's end: it stays where it is until woken. */
  resting?: boolean;
}

type CritterSide = "left" | "right";

interface Critter {
  collect: (star: Star) => void;
}

/** Walking speed, px per second. */
const SPEED = 26;
/** Chance per second of stopping, and of turning around. */
const PAUSE_RATE = 0.25;
const TURN_RATE = 0.12;
const PAUSE_MIN = 0.6;
const PAUSE_SPREAD = 1.4;
const HOP_HEIGHT = 2;
const HOP_FREQUENCY = 0.45;
/** Running off after being poked too much, faster than its walk. */
const RUN_SPEED = 90;
/** Seconds it stays still after waking: the body rises (0.5s), then the eyes open (until 0.75s). */
const WAKE_PAUSE = 0.9;
/** Pauses, seconds: after picking a star up, after a poke, after landing from a carry. */
const PICKED_PAUSE = 1;
const POKED_PAUSE = 1.2;
const LANDED_PAUSE = 0.5;
/** It picks a star up only with the star under its middle, px. */
const REACH = 6;
/** A long frame (e.g. a background tab) must not throw it across the screen. */
const MAX_DT = 0.1;
function initialState(
  bounds: CritterBounds,
  side: CritterSide = "left",
): CritterState {
  return side === "left"
    ? { x: bounds.min, dir: 1, pause: 0 }
    : { x: bounds.max, dir: -1, pause: 0 };
}
function run(
  state: CritterState,
  target: number,
  elapsed: number,
): CritterState {
  const left = target - state.x,
    dir = left >= 0 ? 1 : -1,
    x = state.x + dir * Math.min(Math.abs(left), RUN_SPEED * elapsed);
  return x === target ? { x, dir, pause: 0 } : { x, dir, pause: 0, target };
}
function wander(
  state: CritterState,
  elapsed: number,
  random: () => number,
): CritterState {
  let { x, dir, pause } = state;
  if (pause > 0) {
    return { x, dir, pause: Math.max(0, pause - elapsed) };
  }
  x += dir * SPEED * elapsed;
  if (random() < elapsed * PAUSE_RATE) {
    pause = PAUSE_MIN + random() * PAUSE_SPREAD;
  }
  if (random() < elapsed * TURN_RATE) {
    dir = dir === 1 ? -1 : 1;
  }
  return { x, dir, pause };
}
function step(
  state: CritterState,
  { dt, bounds, random = Math.random, resting = false }: CritterTick,
): CritterState {
  const elapsed = Math.min(dt, MAX_DT);
  let next: CritterState;
  if (resting) {
    next = {
      x: state.x,
      dir: state.dir,
      pause: Math.max(state.pause, MAX_DT),
    };
  } else if (state.target === undefined) {
    next = wander(state, elapsed, random);
  } else {
    return run(state, state.target, elapsed);
  }
  if (next.x >= bounds.max) {
    return { ...next, x: bounds.max, dir: -1 };
  }
  if (next.x <= bounds.min) {
    return { ...next, x: bounds.min, dir: 1 };
  }
  return next;
}
/** The star closest to where it stands, so it takes them in the shortest run rather than in the order dropped. */
function nearestIndex(xs: number[], from: number): number {
  let best = -1;
  for (const [index, x] of xs.entries()) {
    if (best === -1 || Math.abs(x - from) < Math.abs((xs[best] ?? 0) - from)) {
      best = index;
    }
  }
  return best;
}
function hopOffset(state: CritterState): number {
  return state.pause > 0
    ? 0
    : -Math.abs(Math.sin(state.x * HOP_FREQUENCY)) * HOP_HEIGHT;
}
interface Chased {
  star: Star;
  /** False while the star is still falling; it is picked up only once it lies on the ground. */
  landed: boolean;
}
interface World {
  critter: HTMLElement;
  /** Its distance from the window's edge in the layout, kept as the edge it never crosses. */
  margin: number;
  state: CritterState;
  carry: Carry;
  stars: Chased[];
  found: number;
  wasResting: boolean;
  last: number;
  /** With reduced motion there is no frame loop: what would move is placed at once. */
  reduced: boolean;
  /** What render last wrote, shared by reference so a copied world updates it too. */
  drawn: Drawn;
}
/** Each frame writes only what changed: setting a data attribute restyles the element even when the value is the same. */
interface Drawn {
  translate: string;
  dir: string;
  carry: string;
}

async function markLanded(world: World, entry: Chased): Promise<void> {
  await entry.star.landed;
  entry.landed = true;
  // It may have reached the spot before the star did and wandered off since.
  chaseNext(world);
}
function boundsOf({ critter, margin }: World): CritterBounds {
  return {
    min: margin,
    max: document.documentElement.clientWidth - critter.offsetWidth - margin,
  };
}
function clampX(world: World, x: number): number {
  const { min, max } = boundsOf(world);
  return clamp(x, min, max);
}
function render({ critter, margin, state, carry, drawn }: World): void {
  const lift = carry.mode === "ground" ? hopOffset(state) : -carry.y,
    translate = `${state.x - margin}px ${lift}px`,
    dir = String(state.dir);
  if (drawn.translate !== translate) {
    critter.style.translate = translate;
    drawn.translate = translate;
  }
  if (drawn.dir !== dir) {
    critter.dataset["dir"] = dir;
    drawn.dir = dir;
  }
  if (drawn.carry !== carry.mode) {
    critter.dataset["carry"] = carry.mode;
    drawn.carry = carry.mode;
  }
}
/** Critter.astro marks it while the page's end is in view. */
function asleep({ critter }: World): boolean {
  return critter.dataset["rest"] !== undefined;
}
function middleOf({ state, critter }: World): number {
  return state.x + critter.offsetWidth / 2;
}
function nearestStar(world: World): number {
  return nearestIndex(
    world.stars.map((entry) => entry.star.x),
    middleOf(world),
  );
}
function chaseNext(world: World): void {
  const next = world.stars[nearestStar(world)];
  if (!next || world.carry.mode !== "ground") {
    return;
  }
  world.state = {
    ...world.state,
    pause: 0,
    target: clampX(world, next.star.x - world.critter.offsetWidth / 2),
  };
}
function pickUp(world: World): void {
  const index = nearestStar(world),
    next = world.stars[index];
  if (
    next?.landed !== true ||
    Math.abs(next.star.x - middleOf(world)) > REACH ||
    world.state.target !== undefined ||
    world.carry.mode !== "ground"
  ) {
    return;
  }
  world.stars = world.stars.toSpliced(index, 1);
  next.star.element.remove();
  world.found += 1;
  say(world.critter, String(world.found), { star: true });
  world.state = { ...world.state, pause: PICKED_PAUSE };
  chaseNext(world);
}
/** Poked: it stops for a moment, or after too many runs off to the far side. */
function react(world: World, flee: boolean): void {
  const { min, max } = boundsOf(world),
    { state } = world;
  world.state = flee
    ? { ...state, pause: 0, target: state.x - min < max - state.x ? max : min }
    : { ...state, pause: Math.max(state.pause, POKED_PAUSE) };
}
function holdAt(world: World, clientX: number, clientY: number): void {
  const { critter } = world;
  world.state = {
    x: clampX(world, clientX - critter.offsetWidth / 2),
    dir: world.state.dir,
    pause: 0,
  };
  world.carry = {
    ...world.carry,
    y: Math.max(0, innerHeight - clientY - critter.offsetHeight / 2),
  };
  render(world);
}
function walk(world: World, dt: number): void {
  const resting = asleep(world) && world.stars.length === 0;
  // Just woken, it stays put while it rises and opens its eyes (Critter.astro), then walks.
  if (world.wasResting && !resting) {
    world.state = { ...world.state, pause: WAKE_PAUSE };
  }
  world.wasResting = resting;
  world.state = step(world.state, { dt, bounds: boundsOf(world), resting });
  pickUp(world);
}
function landFromCarry(world: World, dt: number): void {
  if (world.carry.mode === "falling") {
    world.carry = fall(world.carry, dt);
  }
  if (world.carry.mode === "ground") {
    chaseNext(world);
  }
}
function tick(world: World, now: number): void {
  const dt = Math.min((now - world.last) / 1000, MAX_DT);
  world.last = now;
  if (world.carry.mode === "ground") {
    walk(world, dt);
  } else {
    landFromCarry(world, dt);
  }
  // While held, the pointer moves it (holdAt), not the frame.
  if (world.carry.mode !== "held") {
    render(world);
  }
}
function connectHands(world: World): void {
  setupPoke(world.critter, {
    asleep: () => asleep(world),
    react: (flee) => {
      react(world, flee);
    },
  });
  setupCarry(world.critter, {
    lift: () => {
      world.carry = { mode: "held", y: world.carry.y, vy: 0 };
    },
    move: (clientX, clientY) => {
      holdAt(world, clientX, clientY);
    },
    release: () => {
      world.carry = world.reduced
        ? grounded()
        : { mode: "falling", y: world.carry.y, vy: 0 };
      world.state = { ...world.state, pause: LANDED_PAUSE };
      if (world.reduced) {
        render(world);
      }
    },
  });
}
function setupCritter(
  critter: HTMLElement,
  side: CritterSide = "left",
): Critter {
  const world: World = {
    critter,
    margin: critter.offsetLeft,
    state: { x: 0, dir: 1, pause: 0 },
    carry: grounded(),
    stars: [],
    found: 0,
    wasResting: false,
    last: performance.now(),
    reduced: prefersReducedMotion(),
    drawn: { translate: "", dir: "", carry: "" },
  };
  world.state = initialState(boundsOf(world), side);
  // Standing still until the first frame, so it does not hop in place.
  render({ ...world, state: { ...world.state, pause: Infinity } });
  connectHands(world);

  function collect(star: Star): void {
    const entry = { star, landed: false };
    world.stars = [...world.stars, entry];
    void markLanded(world, entry);
    chaseNext(world);
  }
  if (world.reduced) {
    return { collect };
  }
  function frame(now: number): void {
    tick(world, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { collect };
}
function setupLateCritter(critter: HTMLElement, appearsOn: string): void {
  document.addEventListener(
    appearsOn,
    () => {
      critter.hidden = false;
      critter.setAttribute("aria-hidden", "true");
      setupCritter(critter, "right");
    },
    { once: true },
  );
}

export { hopOffset, nearestIndex, setupCritter, setupLateCritter, step };
