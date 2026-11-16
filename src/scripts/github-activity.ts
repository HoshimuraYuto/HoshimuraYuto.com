import { GITHUB_USER } from "../data/profile";
import { jstStamp } from "../utils/jst";
import { setupActivity } from "./activity";

interface LastPush {
  /** ISO 8601 time of the push. */
  at: string;
  /** Repository name without the owner. */
  repo: string;
}

interface PublicEvent {
  type?: string;
  created_at?: string;
  repo?: { name?: string };
}

const EVENTS_URL = `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`;
/** The newest push in GitHub's public events, which come newest first. They carry no commit messages. */
function lastPush(events: unknown): LastPush | undefined {
  if (!Array.isArray(events)) {
    return undefined;
  }
  const push = events.find(
    (event: unknown): event is PublicEvent =>
      typeof event === "object" &&
      event !== null &&
      "type" in event &&
      event.type === "PushEvent" &&
      "created_at" in event &&
      "repo" in event,
  );
  return push?.created_at !== undefined && push.repo?.name !== undefined
    ? {
        at: push.created_at,
        repo: push.repo.name.split("/").at(-1) ?? push.repo.name,
      }
    : undefined;
}
/**
 * Fills the "now" line from the visitor's browser. Unauthenticated calls are limited per visitor IP,
 * which a personal site's traffic stays far below; on any failure the line keeps its quiet placeholder.
 */
async function setupGithubActivity(
  root: HTMLElement,
  {
    load = fetch,
    now = () => new Date(),
  }: { load?: typeof fetch; now?: () => Date } = {},
): Promise<void> {
  try {
    const response = await load(EVENTS_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      return;
    }
    const push = lastPush(await response.json());
    if (!push) {
      return;
    }
    root.dataset["lastAt"] = push.at;
    const repo = root.querySelector<HTMLElement>("[data-activity-repo]"),
      date = root.querySelector<HTMLElement>("[data-activity-date]");
    if (repo) {
      repo.textContent = push.repo;
    }
    if (date) {
      date.textContent = jstStamp(new Date(push.at)).slice(0, 10);
    }
    setupActivity(root, now);
  } catch {
    // Offline or blocked: the placeholder stays, which is true enough.
  }
}

export { lastPush, setupGithubActivity };
