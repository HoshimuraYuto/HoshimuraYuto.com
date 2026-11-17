/** Time between typed characters. */
const CHARACTER_MS = 30;

interface Typing {
  /** Types the text in after what is there, or retypes it from the start when it does not continue it. */
  write: (text: string) => void;
  /** Nothing more is coming: the caret goes. */
  settle: () => void;
  stop: () => void;
}

/**
 * Types text into a slot one character at a time, the way a terminal prints it; `data-typing` marks it for the caret.
 * Text appearing at once in a large block counts as a late Largest Contentful Paint; typed characters do not.
 */
function setupTyping(
  slot: HTMLElement,
  { reduced }: { reduced: boolean },
): Typing {
  let timer: ReturnType<typeof setInterval> | undefined,
    target = slot.textContent;
  function stop(): void {
    clearInterval(timer);
    timer = undefined;
  }
  function settle(): void {
    stop();
    slot.removeAttribute("data-typing");
  }
  function typeNext(node: Text): void {
    const next = target.slice(node.length, node.length + 1);
    if (next === "") {
      settle();
      return;
    }
    node.appendData(next);
  }
  function write(text: string): void {
    if (text === target) {
      return;
    }
    stop();
    target = text;
    if (reduced || text === "") {
      slot.textContent = text;
      settle();
      return;
    }
    if (!text.startsWith(slot.textContent)) {
      slot.textContent = "";
    }
    slot.toggleAttribute("data-typing", true);
    const node = slot.lastChild instanceof Text ? slot.lastChild : new Text();
    slot.append(node);
    timer = setInterval(() => {
      typeNext(node);
    }, CHARACTER_MS);
  }
  return { write, settle, stop };
}

export { setupTyping };
export type { Typing };
