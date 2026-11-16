import { clamp, smooth } from "../utils/math";
import { latticeHash } from "../utils/random";
import type { CloudSheet } from "./sky-look";

/** Where a cell of the cloud field sits in the sky: `across` is sideways from the centre and `elevation` up from the horizon, both in focal lengths. */
interface FieldGrid {
  cols: number;
  rows: number;
  at: (
    col: number,
    row: number,
  ) => readonly [across: number, elevation: number] | undefined;
}

type Point = readonly [number, number];

interface Character {
  /** Direction the masses run along, radians. */
  turn: number;
  /** Length of the masses along that direction, relative to their width. */
  stretch: number;
  /** Fineness of the masses: above 1 they are smaller. */
  grain: number;
  /** How far the edges are torn out of line, in units of the noise. */
  tear: number;
  /** How unevenly the cloud is spread: banked up in one part of the sky, open in another. */
  bank: number;
  /** Width of the soft edge between cloud and clear sky, in noise value. */
  edge: number;
}

interface Shaped {
  seed: number;
  character: Character;
}

interface Places {
  cols: number;
  places: (Point | undefined)[];
}

const EDGE = 0.1;
const OCTAVES = 4;
/** Fineness, relative to the cloud masses, of the noise that tears their edges and of the one that banks them up. */
const TEAR_PITCH = 0.7;
const BANK_PITCH = 0.28;
/** Share of its thickness a cloud loses at its edge, and the noise value over which it thickens to the core. */
const THIN_EDGE = 0.2;
const CORE_DEPTH = 0.3;
const CHARACTER_SALT = 0x5e_ed;
function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    fx = smooth(x - x0, 0, 1),
    fy = smooth(y - y0, 0, 1),
    top =
      latticeHash(x0, y0, seed) +
      (latticeHash(x0 + 1, y0, seed) - latticeHash(x0, y0, seed)) * fx,
    bottom =
      latticeHash(x0, y0 + 1, seed) +
      (latticeHash(x0 + 1, y0 + 1, seed) - latticeHash(x0, y0 + 1, seed)) * fx;
  return top + (bottom - top) * fy;
}
/** Share of a texture that survives when one cell spans `span` of its units: finer than a cell it would fall between cells and show as speckle. */
function kept(span: number): number {
  return 1 - smooth(span, 0.5, 1);
}
/** Noise summed over octaves, each twice as fine and half as strong, 0 to 1. Octaves too fine for the cells are left out. */
function cloudNoise(at: Point, seed: number, span: number): number {
  let sum = 0,
    weight = 0;
  for (let octave = 0; octave < OCTAVES; octave += 1) {
    const pitch = 2 ** octave,
      gain = 0.5 ** octave * kept(span * pitch);
    sum += gain * valueNoise(at[0] * pitch, at[1] * pitch, seed + octave);
    weight += gain;
  }
  return weight > 0 ? 0.5 + (sum / weight - 0.5) * kept(span) : 0.5;
}
/** The same report always gives the same character, and another report another: the shape must not be the one thing that never changes. */
function characterFor(seed: number): Character {
  function share(salt: number): number {
    return latticeHash(salt, CHARACTER_SALT, seed);
  }
  return {
    turn: share(1) * Math.PI,
    stretch: 1 + 1.8 * share(2) ** 2,
    grain: 0.65 + 0.9 * share(3),
    tear: 0.3 + 1.1 * share(4),
    bank: 0.1 + 0.4 * share(5),
    edge: EDGE * (0.6 + 1.2 * share(6)),
  };
}
function shapedNoise(
  at: Point,
  span: number,
  { seed, character: c }: Shaped,
): number {
  const [x, y] = at,
    tear = c.tear * kept(span * TEAR_PITCH),
    tornX =
      x + tear * (valueNoise(x * TEAR_PITCH, y * TEAR_PITCH, seed + 31) - 0.5),
    tornY =
      y + tear * (valueNoise(x * TEAR_PITCH, y * TEAR_PITCH, seed + 47) - 0.5),
    along = (tornX * Math.cos(c.turn) + tornY * Math.sin(c.turn)) / c.stretch,
    across = tornY * Math.cos(c.turn) - tornX * Math.sin(c.turn),
    bank = valueNoise(x * BANK_PITCH, y * BANK_PITCH, seed + 97) - 0.5;
  return (
    cloudNoise([along * c.grain, across * c.grain], seed, span * c.grain) +
    c.bank * kept(span * BANK_PITCH) * bank
  );
}
/** The noise value above which exactly `cover` of the cells are cloud. */
function cutFor(values: readonly number[], cover: number): number {
  const sorted = values.toSorted((a, b) => a - b),
    index = clamp(
      Math.round((1 - cover) * sorted.length),
      0,
      sorted.length - 1,
    );
  return sorted[index] ?? 1;
}
function placesOf(grid: FieldGrid): (Point | undefined)[] {
  const places: (Point | undefined)[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      places.push(grid.at(col, row));
    }
  }
  return places;
}
/** Where a place of the sky falls on the sheet. The sheet is a level deck seen from below: towards the horizon it runs away into the distance and its masses pack together. */
function deckAt(
  place: Point | undefined,
  sheet: CloudSheet,
): Point | undefined {
  if (!place) {
    return undefined;
  }
  const distance = 1 / (Math.max(0, place[1]) + 0.16);
  return [
    place[0] * distance * 0.9 * sheet.scale + sheet.offset[0],
    distance * 1.4 * sheet.scale + sheet.offset[1],
  ];
}
/** How far apart two neighbouring cells are on the sheet, in units of the noise. */
function spanBetween(at: Point, neighbour: Point | undefined): number {
  return neighbour
    ? Math.max(Math.abs(neighbour[0] - at[0]), Math.abs(neighbour[1] - at[1]))
    : 0;
}
/** The nearest cell straight above that lies elsewhere on the sheet: the rows at and under the horizon all fall on the same place. */
function cellAbove(
  decks: readonly (Point | undefined)[],
  index: number,
  cols: number,
): Point | undefined {
  const away = decks[index]?.[1];
  for (let above = index - cols; above >= 0; above -= cols) {
    const place = decks[above];
    if (!place || place[1] !== away) {
      return place;
    }
  }
  return undefined;
}
/** The widest step from a cell to the cells around it. All four are measured: at the horizon the row above is far away on the sheet while the row below is not. */
function spanAround(
  decks: readonly (Point | undefined)[],
  index: number,
  cols: number,
): number {
  const at = decks[index],
    col = index % cols;
  if (!at) {
    return 0;
  }
  return Math.max(
    col > 0 ? spanBetween(at, decks[index - 1]) : 0,
    col < cols - 1 ? spanBetween(at, decks[index + 1]) : 0,
    spanBetween(at, cellAbove(decks, index, cols)),
    spanBetween(at, decks[index + cols]),
  );
}
function sheetValues(sheet: CloudSheet, field: Places): (number | undefined)[] {
  const decks = field.places.map((place) => deckAt(place, sheet)),
    shaped: Shaped = {
      seed: sheet.seed,
      character: characterFor(sheet.seed),
    };
  return decks.map((at, index) =>
    at
      ? shapedNoise(at, spanAround(decks, index, field.cols), shaped)
      : undefined,
  );
}
function sheetDensity(sheet: CloudSheet, field: Places): number[] {
  const values = sheetValues(sheet, field),
    { edge } = characterFor(sheet.seed),
    cut = cutFor(
      values.filter((value) => value !== undefined),
      sheet.cover,
    );
  return values.map((value) => {
    if (value === undefined) {
      return 0;
    }
    // A whole sky of cloud has no gaps to cut, only thicker and thinner parts.
    if (sheet.cover >= 1) {
      return (0.75 + 0.25 * clamp(value, 0, 1)) * sheet.opacity;
    }
    const core =
      1 - THIN_EDGE + THIN_EDGE * smooth(value, cut, cut + CORE_DEPTH);
    return smooth(value, cut - edge, cut + edge) * core * sheet.opacity;
  });
}
/** How much cloud lies over each cell, 0 to 1, row by row. Layers hide the sky one behind another. */
function cloudField(
  sheets: readonly CloudSheet[],
  grid: FieldGrid,
): Float32Array {
  const clear = new Float32Array(grid.cols * grid.rows).fill(1),
    field: Places = { cols: grid.cols, places: placesOf(grid) };
  for (const sheet of sheets) {
    for (const [index, density] of sheetDensity(sheet, field).entries()) {
      clear[index] = (clear[index] ?? 1) * (1 - density);
    }
  }
  return clear.map((value) => 1 - value);
}

export { cloudField, valueNoise };
export type { FieldGrid };
