import { describe, expect, test } from "vitest";

import { hash, normalizePath } from "./url-seed";

describe(hash, () => {
  test("FNV-1aの既知の値と一致する", () => {
    expect(hash("")).toBe(2_166_136_261);
    expect(hash("a")).toBe(0xe4_0c_29_2c);
  });
});

describe(normalizePath, () => {
  test("末尾のスラッシュの有無で結果が変わらないようにそろえる", () => {
    expect(normalizePath("/ramen/")).toBe("/ramen");
    expect(normalizePath("/ramen")).toBe("/ramen");
  });

  test("トップは/のまま", () => {
    expect(normalizePath("/")).toBe("/");
  });
});
