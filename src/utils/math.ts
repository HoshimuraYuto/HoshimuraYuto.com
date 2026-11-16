const RAD = Math.PI / 180;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}
/** Smoothstep: 0 at or below `low`, 1 at or above `high`, an S-curve between. */
function smooth(value: number, low: number, high: number): number {
  const k = clamp((value - low) / (high - low), 0, 1);
  return k * k * (3 - 2 * k);
}

export { clamp, RAD, smooth };
