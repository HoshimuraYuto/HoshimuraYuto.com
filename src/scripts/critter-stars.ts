/**
 * Clicking the sky drops a star from that point; the critter (critter.ts) runs to pick it up.
 */
export interface Star {
  /** Where it lands, px from the left of the window. */
  x: number;
  element: HTMLElement;
  landed: Promise<void>;
}

/** px per second squared: slower than the critter's own fall, so the star is seen dropping. */
const GRAVITY = 1400;
/** Stars on screen at once; past this a click drops nothing until the critter catches up. */
const MAX_STARS = 12;
/** Clicks on these keep their own meaning and drop nothing. */
const OWN_CLICK = "a, button, summary, details, input, label, .critter";
function starTop(from: number, seconds: number, ground: number): number {
  return Math.min(ground, from + (GRAVITY * seconds * seconds) / 2);
}
function dropsStar(target: EventTarget | null): boolean {
  return !(target instanceof Element && target.closest(OWN_CLICK));
}
function fallStar(
  element: HTMLElement,
  from: number,
  ground: number,
): Promise<void> {
  return new Promise((resolve) => {
    const begin = performance.now();
    function frame(now: number): void {
      const top = starTop(from, (now - begin) / 1000, ground);
      element.style.translate = `0 ${top - from}px`;
      if (top < ground) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}
function setupStars(
  sky: HTMLElement,
  {
    prototype,
    layer,
    drop,
  }: {
    prototype: HTMLTemplateElement;
    layer: HTMLElement;
    drop: (star: Star) => void;
  },
): void {
  // The sky is drawn behind the whole window, wider than the hero's column: any click above the hero's bottom is on it.
  document.addEventListener("click", (event) => {
    if (
      event.clientY > sky.getBoundingClientRect().bottom ||
      !dropsStar(event.target) ||
      layer.querySelectorAll(".critter-star").length >= MAX_STARS
    ) {
      return;
    }
    const made = prototype.content.firstElementChild?.cloneNode(true);
    if (!(made instanceof HTMLElement)) {
      return;
    }
    made.style.left = `${event.clientX}px`;
    made.style.top = `${event.clientY}px`;
    layer.append(made);
    drop({
      x: event.clientX,
      element: made,
      landed: fallStar(made, event.clientY, innerHeight - made.offsetHeight),
    });
  });
}

export { dropsStar, setupStars, starTop };
