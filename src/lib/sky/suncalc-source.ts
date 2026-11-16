import { getMoonIllumination, getMoonPosition, getPosition } from "suncalc";

import type { SunMoonSource } from "./types";

// suncalc 2.x already works in degrees with azimuth from north, clockwise, which is this module's convention.
const suncalcSource: SunMoonSource = {
  sun: (date, { latitude, longitude }) => {
    const { altitude, azimuth } = getPosition(date, latitude, longitude);
    return { altitude, azimuth };
  },
  moon: (date, { latitude, longitude }) => {
    const { altitude, azimuth } = getMoonPosition(date, latitude, longitude);
    return { altitude, azimuth };
  },
  moonPhase: (date) => {
    const { fraction, phase } = getMoonIllumination(date);
    return { fraction, phase };
  },
};

export { suncalcSource };
