const UINT32 = 4_294_967_296;

/** Mulberry32: Math.random cannot be seeded, and the same seed must draw the same picture everywhere. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    const first = Math.imul(state ^ (state >>> 15), 1 | state),
      second = first ^ (first + Math.imul(first ^ (first >>> 7), 61 | first));
    return ((second ^ (second >>> 14)) >>> 0) / UINT32;
  };
}

/** Integer hash of a lattice point, 0 to 1. Integer maths only, so every engine gives the same value for the same point. */
function latticeHash(x: number, y: number, seed: number): number {
  let h =
    Math.imul(x, 0x27_d4_eb_2d) ^
    Math.imul(y, 0x16_56_67_b1) ^
    Math.imul(seed, 0x9e_37_79_b1);
  h = Math.imul(h ^ (h >>> 15), 0x85_eb_ca_6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2_b2_ae_35);
  return ((h ^ (h >>> 16)) >>> 0) / UINT32;
}

export { latticeHash, seededRandom };
