const FIRST_REPLY = "!";
// Replies to a run of pokes; the last one is too much, and it runs off to the other side.
const REPLIES = [FIRST_REPLY, "なに?", "くすぐったい", "…", "もう!"];
const SLEEP_REPLY = "zz…";
// A pause this long ends the run, so the next poke starts from the first reply again.
const RUN_GAP_MS = 2500;
const SHOW_MS = 1400;
function pokeReply(
  count: number,
  asleep = false,
): { text: string; flee: boolean } {
  if (asleep) {
    return { text: SLEEP_REPLY, flee: false };
  }
  const last = REPLIES.length - 1;
  return {
    text: REPLIES[Math.min(count, last)] ?? FIRST_REPLY,
    flee: count >= last,
  };
}
const hideTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
function say(critter: HTMLElement, text: string, { star = false } = {}): void {
  const bubble = critter.querySelector<HTMLElement>(".critter__say");
  if (!bubble) {
    return;
  }
  bubble.textContent = text;
  // The star is drawn in CSS: a font's ★ sits lower and smaller than the digits beside it.
  bubble.toggleAttribute("data-star", star);
  bubble.hidden = false;
  clearTimeout(hideTimers.get(bubble));
  hideTimers.set(
    bubble,
    setTimeout(() => (bubble.hidden = true), SHOW_MS),
  );
}
/** Restarting a CSS animation needs the class gone for one style recalculation, which reading a size forces. */
function restartSquash(critter: HTMLElement): void {
  critter.classList.remove("critter--poked");
  void critter.offsetWidth;
  critter.classList.add("critter--poked");
}
function setupPoke(
  critter: HTMLElement,
  { asleep, react }: { asleep: () => boolean; react: (flee: boolean) => void },
): void {
  let count = 0,
    runEnd: ReturnType<typeof setTimeout> | undefined;

  critter.addEventListener("click", () => {
    const reply = pokeReply(count, asleep());
    clearTimeout(runEnd);
    runEnd = setTimeout(() => (count = 0), RUN_GAP_MS);
    count = reply.flee ? 0 : count + 1;

    restartSquash(critter);
    say(critter, reply.text);
    react(reply.flee);
  });
}

export { pokeReply, say, setupPoke };
