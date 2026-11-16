import type { Horizontal, Sky } from "../lib/sky/sky";
import { interpolate } from "../utils/interpolate";
import { clamp, RAD, smooth } from "../utils/math";

type Vec3 = readonly [number, number, number];
type Point = readonly [number, number];

interface SceneStar {
  x: number;
  y: number;
  altitude: number;
  magnitude: number;
  colorIndex: number;
}

interface SceneMoon {
  x: number;
  y: number;
  altitude: number;
  fraction: number;
  /** Screen angle of the bright limb, radians, canvas convention (0 = right, clockwise). */
  litAngle: number;
}

interface Scene {
  width: number;
  height: number;
  /** Focal length of the projection, px. */
  focal: number;
  horizonAt: (x: number) => number;
  /** 0 at night, 1 in full day. */
  day: number;
  sunAltitude: number;
  limitingMagnitude: number;
  sun: Point | undefined;
  moon: SceneMoon | undefined;
  stars: SceneStar[];
}

/** Altitude the view is centred on, degrees. */
const VIEW_ALTITUDE = 30;
/** Horizon straight ahead, as a share of the height. The name sits on the ground below it. */
const HORIZON_SHARE = 0.64;
/** Furthest the view turns from due south, degrees, so a narrow screen can follow the sun. */
const MAX_TURN = 72;
/** Size of a nudge along the sky, radians, used to find screen directions. */
const NUDGE = 0.002;
/** Sun altitude of civil twilight, degrees: above it the sky reads as day. */
const CIVIL_TWILIGHT_DEG = -6;
/** Screen widths per focal length: a wide screen shows this much of the sky across. */
const WIDTHS_PER_FOCAL = 3.07;
/** Smallest focal length as a share of the height, so a tall narrow screen is not zoomed out to a fisheye. */
const MIN_FOCAL_SHARE = 0.5;
/** Directions further behind the view than this cosine are left out: the projection blows them up without bound. */
const BEHIND_CUTOFF = -0.4;
/** Sun altitude, degrees, from which its disc is drawn: its glow shows a little before it rises. */
const SUN_DRAWN_FROM_DEG = -1;
/** Horizon samples: azimuths either side of the view centre and the step between them, degrees. */
const HORIZON_SPAN_DEG = 130;
const HORIZON_STEP_DEG = 3;
/** Stars this far outside the screen, px, are kept so their glow still reaches the edge. */
const STAR_MARGIN = 20;
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/** Unit vector in the frame [south, west, up]; the library's azimuth counts from north, clockwise. */
function toVector({ altitude, azimuth }: Horizontal): Vec3 {
  const c = Math.cos(altitude * RAD);
  return [
    -c * Math.cos(azimuth * RAD),
    -c * Math.sin(azimuth * RAD),
    Math.sin(altitude * RAD),
  ];
}
/** Azimuth measured from south, west positive, degrees. */
function fromSouth(azimuth: number): number {
  return ((azimuth + 360) % 360) - 180;
}
function focalFor(width: number, height: number): number {
  return Math.max(width / WIDTHS_PER_FOCAL, height * MIN_FOCAL_SHARE);
}
/** What a narrow screen turns towards: the sun until it is well down, then the moon while it is up. */
function viewTarget(sky: Sky): Horizontal | undefined {
  if (sky.sun.altitude > CIVIL_TWILIGHT_DEG) {
    return sky.sun;
  }
  return sky.moon.altitude > 0 ? sky.moon : undefined;
}
/** Facing south; a screen too narrow for the whole southern sky turns towards the sun, or the moon at night. */
function viewAzimuth(sky: Sky, width: number, focal: number): number {
  const turn = Math.max(
      0,
      MAX_TURN - (2 * Math.atan(width / (4 * focal))) / RAD,
    ),
    target = viewTarget(sky);
  return target ? clamp(fromSouth(target.azimuth), -turn, turn) : 0;
}
/** Stereographic projection looking towards azc (from south, west positive) at VIEW_ALTITUDE. */
function makeProjection(
  azc: number,
  focal: number,
  center: Point,
): (v: Vec3) => Point | undefined {
  const a = azc * RAD,
    alt = VIEW_ALTITUDE * RAD,
    c: Vec3 = [
      Math.cos(alt) * Math.cos(a),
      Math.cos(alt) * Math.sin(a),
      Math.sin(alt),
    ],
    r: Vec3 = [-Math.sin(a), Math.cos(a), 0],
    u: Vec3 = [
      c[1] * r[2] - c[2] * r[1],
      c[2] * r[0] - c[0] * r[2],
      c[0] * r[1] - c[1] * r[0],
    ];
  return (v): Point | undefined => {
    const dc = dot(v, c);
    if (dc < BEHIND_CUTOFF) {
      return undefined;
    }
    const k = (2 * focal) / (1 + dc);
    return [center[0] + k * dot(v, r), center[1] - k * dot(v, u)];
  };
}
/** In this projection the horizon curves up towards the sides, so its height depends on x. */
function horizonCurve(
  project: (v: Vec3) => Point | undefined,
  azc: number,
): (x: number) => number {
  const points: Point[] = [];
  for (
    let a = -HORIZON_SPAN_DEG;
    a <= HORIZON_SPAN_DEG;
    a += HORIZON_STEP_DEG
  ) {
    const p = project([
      Math.cos((azc + a) * RAD),
      Math.sin((azc + a) * RAD),
      0,
    ]);
    if (p) {
      points.push(p);
    }
  }
  points.sort((p, q) => p[0] - q[0]);
  return (x) => interpolate(points, x);
}
/** Screen angle of "up" (towards the zenith) at a point in the sky. */
function screenUpAngle(
  project: (v: Vec3) => Point | undefined,
  at: Horizontal,
): number {
  const p = project(toVector(at)),
    q = project(
      toVector({ altitude: at.altitude + NUDGE / RAD, azimuth: at.azimuth }),
    );
  return p && q ? Math.atan2(q[1] - p[1], q[0] - p[0]) : -Math.PI / 2;
}
function placeMoon(
  sky: Sky,
  project: (v: Vec3) => Point | undefined,
): SceneMoon | undefined {
  const p = project(toVector(sky.moon));
  if (!p) {
    return undefined;
  }
  return {
    x: p[0],
    y: p[1],
    altitude: sky.moon.altitude,
    fraction: sky.moon.illuminatedFraction,
    /** On a south-facing screen, clockwise on the sky (towards the west) is clockwise on screen too. */
    litAngle: screenUpAngle(project, sky.moon) + sky.moon.brightLimbAngle * RAD,
  };
}
function placeStars(
  sky: Sky,
  project: (v: Vec3) => Point | undefined,
  size: Point,
): SceneStar[] {
  return sky.stars.flatMap((star) => {
    const p = project(toVector(star));
    return p &&
      p[0] > -STAR_MARGIN &&
      p[0] < size[0] + STAR_MARGIN &&
      p[1] > -STAR_MARGIN &&
      p[1] < size[1]
      ? [
          {
            x: p[0],
            y: p[1],
            altitude: star.altitude,
            magnitude: star.magnitude,
            colorIndex: star.colorIndex,
          },
        ]
      : [];
  });
}
function sceneFor(sky: Sky, width: number, height: number): Scene {
  const focal = focalFor(width, height),
    azc = viewAzimuth(sky, width, focal),
    horizonY = height * HORIZON_SHARE,
    project = makeProjection(azc, focal, [
      width / 2,
      horizonY - 2 * Math.tan((VIEW_ALTITUDE * RAD) / 2) * focal,
    ]),
    sun =
      sky.sun.altitude > SUN_DRAWN_FROM_DEG
        ? project(toVector(sky.sun))
        : undefined;
  return {
    width,
    height,
    focal,
    horizonAt: horizonCurve(project, azc),
    day: smooth(sky.sun.altitude, -8, 8),
    sunAltitude: sky.sun.altitude,
    limitingMagnitude: sky.limitingMagnitude,
    sun,
    moon: placeMoon(sky, project),
    stars: placeStars(sky, project, [width, height]),
  };
}

export { CIVIL_TWILIGHT_DEG, HORIZON_SHARE, sceneFor, toVector };
export type { Scene, SceneMoon };
