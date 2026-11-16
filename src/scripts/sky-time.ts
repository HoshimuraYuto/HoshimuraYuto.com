import { JST_OFFSET_MS, jstStamp } from "../utils/jst";

const AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;
/** `?at=2026-11-20T22:00` read as Japan time. Anything else, including dates that do not exist, gives undefined. */
function parseAt(search: string): Date | undefined {
  const at = new URLSearchParams(search).get("at") ?? "";
  if (!AT_PATTERN.test(at)) {
    return undefined;
  }
  const date = new Date(Date.parse(`${at}:00Z`) - JST_OFFSET_MS);
  // Some engines roll 2026-02-30 over to March instead of rejecting it, so the value must survive a round trip.
  return !Number.isNaN(date.getTime()) && jstStamp(date) === at
    ? date
    : undefined;
}
function formatJst(date: Date): string {
  return `${jstStamp(date).replace("T", " ")} JST`;
}
function formatPlace(latitude: number, longitude: number): string {
  return `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? "N" : "S"} ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? "E" : "W"}`;
}
function formatMoonAge(age: number): string {
  return `月齢${age.toFixed(1)}`;
}

export { formatJst, formatMoonAge, formatPlace, parseAt };
