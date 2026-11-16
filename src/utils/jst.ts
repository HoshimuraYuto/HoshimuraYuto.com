const JST_OFFSET_MS = 9 * 3_600_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
/** The same moment written as `2026-11-20T22:00` in Japan time. */
function jstStamp(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

export { JST_OFFSET_MS, jstStamp, pad };
