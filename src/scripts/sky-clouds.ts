import { smooth } from "../utils/math";
import { cloudField } from "./sky-cloud-field";
import type { FieldGrid } from "./sky-cloud-field";
import { deviceScale, glow, mix, rgba } from "./sky-light";
import type { Painter, Rgb } from "./sky-light";
import type { Scene } from "./sky-scene";

/** The cloud field laid over the screen: one value per cell of CELL px. */
interface CloudMap {
  cols: number;
  rows: number;
  density: Float32Array;
  /** Height above the horizon of each cell, in focal lengths; negative below it. */
  elevation: (col: number, row: number) => number;
}

interface CellLight {
  density: number;
  lowness: number;
  nearSun: number;
  nearMoon: number;
}

/** Size of a cell of the cloud field, px. The field is drawn enlarged, which is what makes the clouds soft. */
const CELL = 10;
/** Cells below the horizon by more than this, in focal lengths, hold no cloud. */
const BELOW_HORIZON = 0.04;
/** Width of a strip of the veil on the ground, px: narrow enough that the steps between strips do not show. */
const VEIL_STRIP_PX = 4;
/** 1 at the lamp, falling off to nothing a few `reach` away. */
function nearness(
  lamp: readonly [number, number] | undefined,
  point: readonly [number, number],
  reach: number,
): number {
  return lamp
    ? Math.exp(
        -(
          ((point[0] - lamp[0]) / reach) ** 2 +
          ((point[1] - lamp[1]) / reach) ** 2
        ),
      )
    : 0;
}
function makeMap({ scene: s, look }: Painter): CloudMap | undefined {
  if (!look || look.sheets.length === 0) {
    return undefined;
  }
  const cols = Math.ceil(s.width / CELL);
  const rows =
    Math.ceil((s.horizonAt(s.width / 2) + BELOW_HORIZON * s.focal) / CELL) + 1;
  function elevation(col: number, row: number): number {
    return (s.horizonAt((col + 0.5) * CELL) - (row + 0.5) * CELL) / s.focal;
  }
  const grid: FieldGrid = {
    cols,
    rows,
    at: (col, row) => {
      const up = elevation(col, row);
      return up < -BELOW_HORIZON
        ? undefined
        : [((col + 0.5) * CELL - s.width / 2) / s.focal, up];
    },
  };
  return { cols, rows, density: cloudField(look.sheets, grid), elevation };
}
/** By day a cloud is grey, darker where it is thick or carries rain; by night it is lit from below by the city. */
function cloudColor(
  { scene: s, palette: p, look }: Pick<Painter, "scene" | "palette" | "look">,
  light: CellLight,
): Rgb {
  const gloom = look?.gloom ?? 0,
    dusk = smooth(s.sunAltitude, -12, -2) * (1 - smooth(s.sunAltitude, 0, 10)),
    sunColor = mix(p.sun, p.sunLow, 1 - smooth(s.sunAltitude, 0, 14)),
    shaded = mix(
      p.cloudDay,
      p.cloudShade,
      Math.min(1, 0.85 * gloom + 0.3 * light.density),
    ),
    lit = mix(shaded, sunColor, 0.55 * light.nearSun * (1 - 0.6 * gloom)),
    day = mix(lit, p.duskLow, 0.4 * dusk * light.lowness),
    night = mix(
      mix(p.cloudNight, p.cloudNightLow, light.lowness),
      p.moon,
      0.22 * light.nearMoon * (s.moon?.fraction ?? 0),
    );
  return mix(night, day, s.day);
}
function lightAt(
  map: CloudMap,
  scene: Scene,
  cell: readonly [number, number],
): CellLight {
  const [col, row] = cell,
    point = [(col + 0.5) * CELL, (row + 0.5) * CELL] as const,
    moon =
      scene.moon && scene.moon.altitude > 0
        ? ([scene.moon.x, scene.moon.y] as const)
        : undefined;
  return {
    density: map.density[row * map.cols + col] ?? 0,
    lowness: 1 - smooth(map.elevation(col, row), 0, 0.9),
    nearSun: nearness(scene.sun, point, scene.focal * 0.5),
    nearMoon: nearness(moon, point, scene.focal * 0.35),
  };
}
function renderMap(
  painter: Painter,
  map: CloudMap,
): HTMLCanvasElement | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = map.cols;
  canvas.height = map.rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return undefined;
  }
  const image = ctx.createImageData(map.cols, map.rows);
  for (let row = 0; row < map.rows; row += 1) {
    for (let col = 0; col < map.cols; col += 1) {
      const light = lightAt(map, painter.scene, [col, row]),
        [r, g, b] = cloudColor(painter, light);
      image.data.set(
        [r, g, b, 255 * light.density],
        (row * map.cols + col) * 4,
      );
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
function densityAt(map: CloudMap, at: readonly [number, number]): number {
  const col = Math.floor(at[0] / CELL),
    row = Math.floor(at[1] / CELL);
  return col >= 0 && col < map.cols && row >= 0
    ? (map.density[row * map.cols + col] ?? 0)
    : 0;
}
/** A lamp behind cloud does not go out: its light spreads through the cloud as a wide dull patch. */
function paintThroughCloud(painter: Painter, map: CloudMap): void {
  const { ctx, scene: s, palette: p, look } = painter,
    gloom = look?.gloom ?? 0;
  ctx.globalCompositeOperation = "lighter";
  if (s.sun) {
    glow(ctx, {
      at: s.sun,
      radius: s.focal * 0.55,
      color: mix(p.sun, p.sunLow, 1 - smooth(s.sunAltitude, 0, 14)),
      alpha:
        0.32 * densityAt(map, s.sun) * (1 - 0.7 * gloom) * (0.4 + 0.6 * s.day),
    });
  }
  if (s.moon && s.moon.altitude > 0) {
    const at = [s.moon.x, s.moon.y] as const;
    glow(ctx, {
      at,
      radius: s.focal * 0.3,
      color: p.moon,
      alpha:
        0.2 *
        s.moon.fraction *
        densityAt(map, at) *
        (1 - 0.7 * gloom) *
        (1 - 0.6 * s.day),
    });
  }
  ctx.globalCompositeOperation = "source-over";
}
/** Clouds cover what is behind them, so they are laid over the lamps of the sky rather than added to them. */
function paintClouds(painter: Painter): void {
  const map = makeMap(painter),
    bitmap = map && renderMap(painter, map);
  if (!map || !bitmap) {
    return;
  }
  const { ctx } = painter;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, map.cols * CELL, map.rows * CELL);
  paintThroughCloud(painter, map);
}
/** Grey for water in the air; dust, sand, ash and smoke tint it towards the colour of dust, dimmed at night. */
function veilColor({
  scene: s,
  palette: p,
  look,
}: Pick<Painter, "scene" | "palette" | "look">): Rgb {
  const grey = mix(p.veilNight, p.veilDay, s.day),
    dust = mix(p.veilNight, p.dust, 0.3 + 0.7 * s.day);
  return mix(grey, dust, look?.dust ?? 0);
}
function paintFunnel({ ctx, scene: s, palette: p, look }: Painter): void {
  if (look?.funnel !== true) {
    return;
  }
  const foot = s.width * 0.7,
    ground = s.horizonAt(foot),
    // A funnel hangs from a low cloud base; a column from the top of the sky looks like a pillar instead.
    top = ground * 0.55,
    width = s.focal * 0.16,
    color = mix(p.cloudNight, p.cloudShade, s.day),
    steps = 48;
  // Built from soft blots rather than a filled outline, so it has no edge, like every cloud here.
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps,
      radius = width * (1 - t) ** 2.2 + width * 0.06,
      // The top is dragged along by the wind aloft, so the funnel leans and bends.
      x = foot + width * 1.2 * (1 - t) ** 2,
      y = top + (ground - top) * t,
      g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, rgba(color, 0.22));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}
