// Usage: node scripts/extract-jma-telops.ts <forecast.html> <out.json>
// Pulls the TELOPS table (weather code -> Japanese and English name) out of the JMA forecast page
// (https://www.jma.go.jp/bosai/forecast/). The page is read as text only; nothing from it is evaluated.
import { readFileSync, writeFileSync } from "node:fs";
import { argv, stdout } from "node:process";

interface TelopName {
  ja: string;
  en: string;
}

const ROW = /(?<code>\d{3})\s*:\s*\[(?<cells>[^\]]*)\]/gu;
const CELL = /"(?<text>[^"]*)"/gu;
const ESCAPED = /\\u(?<hex>[\dA-Fa-f]{4})/gu;
// Each row is [day icon, night icon, code, Japanese, English].
const JA_CELL = 3;
const EN_CELL = 4;

function unescapeJs(text: string): string {
  return text.replaceAll(ESCAPED, (_all, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  );
}

function telopsBody(html: string): string {
  const open = html.indexOf("{", html.indexOf("TELOPS"));
  return html.slice(open, html.indexOf("}", open) + 1);
}

function extractTelops(html: string): Record<string, TelopName> {
  const names: Record<string, TelopName> = {};
  for (const { groups } of telopsBody(html).matchAll(ROW)) {
    const cells = [...(groups?.["cells"] ?? "").matchAll(CELL)].map((cell) =>
      unescapeJs(cell.groups?.["text"] ?? ""),
    );
    names[groups?.["code"] ?? ""] = {
      ja: cells[JA_CELL] ?? "",
      en: cells[EN_CELL] ?? "",
    };
  }
  return names;
}

const [, , input, output] = argv;
if (input === undefined || output === undefined) {
  throw new Error(
    "usage: node scripts/extract-jma-telops.ts <forecast.html> <out.json>",
  );
}
const names = extractTelops(readFileSync(input, "utf8"));
writeFileSync(output, `${JSON.stringify(names, undefined, 2)}\n`);
stdout.write(`${Object.keys(names).length} codes\n`);
