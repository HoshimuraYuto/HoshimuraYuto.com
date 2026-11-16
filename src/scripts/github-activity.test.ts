import { screen } from "@testing-library/dom";
import { afterEach, describe, expect, test, vi } from "vitest";

import { lastPush, setupGithubActivity } from "./github-activity";

const EVENTS = [
  {
    type: "WatchEvent",
    created_at: "2026-11-13T01:00:00Z",
    repo: { name: "someone/else" },
  },
  {
    type: "PushEvent",
    created_at: "2026-11-12T11:51:47Z",
    repo: { name: "HoshimuraYuto/cloudflare-signed-email-alias" },
  },
  {
    type: "PushEvent",
    created_at: "2026-11-10T00:00:00Z",
    repo: { name: "HoshimuraYuto/dotfiles" },
  },
];
function render(): HTMLElement {
  document.body.innerHTML = `
      <p data-activity data-state="quiet">
        <span data-activity-date>—</span>
        <span data-activity-label>しばらく静か</span>
        <span data-activity-repo></span>
        <span data-activity-ago></span>
      </p>`;
  const root = document.querySelector<HTMLElement>("[data-activity]");
  if (!root) {
    throw new Error("activity was not rendered");
  }
  return root;
}
function respond(body: unknown, ok = true): typeof fetch {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify(body), { status: ok ? 200 : 403 }),
    );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe(lastPush, () => {
  test("一番新しいpushの時刻とリポジトリ名を返す", () => {
    expect(lastPush(EVENTS)).toStrictEqual({
      at: "2026-11-12T11:51:47Z",
      repo: "cloudflare-signed-email-alias",
    });
  });

  test("pushがなければ何も返さない", () => {
    expect(lastPush([EVENTS[0]])).toBeUndefined();
    expect(lastPush({ message: "API rate limit exceeded" })).toBeUndefined();
  });
});

describe(setupGithubActivity, () => {
  test("最後のpushから、日付・リポジトリ・状態・経過を書き込む", async () => {
    const root = render();

    await setupGithubActivity(root, {
      load: respond(EVENTS),
      now: () => new Date("2026-11-12T13:51:47Z"),
    });

    expect(root.dataset["state"]).toBe("working");
    expect(screen.getByText("2026-11-12")).toBeInTheDocument();
    expect(
      screen.getByText("cloudflare-signed-email-alias"),
    ).toBeInTheDocument();
    expect(screen.getByText("2時間前")).toBeInTheDocument();
  });

  test("取得に失敗したら、仮の表示のままにする", async () => {
    const root = render();

    await setupGithubActivity(root, { load: respond({}, false) });
    await setupGithubActivity(root, {
      load: vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    });

    expect(root.dataset["state"]).toBe("quiet");
    expect(screen.getByText("しばらく静か")).toBeInTheDocument();
  });
});