function paintVeil(painter: Painter): void {
  const { ctx, scene: s, look } = painter;
  if (!look || look.veil <= 0) {
    return;
  }
  const horizon = s.horizonAt(s.width / 2),
    color = veilColor(painter),
    g = ctx.createLinearGradient(0, 0, 0, horizon);
  // Thin air is thickest low down; thick air (dense fog, a dust storm) hides the zenith too.
  g.addColorStop(0, rgba(color, look.veil * (0.5 + 0.45 * look.veil)));
  g.addColorStop(1, rgba(color, 0.96 * look.veil));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s.width, s.height);
}
/** In thick air the horizon has no line: the veil runs on over the edge of the ground. */
function paintVeilOnGround(painter: Painter): void {
  const { ctx, scene: s, look } = painter;
  if (!look || look.veil <= 0) {
    return;
  }
  const color = veilColor(painter);
  const above = s.height * 0.1;
  const below = s.height * 0.22;
  const strips = Math.ceil(s.width / VEIL_STRIP_PX);
  const strip = s.width / strips;
  const ratio = deviceScale(ctx);
  // Strips meet on whole device pixels: the veil is translucent, so a column two strips share is painted twice and shows as a thin line.
  function edgeOf(index: number): number {
    return Math.round(index * strip * ratio) / ratio;
  }
  const g = ctx.createLinearGradient(0, -above, 0, below);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(above / (above + below), rgba(color, 0.7 * look.veil));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  for (let i = 0; i < strips; i += 1) {
    ctx.save();
    ctx.translate(0, s.horizonAt((i + 0.5) * strip));
    ctx.fillRect(edgeOf(i), -above, edgeOf(i + 1) - edgeOf(i), above + below);
    ctx.restore();
  }
}

export { cloudColor, paintClouds, paintFunnel, paintVeil, paintVeilOnGround };
export type { CellLight };
