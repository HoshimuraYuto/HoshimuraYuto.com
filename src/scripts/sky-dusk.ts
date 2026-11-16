import { smooth } from "../utils/math";

/** Scroll at which the dusk starts and the share of the window it takes to finish, as shares of the window height. */
const START = 0.04;
const SPAN = 0.36;
/** Sent on the hero when the veil has fully covered the sky and when it lifts again, so the sky can stop painting unseen. */
const SKY_HIDDEN = "sky-hidden";
const SKY_SHOWN = "sky-shown";
/**
 * How far the sky behind the page has darkened into the page colour, 0 to 1, for a scroll position.
 * It finishes before the log (Welcome.astro) rises to the horizon.
 */
function duskShare(scroll: number, height: number): number {
  if (height <= 0) {
    return 0;
  }
  return smooth(scroll / height, START, START + SPAN);
}
function setupSkyDusk(veil: HTMLElement, hero: HTMLElement): () => void {
  let frame = 0,
    hidden = false;
  function update(): void {
    const share = duskShare(scrollY, innerHeight);
    veil.style.opacity = share.toFixed(3);
    if (share >= 1 === hidden) {
      return;
    }
    hidden = share >= 1;
    hero.dispatchEvent(new Event(hidden ? SKY_HIDDEN : SKY_SHOWN));
  }
  function schedule(): void {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }
  update();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  return () => {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
  };
}

export { duskShare, setupSkyDusk, SKY_HIDDEN, SKY_SHOWN };
