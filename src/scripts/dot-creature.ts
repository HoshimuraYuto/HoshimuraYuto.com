import { seededRandom } from "../utils/random";
import { hash, normalizePath } from "../utils/url-seed";

interface Cell {
  x: number;
  y: number;
}

const SIZE = 10;
const HALF = SIZE / 2;
/** Fill chance at the middle row, and how much it falls per row away from it: the body is round, not square. */
const FILL = 0.55;
const TAPER = 0.05;
/** Salted so the creature is not drawn from the same numbers as the constellation on the same page. */
const SALT = "#creature";
/** A left–right symmetric creature on a 10 × 10 grid: the left half is rolled, the right half mirrors it. */
function creatureCells(pathname: string): Cell[] {
  const random = seededRandom(hash(normalizePath(pathname) + SALT));
  return Array.from({ length: SIZE * HALF }, (_, index) => ({
    x: index % HALF,
    y: Math.floor(index / HALF),
  }))
    .filter(({ y }) => random() < FILL - Math.abs(y - HALF) * TAPER)
    .flatMap((cell) => [cell, { x: SIZE - 1 - cell.x, y: cell.y }]);
}
function drawCreature(svg: SVGElement, cells: readonly Cell[]): void {
  svg.replaceChildren(
    ...cells.map(({ x, y }) => {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", "1");
      rect.setAttribute("height", "1");
      return rect;
    }),
  );
}

export { creatureCells, drawCreature };
