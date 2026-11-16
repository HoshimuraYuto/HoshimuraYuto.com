/**
 * Picking the critter up and letting it drop. Heights are px above the bottom of the window.
 */
type CarryMode = "ground" | "held" | "falling";

export interface Carry {
  mode: CarryMode;
  y: number;
  /** Falling speed, px per second downwards. */
  vy: number;
}

/** px per second squared: a drop from mid-screen lands in about half a second. */
const GRAVITY = 2400;
/** A mouse must move this far (px) before a press counts as picking up rather than a poke. */
const LIFT_DISTANCE = 6;
/** On touch a hold this long (ms) picks it up, so a quick tap stays a poke. */
const HOLD_MS = 350;
function grounded(): Carry {
  return { mode: "ground", y: 0, vy: 0 };
}
function fall(carry: Carry, dt: number): Carry {
  const vy = carry.vy + GRAVITY * dt,
    y = carry.y - vy * dt;
  return y <= 0 ? grounded() : { mode: "falling", y, vy };
}
interface CarryHooks {
  lift: () => void;
  move: (x: number, y: number) => void;
  release: () => void;
}
interface Press {
  pointerId: number;
  x: number;
  y: number;
  at: number;
  touch: boolean;
}
interface Grip {
  press: Press | undefined;
  holding: boolean;
  /** Set on release, so the click that follows is not taken as a poke. */
  justCarried: boolean;
}

/** A mouse lifts by moving; touch lifts by holding, since a finger moving at once is a scroll or a tap. */
function liftsAt(press: Press, event: PointerEvent): boolean {
  return press.touch
    ? event.timeStamp - press.at >= HOLD_MS
    : Math.hypot(event.clientX - press.x, event.clientY - press.y) >=
        LIFT_DISTANCE;
}
function onMove(grip: Grip, hooks: CarryHooks, event: PointerEvent): void {
  if (!grip.press) {
    return;
  }
  if (!grip.holding && liftsAt(grip.press, event)) {
    grip.holding = true;
    hooks.lift();
  }
  if (grip.holding) {
    hooks.move(event.clientX, event.clientY);
  }
}
/** A release is followed by a click, which must not count as a poke; a cancel is not. */
function onEnd(grip: Grip, hooks: CarryHooks, released: boolean): void {
  grip.press = undefined;
  if (!grip.holding) {
    return;
  }
  grip.holding = false;
  grip.justCarried = released;
  hooks.release();
}
function pressOf(event: PointerEvent): Press | undefined {
  if (!event.isPrimary || event.button !== 0) {
    return undefined;
  }
  return {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    at: event.timeStamp,
    touch: event.pointerType !== "mouse",
  };
}
function isPress(grip: Grip, event: PointerEvent): boolean {
  return grip.press?.pointerId === event.pointerId;
}
function setupCarry(critter: HTMLElement, hooks: CarryHooks): void {
  const grip: Grip = { press: undefined, holding: false, justCarried: false };
  critter.addEventListener("pointerdown", (event) => {
    const press = pressOf(event);
    if (press) {
      grip.press = press;
      grip.justCarried = false;
      critter.setPointerCapture(event.pointerId);
    }
  });
  critter.addEventListener("pointermove", (event) => {
    if (isPress(grip, event)) {
      onMove(grip, hooks, event);
    }
  });
  critter.addEventListener("pointerup", (event) => {
    if (isPress(grip, event)) {
      onEnd(grip, hooks, true);
    }
  });
  critter.addEventListener("pointercancel", (event) => {
    if (isPress(grip, event)) {
      onEnd(grip, hooks, false);
    }
  });
  // Letting go after a carry must not also count as a poke (critter-poke.ts listens for the click).
  critter.addEventListener(
    "click",
    (event) => {
      if (grip.justCarried) {
        grip.justCarried = false;
        event.stopImmediatePropagation();
      }
    },
    { capture: true },
  );
  // A long press on touch would otherwise open the browser's menu over the critter.
  critter.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}

export { fall, grounded, setupCarry };
