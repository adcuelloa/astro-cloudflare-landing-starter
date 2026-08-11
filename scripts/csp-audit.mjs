import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const outputRoot = join(root, "dist", "client");
const headersPath = join(root, "public", "_headers");
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const inertTypePattern = /\btype\s*=\s*["'](?:application\/json|application\/ld\+json)["']/i;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".html") ? [path] : [];
  });
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("base64");
}

if (!existsSync(outputRoot)) {
  throw new Error("dist/client is missing; run pnpm build first");
}

const required = new Map();
for (const file of walk(outputRoot)) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(scriptPattern)) {
    const [, attributes, content] = match;
    if (/\bsrc\s*=/i.test(attributes) || inertTypePattern.test(attributes)) continue;

    const hash = sha256(content);
    const pages = required.get(hash) ?? new Set();
    pages.add(relative(outputRoot, file));
    required.set(hash, pages);
  }
}

const headers = readFileSync(headersPath, "utf8");
const scriptSources = headers.match(/\bscript-src\s+([^;\n]+)/)?.[1];
if (!scriptSources) throw new Error("public/_headers has no script-src directive");

const declared = new Set(
  [...scriptSources.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((match) => match[1])
);
const missing = [...required].filter(([hash]) => !declared.has(hash));
const stale = [...declared].filter((hash) => !required.has(hash));

if (missing.length > 0) {
  process.stderr.write(
    `CSP audit failed. Add these hashes to script-src:\n${missing
      .map(
        ([hash, pages]) =>
          `- 'sha256-${hash}' (${[...pages].slice(0, 3).join(", ")}${pages.size > 3 ? ", …" : ""})`
      )
      .join("\n")}\n`
  );
  process.exit(1);
}

if (stale.length > 0) {
  process.stdout.write(
    `Stale CSP hashes:\n${stale.map((hash) => `- 'sha256-${hash}'`).join("\n")}\n`
  );
}

process.stdout.write(
  `CSP audit passed: ${required.size} inline script hash${required.size === 1 ? "" : "es"}.\n`
);
