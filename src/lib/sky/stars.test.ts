import { describe, expect, test } from "vitest";

import { referenceStar, separation } from "./reference.test-helper";
import { STARS, starPosition, visibleStars } from "./stars";

// Nutation (≤ 17″), annual aberration (≤ 20.5″), proper motion since 2000 (Arcturus ≈ 1′ by 2026) and GMST for GAST (≤ 17″) are left out: up to about 0.03°.
const STAR_TOLERANCE_DEG = 0.05;
const TOKYO = { latitude: 35.6586, longitude: 139.7454 };
function findStar(ra: number, dec: number) {
  const star = STARS.find(
    (s) => Math.abs(s.ra - ra) < 0.1 && Math.abs(s.dec - dec) < 0.1,
  );
  if (!star) {
    throw new Error(`no catalogue star at ${ra}, ${dec}`);
  }
  return star;
}
const NAMED = {
  Polaris: findStar(37.95, 89.26),
  Sirius: findStar(101.29, -16.72),
  Vega: findStar(279.23, 38.78),
  Arcturus: findStar(213.92, 19.18),
  Betelgeuse: findStar(88.79, 7.41),
};
const DATES = [
  new Date("2026-11-12T03:00:00Z"),
  new Date("2026-11-20T13:00:00Z"),
  new Date("2000-01-01T12:00:00Z"),
  new Date("2040-06-21T15:30:00Z"),
];
const CASES = DATES.flatMap((date) =>
  Object.entries(NAMED).map(([name, star]) => ({ name, star, date })),
);

describe(starPosition, () => {
  test.each(CASES)(
    "$name at $date matches astronomy-engine",
    ({ star, date }) => {
      expect(
        separation(
          starPosition(star, date, TOKYO),
          referenceStar(star, date, TOKYO),
        ),
      ).toBeLessThan(STAR_TOLERANCE_DEG);
    },
  );
});

describe(visibleStars, () => {
  test("keeps only stars above the horizon and no fainter than the limit, brightest first", () => {
    const stars = visibleStars(new Date("2026-11-20T13:00:00Z"), TOKYO, 2);

    expect(stars.length).toBeGreaterThan(5);
    expect(Math.min(...stars.map((s) => s.altitude))).toBeGreaterThan(0);
    expect(Math.max(...stars.map((s) => s.magnitude))).toBeLessThanOrEqual(2);
    expect(stars.map((s) => s.magnitude)).toStrictEqual(
      stars.map((s) => s.magnitude).toSorted((a, b) => a - b),
    );
  });
});
