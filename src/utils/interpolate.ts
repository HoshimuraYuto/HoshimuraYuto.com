type Table = readonly (readonly [x: number, y: number])[];

/** Piecewise-linear value at x in a table sorted by x; outside the table it holds the first or last value. */
function interpolate(table: Table, x: number): number {
  const first = table[0] ?? [0, 0],
    last = table.at(-1) ?? first;
  if (x <= first[0]) {
    return first[1];
  }
  if (x >= last[0]) {
    return last[1];
  }
  const index = table.findIndex(([at]) => at >= x),
    [x1, y1] = table[index] ?? last,
    [x0, y0] = table[index - 1] ?? first;
  return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

export { interpolate };
