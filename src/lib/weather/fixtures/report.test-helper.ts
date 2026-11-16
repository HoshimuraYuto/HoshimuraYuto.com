/** The METAR in an IEM response whose `valid` column (UTC) is the given `YYYY-MM-DD HH:MM`. */
function reportAt(csv: string, valid: string): string {
  const row = csv.split("\n").find((line) => line.split(",")[1] === valid);
  if (row === undefined) {
    throw new Error(`no report at ${valid}`);
  }
  return row.split(",").slice(2).join(",");
}

export { reportAt };
