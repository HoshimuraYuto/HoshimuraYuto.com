import { readFileSync } from "node:fs";

/** Exports maps hide LICENSE and package.json, so they are read from beside the package's entry. */
function readPackageFile(packageName: string, file: string): string {
  return readFileSync(new URL(file, import.meta.resolve(packageName)), "utf8");
}

function versionIn(manifest: unknown): string {
  if (
    typeof manifest === "object" &&
    manifest !== null &&
    "version" in manifest &&
    typeof manifest.version === "string"
  ) {
    return manifest.version;
  }
  throw new TypeError("package.json has no version");
}

function packageVersion(packageName: string): string {
  return versionIn(JSON.parse(readPackageFile(packageName, "package.json")));
}

export { packageVersion, readPackageFile };
