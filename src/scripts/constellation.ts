import { STARS } from "../lib/sky/stars";
import type { CatalogueStar } from "../lib/sky/stars";
import { RAD } from "../utils/math";
import { seededRandom } from "../utils/random";
import { hash, normalizePath } from "../utils/url-seed";

/** A star placed on the chart, in viewBox units (0–100). */
export interface ChartStar {
  x: number;
  y: number;
  magnitude: number;
}

interface Constellation {
  /** Centre of the patch of sky, J2000.0 degrees. */
  ra: number;
  dec: number;
  stars: ChartStar[];
  /** Pairs of indices into `stars`. */
  lines: [number, number][];
}

interface Centre {
  ra: number;
  dec: number;
}

/** Half-width of the patch, degrees: wide enough to hold about 40 stars to magnitude 5. */
const RADIUS = 18;
/** Stars joined into the figure: only the brightest few, as in the old constellations. */
const FIGURE_STARS = 6;
/** Centres stay where the whole patch rises over Tokyo and short of the pole, where the chart would wrap. */
const DEC_MIN = -30;
const DEC_MAX = 70;
/** Gnomonic projection onto the chart; undefined outside the patch. East is on the left, as on a chart of the sky seen from below. */
function project(star: CatalogueStar, centre: Centre): ChartStar | undefined {
  const dRa = (star.ra - centre.ra) * RAD,
    dec = star.dec * RAD,
    dec0 = centre.dec * RAD,
    cosc =
      Math.sin(dec0) * Math.sin(dec) +
      Math.cos(dec0) * Math.cos(dec) * Math.cos(dRa);
  if (cosc < Math.cos(RADIUS * RAD)) {
    return undefined;
  }
  const scale = 50 / Math.tan(RADIUS * RAD),
    x = (Math.cos(dec) * Math.sin(dRa)) / cosc,
    y =
      (Math.cos(dec0) * Math.sin(dec) -
        Math.sin(dec0) * Math.cos(dec) * Math.cos(dRa)) /
      cosc;
  return { x: 50 - x * scale, y: 50 - y * scale, magnitude: star.magnitude };
}
function nearestLink(
  joined: readonly number[],
  stars: readonly ChartStar[],
): [number, number] {
  let best: [number, number] = [0, 0],
    shortest = Infinity;
  for (const from of joined) {
    const origin = stars[from];
    if (!origin) {
      continue;
    }
    stars.forEach((star, to) => {
      const length = joined.includes(to)
        ? Infinity
        : Math.hypot(star.x - origin.x, star.y - origin.y);
      if (length < shortest) {
        [shortest, best] = [length, [from, to]];
      }
    });
  }
  return best;
}
/** Joins the brightest stars by always taking the shortest next link, so the figure never crosses itself badly. */
function figureLines(stars: readonly ChartStar[]): [number, number][] {
  const bright = stars.slice(0, FIGURE_STARS),
    joined = [0],
    lines: [number, number][] = [];
  while (joined.length < bright.length) {
    const link = nearestLink(joined, bright);
    joined.push(link[1]);
    lines.push(link);
  }
  return lines;
}
function constellationFor(pathname: string): Constellation {
  const random = seededRandom(hash(normalizePath(pathname))),
    ra = random() * 360,
    low = Math.sin(DEC_MIN * RAD),
    // Even over the sphere's area rather than over declination, so no band of sky is favoured.
    dec = Math.asin(low + (Math.sin(DEC_MAX * RAD) - low) * random()) / RAD,
    stars = STARS.flatMap((star) => {
      const placed = project(star, { ra, dec });
      return placed ? [placed] : [];
    });
  return { ra, dec, stars, lines: figureLines(stars) };
}
/** Brighter stars are drawn larger; magnitude 5 stays just visible. */
function starRadius(magnitude: number): number {
  return Math.max(0.35, 1.6 - 0.25 * magnitude);
}
/** "赤経5時12分 赤緯+23°": where the patch is, in the units star charts use. */
function centreWords({ ra, dec }: Pick<Constellation, "ra" | "dec">): string {
  const minutes = Math.round((ra / 15) * 60) % (24 * 60),
    sign = dec < 0 ? "−" : "+";
  return `赤経${Math.floor(minutes / 60)}時${minutes % 60}分 赤緯${sign}${Math.abs(Math.round(dec))}°`;
}
function nameFor(pathname: string): string {
  const path = normalizePath(pathname);
  return path === "/" ? path : path.slice(1);
}
function svgElement(
  name: string,
  attributes: Record<string, number | string>,
): SVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}
function drawConstellation(
  svg: SVGElement,
  { stars, lines }: Constellation,
): void {
  const linked = lines.flatMap(([from, to]) => {
    const a = stars[from],
      b = stars[to];
    return a && b
      ? [svgElement("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y })]
      : [];
  });
  svg.replaceChildren(
    ...linked,
    ...stars.map((star) =>
      svgElement("circle", {
        cx: star.x,
        cy: star.y,
        r: starRadius(star.magnitude),
      }),
    ),
  );
}
function setupConstellation(root: HTMLElement, pathname: string): void {
  const constellation = constellationFor(pathname),
    svg = root.querySelector<SVGElement>("[data-constellation-chart]"),
    name = root.querySelector("[data-constellation-name]"),
    where = root.querySelector("[data-constellation-where]");
  if (svg) {
    drawConstellation(svg, constellation);
  }
  if (name) {
    name.textContent = nameFor(pathname);
  }
  if (where) {
    where.textContent = centreWords(constellation);
  }
}

export {
  centreWords,
  constellationFor,
  figureLines,
  nameFor,
  project,
  setupConstellation,
};
