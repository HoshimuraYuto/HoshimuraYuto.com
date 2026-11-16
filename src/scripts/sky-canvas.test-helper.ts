import { vi } from "vitest";

// jsdom has no canvas.

type ColorStop = [offset: number, color: string];
type DrawImageCall = [
  image: CanvasImageSource,
  ...place: [number, number, number, number],
];

function makeSpies(stops: ColorStop[]) {
  const gradient = {
    addColorStop: (offset: number, color: string): void => {
      stops.push([offset, color]);
    },
  };
  return {
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    createPattern: vi.fn(() => ({})),
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    getTransform: vi.fn(() => ({ a: 1 })),
    setTransform: vi.fn(),
    putImageData: vi.fn(),
    drawImage: vi.fn<(...call: DrawImageCall) => void>(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  };
}
function isContext(
  value: object,
  names: readonly string[],
): value is CanvasRenderingContext2D {
  return names.every((name) => name in value);
}
interface FakeContext {
  ctx: CanvasRenderingContext2D;
  spies: ReturnType<typeof makeSpies>;
  stops: ColorStop[];
}

function fakeContext(): FakeContext {
  const stops: ColorStop[] = [],
    spies = makeSpies(stops),
    ctx: object = spies;
  if (!isContext(ctx, Object.keys(spies))) {
    throw new Error("the fake context is incomplete");
  }
  return { ctx, spies, stops };
}
function stubCanvases(
  ctx: CanvasRenderingContext2D,
  size: readonly [number, number],
): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockReturnValue(new DOMRect(0, 0, size[0], size[1]));
}

export { fakeContext, stubCanvases };
