import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const headersPath = path.join(root, "public", "_headers");
const srcPath = path.join(root, "src");

const SCRIPT_RE = /<script\b([^>]*?)(?:\/>|>([\s\S]*?)<\/script>)/gi;
const INERT_TYPE_RE = /\btype\s*=\s*"(?:application\/json|application\/ld\+json)"/;

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("base64");
}

function inlineScriptHashes(source, file) {
  const scripts = [];

  for (const match of source.matchAll(SCRIPT_RE)) {
    const attributes = match[1];
    const content = match[2];

    if (!/\bis:inline\b/.test(attributes)) continue;
    if (/\bsrc\s*=/.test(attributes) || INERT_TYPE_RE.test(attributes)) continue;
    if (content === undefined) continue;
    if (/\bdefine:vars\b/.test(attributes)) {
      throw new Error(
        `${file}: <script is:inline define:vars> cannot be hash-validated before Astro renders it`
      );
    }

    scripts.push({ hash: hash(content), file });
  }

  return scripts;
}

async function main() {
  const entries = await fs.readdir(srcPath, { recursive: true, withFileTypes: true });
  const required = (
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".astro"))
        .map(async (entry) => {
          const filePath = path.join(entry.parentPath, entry.name);
          return inlineScriptHashes(
            await fs.readFile(filePath, "utf8"),
            path.relative(root, filePath)
          );
        })
    )
  ).flat();

  const headers = await fs.readFile(headersPath, "utf8");
  const declared = new Set(
    [...headers.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((match) => match[1])
  );
  const expected = new Set(required.map((script) => script.hash));
  const missing = required.filter(
    (script, index) =>
      !declared.has(script.hash) &&
      required.findIndex((candidate) => candidate.hash === script.hash) === index
  );
  const stale = [...declared].filter((declaredHash) => !expected.has(declaredHash));

  for (const script of missing) {
    console.error(`Missing 'sha256-${script.hash}' from ${script.file}`);
  }
  for (const staleHash of stale) {
    console.warn(`Stale 'sha256-${staleHash}' in public/_headers`);
  }

  if (missing.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.info(`CSP hash audit passed (${expected.size} inline script hashes).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
