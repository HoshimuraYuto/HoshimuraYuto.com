type ActivityState = "working" | "recent" | "quiet";

const MS_PER_HOUR = 3_600_000;
/** Within this many hours of the last commit the author counts as still at work. */
const WORKING_HOURS = 3;
const HOURS_PER_DAY = 24;
/** Only a week without a push reads as quiet: a few days off is normal for a side project. */
const RECENT_HOURS = 7 * HOURS_PER_DAY;
const LABELS: Readonly<Record<ActivityState, string>> = {
  working: "いま作業中",
  recent: "最近作業した",
  quiet: "しばらく静か",
};
function activityState(lastAt: string, now: Date): ActivityState {
  const hours = (now.getTime() - Date.parse(lastAt)) / MS_PER_HOUR;
  if (hours < WORKING_HOURS) {
    return "working";
  }
  return hours < RECENT_HOURS ? "recent" : "quiet";
}
/** How long ago, in the largest whole unit: "3時間前", "2日前". */
function agoWords(lastAt: string, now: Date): string {
  const hours = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(lastAt)) / MS_PER_HOUR),
  );
  if (hours < 1) {
    return "1時間以内";
  }
  return hours < HOURS_PER_DAY
    ? `${hours}時間前`
    : `${Math.floor(hours / HOURS_PER_DAY)}日前`;
}
function setupActivity(
  root: HTMLElement,
  now: () => Date = () => new Date(),
): void {
  const lastAt = root.dataset["lastAt"] ?? "";
  // Until a push is known there is no time to measure from, and the placeholder stays.
  if (Number.isNaN(Date.parse(lastAt))) {
    return;
  }
  const state = activityState(lastAt, now()),
    label = root.querySelector<HTMLElement>("[data-activity-label]"),
    ago = root.querySelector<HTMLElement>("[data-activity-ago]");
  root.dataset["state"] = state;
  if (label) {
    label.textContent = LABELS[state];
  }
  if (ago) {
    ago.textContent = agoWords(lastAt, now());
  }
}

export { activityState, agoWords, setupActivity };
