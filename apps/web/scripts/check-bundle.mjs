// Budget de performance (B8.1) : JavaScript initial de chaque page, gzippé,
// sous 200 Ko. Lit le manifeste du build Next.js ; échoue si une page dépasse.
//   node scripts/check-bundle.mjs [--budget 200]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const root = join(import.meta.dirname, "..", ".next");
const budgetKb = Number(process.argv[process.argv.indexOf("--budget") + 1]) || 200;
const manifest = JSON.parse(readFileSync(join(root, "app-build-manifest.json"), "utf8")).pages;
const sizes = new Map();
const gz = (file) => {
  if (!sizes.has(file)) sizes.set(file, gzipSync(readFileSync(join(root, file))).byteLength);
  return sizes.get(file);
};

const rows = [];
for (const [route, files] of Object.entries(manifest)) {
  if (!route.endsWith("/page")) continue;
  // Chaque page charge aussi les layouts qui l'englobent.
  const layouts = Object.keys(manifest).filter(
    (key) => key.endsWith("/layout") && route.startsWith(key.slice(0, -"layout".length)),
  );
  const all = new Set(
    [...files, ...layouts.flatMap((key) => manifest[key])].filter((f) => f.endsWith(".js")),
  );
  const kb = [...all].reduce((acc, f) => acc + gz(f), 0) / 1024;
  rows.push({ route: route.replace(/\/page$/, "") || "/", kb: Math.round(kb * 10) / 10 });
}
rows.sort((a, b) => b.kb - a.kb);
for (const r of rows)
  console.log(`${r.kb > budgetKb ? "✗" : "✓"} ${String(r.kb).padStart(6)} Ko  ${r.route}`);
const over = rows.filter((r) => r.kb > budgetKb);
if (over.length > 0) {
  console.error(`\n${over.length} page(s) au-delà du budget de ${budgetKb} Ko gzippés.`);
  process.exit(1);
}
console.log(`\nToutes les pages tiennent dans ${budgetKb} Ko gzippés.`);
