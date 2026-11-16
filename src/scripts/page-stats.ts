interface TransferEntry {
  transferSize?: number;
  encodedBodySize?: number;
}

interface Viewport {
  width: number;
  height: number;
  ratio: number;
}

const KILO = 1024;
/** The body as sent; transferSize is only headers on a 304, so it stands in only where the body size is hidden. */
function entryWeight({
  transferSize = 0,
  encodedBodySize = 0,
}: TransferEntry): number {
  return encodedBodySize > 0 ? encodedBodySize : transferSize;
}
function pageWeight(entries: TransferEntry[]): number {
  return entries.reduce((total, entry) => total + entryWeight(entry), 0);
}
function formatBytes(bytes: number): string {
  if (bytes < KILO) {
    return `${bytes}B`;
  }
  if (bytes < KILO * KILO) {
    return `${(bytes / KILO).toFixed(1)}KB`;
  }
  return `${(bytes / KILO / KILO).toFixed(2)}MB`;
}
function describeWeight(entries: TransferEntry[]): string {
  return `${formatBytes(pageWeight(entries))}(${entries.length}ファイル)`;
}
/** What this load actually brought over the network: files served from the cache count as nothing. */
function describeTransfer(entries: TransferEntry[]): string {
  return formatBytes(
    entries.reduce((total, entry) => total + (entry.transferSize ?? 0), 0),
  );
}
function describeViewport({ width, height, ratio }: Viewport): string {
  return `${width}×${height}${ratio > 1 ? ` @${ratio}x` : ""}`;
}
function loadedEntries(): TransferEntry[] {
  return [
    ...performance.getEntriesByType("navigation"),
    ...performance.getEntriesByType("resource"),
  ].filter((entry) => entry instanceof PerformanceResourceTiming);
}
function currentViewport(): Viewport {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    ratio: globalThis.devicePixelRatio,
  };
}
function setupPageStats(
  root: HTMLElement,
  entries: () => TransferEntry[] = loadedEntries,
): void {
  const weight = root.querySelector<HTMLElement>("[data-page-weight]");
  const transfer = root.querySelector<HTMLElement>("[data-page-transfer]");
  const viewport = root.querySelector<HTMLElement>("[data-viewport]");
  function showWeight(): void {
    const loaded = entries();
    if (weight) {
      weight.textContent = describeWeight(loaded);
    }
    if (transfer) {
      transfer.textContent = describeTransfer(loaded);
    }
  }
  function showViewport(): void {
    if (viewport) {
      viewport.textContent = describeViewport(currentViewport());
    }
  }

  showViewport();
  globalThis.addEventListener("resize", showViewport);
  if (document.readyState === "complete") {
    showWeight();
  } else {
    globalThis.addEventListener("load", showWeight, { once: true });
  }
}

export {
  describeTransfer,
  describeViewport,
  formatBytes,
  pageWeight,
  setupPageStats,
};
