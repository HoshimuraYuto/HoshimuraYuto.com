import { describe, expect, test } from "vitest";

import { defined } from "../test/defined";
import {
  describeTransfer,
  describeViewport,
  formatBytes,
  pageWeight,
  setupPageStats,
} from "./page-stats";

describe(pageWeight, () => {
  test("読み込んだファイルの転送量を合計する", () => {
    expect(pageWeight([{ transferSize: 1200 }, { transferSize: 800 }])).toBe(
      2000,
    );
  });

  test("転送量が0(キャッシュなど)のときは本体の大きさで数える", () => {
    expect(pageWeight([{ transferSize: 0, encodedBodySize: 500 }])).toBe(500);
  });

  test("再読み込みで304が返っても、ヘッダーではなく本体の大きさで数える", () => {
    expect(pageWeight([{ transferSize: 300, encodedBodySize: 5000 }])).toBe(
      5000,
    );
  });
});

describe(formatBytes, () => {
  test("1KB未満はバイトで書く", () => {
    expect(formatBytes(512)).toBe("512B");
  });

  test("1MB未満はKBで書く", () => {
    expect(formatBytes(1536)).toBe("1.5KB");
  });

  test("1MB以上はMBで書く", () => {
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.50MB");
  });
});

describe(describeTransfer, () => {
  test("今回ネットワークから届いた分だけを数え、キャッシュから読んだファイルは0とする", () => {
    expect(
      describeTransfer([
        { transferSize: 2048 },
        { transferSize: 0, encodedBodySize: 900 },
      ]),
    ).toBe("2.0KB");
  });
});

describe(describeViewport, () => {
  test("高精細な画面では倍率も書く", () => {
    expect(describeViewport({ width: 390, height: 844, ratio: 3 })).toBe(
      "390×844 @3x",
    );
  });
});

describe(setupPageStats, () => {
  test("footerの重さと閲覧環境を埋める", () => {
    document.body.innerHTML =
      "<p><span data-page-weight>—</span><span data-page-transfer>—</span><span data-viewport>—</span></p>";
    const root = defined(document.querySelector("p"), "the stats");

    setupPageStats(root, () => [{ transferSize: 0, encodedBodySize: 2048 }]);

    expect(root.querySelector("[data-page-weight]")).toHaveTextContent(
      "2.0KB(1ファイル)",
    );
    expect(root.querySelector("[data-page-transfer]")).toHaveTextContent("0B");
    expect(root.querySelector("[data-viewport]")).toHaveTextContent(/^\d+×\d+/);
  });
});
