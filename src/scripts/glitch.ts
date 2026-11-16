const GLITCH_COMPLETE = "glitch:complete";
const STATUS_MS = 6000;
function huntMessage(left: number): string {
  return left > 0
    ? `あと${left}つ、まだどこかがずれている`
    : "ぜんぶ直った。お礼に1匹増えた";
}
function isBroken(glitch: HTMLElement): boolean {
  return glitch.dataset["fixed"] === undefined;
}
function setupGlitchHunt(root: ParentNode, status: HTMLElement): void {
  const glitches = [...root.querySelectorAll<HTMLElement>("[data-glitch]")];
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function announce(fixed: number, message: string): void {
    const count = status.querySelector("[data-glitch-count]"),
      text = status.querySelector("[data-glitch-message]");
    if (count !== null) {
      count.textContent = `${fixed}/${glitches.length}`;
    }
    if (text !== null) {
      text.textContent = message;
    }
    status.dataset["visible"] = "";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      delete status.dataset["visible"];
    }, STATUS_MS);
  }
  function fix(glitch: HTMLElement): void {
    if (!isBroken(glitch)) {
      return;
    }
    glitch.dataset["fixed"] = "";
    glitch.removeAttribute("aria-describedby");
    // Fixed, it no longer does anything, so it should not read as a button still to press.
    glitch.setAttribute("aria-disabled", "true");

    const left = glitches.filter(isBroken).length;
    announce(glitches.length - left, huntMessage(left));
    if (left === 0) {
      status.dispatchEvent(new CustomEvent(GLITCH_COMPLETE, { bubbles: true }));
    }
  }

  for (const glitch of glitches) {
    glitch.addEventListener("click", () => {
      fix(glitch);
    });
  }
}

export { GLITCH_COMPLETE, setupGlitchHunt };
