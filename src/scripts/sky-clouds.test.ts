import { afterEach, describe, expect, test, vi } from "vitest";

import { fakeContext, stubCanvases } from "./sky-canvas.test-helper";
import {
  cloudColor,
  paintClouds,
  paintVeil,
  paintVeilOnGround,
} from "./sky-clouds";
import type { CellLight } from "./sky-clouds";
import type { Painter, Palette, Rgb } from "./sky-light";
import type { WeatherLook } from "./sky-look";
import type { Scene } from "./sky-scene";

const BLACK: Rgb = [0, 0, 0];
const PALETTE: Palette = {
  nightTop: BLACK,
  nightLow: BLACK,
  dayTop: BLACK,
  dayLow: BLACK,
  duskLow: [160, 110, 90],
  ground: BLACK,
  sun: [250, 250, 240],
  sunLow: [240, 150, 100],
  moon: [240, 235, 220],
  starBlue: BLACK,
  starWhite: BLACK,
  starRed: BLACK,
  cloudDay: [180, 190, 200],
  cloudShade: [70, 80, 90],
  cloudNight: [20, 22, 27],
  cloudNightLow: [58, 52, 50],
  veilDay: BLACK,
  veilNight: BLACK,
  snowDay: BLACK,
  snowNight: BLACK,
  fall: BLACK,
  dust: BLACK,
};
const SCENE: Scene = {
  width: 1280,
  height: 800,
  focal: 400,
  horizonAt: () => 512,
  day: 1,
  sunAltitude: 40,
  limitingMagnitude: -2,
  sun: [640, 200],
  moon: undefined,
  stars: [],
};
const NIGHT: Scene = { ...SCENE, day: 0, sunAltitude: -40, sun: undefined };
const LOOK: WeatherLook = {
  sheets: [],
  gloom: 0,
  veil: 0,
  fall: undefined,
  thunder: false,
};
const CELL: CellLight = { density: 0.5, lowness: 0, nearSun: 0, nearMoon: 0 };
function shading(
  scene: Scene,
  look: WeatherLook = LOOK,
): Pick<Painter, "scene" | "palette" | "look"> {
  return {
    scene,
    palette: PALETTE,
    look,
  };
}
function brightness(color: Rgb): number {
  return color[0] + color[1] + color[2];
}
const OVERCAST: WeatherLook = {
  ...LOOK,
  sheets: [{ cover: 1, scale: 1, opacity: 1, seed: 1, offset: [0, 0] }],
};
function paintingOn(scene: Scene, look?: WeatherLook) {
  const fake = fakeContext();
  stubCanvases(fake.ctx, [scene.width, scene.height]);
  return {
    ...fake,
    painter: { ctx: fake.ctx, scene, palette: PALETTE, look },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(paintClouds, () => {
  test("天気がなければ何も描かない", () => {
    const { painter, spies } = paintingOn(SCENE);

    paintClouds(painter);

    expect(spies.drawImage).not.toHaveBeenCalled();
  });

  test("太陽が雲の向こうにあれば、雲ごしの鈍い光を足す", () => {
    const { painter, spies, ctx } = paintingOn(SCENE, OVERCAST);

    paintClouds(painter);

    expect(spies.createRadialGradient).toHaveBeenCalledTimes(1);
    expect(spies.createRadialGradient.mock.calls[0]?.slice(0, 2)).toStrictEqual(
      [640, 200],
    );
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  test("太陽も月もない夜は、雲ごしの光を足さない", () => {
    const { painter, spies } = paintingOn(NIGHT, OVERCAST);

    paintClouds(painter);

    expect(spies.drawImage).toHaveBeenCalledTimes(1);
    expect(spies.createRadialGradient).not.toHaveBeenCalled();
  });

  test("昇っている月が雲の向こうにあれば、月の光を足す", () => {
    const moon = { x: 300, y: 150, altitude: 40, fraction: 1, litAngle: 0 },
      { painter, spies } = paintingOn({ ...NIGHT, moon }, OVERCAST);

    paintClouds(painter);

    expect(spies.createRadialGradient.mock.calls[0]?.slice(0, 2)).toStrictEqual(
      [300, 150],
    );
  });
});

describe(paintVeil, () => {
  test("幕がなければ何も描かない", () => {
    const { painter, spies } = paintingOn(SCENE, LOOK);

    paintVeil(painter);

    expect(spies.fillRect).not.toHaveBeenCalled();
  });
});

describe(paintVeilOnGround, () => {
  test("幕がなければ何も描かない", () => {
    const { painter, spies } = paintingOn(SCENE);

    paintVeilOnGround(painter);

    expect(spies.fillRect).not.toHaveBeenCalled();
  });
});

describe(cloudColor, () => {
  test("昼の雲は、雨を持つほど暗くする", () => {
    const fair = cloudColor(shading(SCENE), CELL),
      rainy = cloudColor(shading(SCENE, { ...LOOK, gloom: 0.9 }), CELL);

    expect(brightness(rainy)).toBeLessThan(brightness(fair));
  });

  test("夜の雲は昼より暗く、地平線に近いほど街明かりで明るくする", () => {
    const high = cloudColor(shading(NIGHT), CELL),
      low = cloudColor(shading(NIGHT), { ...CELL, lowness: 1 });

    expect(brightness(high)).toBeLessThan(
      brightness(cloudColor(shading(SCENE), CELL)),
    );
    expect(high).toStrictEqual(PALETTE.cloudNight);
    expect(low).toStrictEqual(PALETTE.cloudNightLow);
  });
});
