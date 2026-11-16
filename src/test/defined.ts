/** Throws instead of falling back, so a missing value cannot pass unnoticed. */
function defined<T>(value: T | null | undefined, what = "value"): T {
  if (value === undefined || value === null) {
    throw new Error(`expected ${what} to exist`);
  }
  return value;
}

export { defined };
