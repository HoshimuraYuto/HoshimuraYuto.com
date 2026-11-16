/** Where the sky is seen from. Degrees; north and east are positive. */
interface Observer {
  latitude: number;
  longitude: number;
}

/** Direction in the observer's sky, degrees. Azimuth is from north, clockwise (90 = east, 180 = south). */
interface Horizontal {
  altitude: number;
  azimuth: number;
}

interface MoonState extends Horizontal {
  /** Lit part of the disc, 0 (new) to 1 (full). */
  illuminatedFraction: number;
  /** Direction of the bright limb as the observer sees it, degrees clockwise from straight up. */
  brightLimbAngle: number;
  waxing: boolean;
  /** Days since the previous new moon. */
  age: number;
}

interface VisibleStar extends Horizontal {
  magnitude: number;
  /** B−V colour index; 0 when the catalogue has none. */
  colorIndex: number;
}

interface Sky {
  date: Date;
  observer: Observer;
  sun: Horizontal;
  moon: MoonState;
  limitingMagnitude: number;
  /** Stars above the horizon and no fainter than `limitingMagnitude`, brightest first. */
  stars: VisibleStar[];
}

interface SunMoonSource {
  sun: (date: Date, observer: Observer) => Horizontal;
  moon: (date: Date, observer: Observer) => Horizontal;
  /** Lit fraction and phase (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter). */
  moonPhase: (date: Date) => { fraction: number; phase: number };
}

export type {
  Horizontal,
  MoonState,
  Observer,
  Sky,
  SunMoonSource,
  VisibleStar,
};
