/** FNV-1a, 32-bit: a tiny, well-known hash, so anyone can recompute a page's seed by hand. */
const FNV_OFFSET = 2_166_136_261;
const FNV_PRIME = 16_777_619;
function hash(text: string): number {
  let value = FNV_OFFSET;
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, FNV_PRIME);
  }
  return value >>> 0;
}
/** "/foo/" and "/foo" are the same page, so they must draw the same thing. */
function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/u, "");
  return trimmed === "" ? "/" : trimmed;
}

export { hash, normalizePath };
