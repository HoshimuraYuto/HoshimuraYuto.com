import type { Weather } from "../lib/weather/types";

type CritterMood = "rain" | "snow" | "sun" | "plain";

/** Clear enough for sunglasses: at most about two eighths of the sky covered. */
const SUNNY_COVER = 0.3;
function moodOf(weather: Weather | undefined, daylight: boolean): CritterMood {
  const kind = weather?.precipitation?.kind;
  if (kind === "snow") {
    return "snow";
  }
  if (kind !== undefined || weather?.thunder === true) {
    return "rain";
  }
  if (daylight && weather && weather.cloudCover <= SUNNY_COVER) {
    return "sun";
  }
  return "plain";
}
/** The critters live outside the hero, so the mood is written onto each of them. */
function showMood(mood: CritterMood, root: ParentNode = document): void {
  for (const critter of root.querySelectorAll<HTMLElement>(".critter")) {
    critter.dataset["mood"] = mood;
  }
}

export { moodOf, showMood };
