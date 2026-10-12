// Builds assets/banner-{light,dark}.svg from the `banner` block in cards.json.
// All text is outlined to paths (see lib/text-to-path.mjs), so the SVG has no
// font dependencies, no scripts and no external references.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { textPath, measure } from "./lib/text-to-path.mjs";
import { THEMES, MODES } from "./lib/theme.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { banner } = JSON.parse(readFileSync(join(ROOT, "cards.json"), "utf8"));

const W = 1200;
const H = 210;
const LEFT = 60;
const TEXT_MAX = 1080;

function assertFits(label, width) {
  if (width > TEXT_MAX) throw new Error(`banner ${label} is ${Math.round(width)}px wide; max is ${TEXT_MAX}px. Shorten it in cards.json.`);
}

function svg(mode) {
  const t = THEMES[mode];
  const name = { x: LEFT, y: 118, size: 68, tracking: -1.6 };
  const subline = { x: LEFT, y: 162, size: 22, tracking: -0.1 };
  assertFits("name", measure("inter-600", banner.name, name.size, name.tracking));
  assertFits("subline", measure("inter-400", banner.subline, subline.size, subline.tracking));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">${banner.name}</title>
  <desc id="desc">${banner.subline}</desc>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.panel}" stroke="${t.panelEdge}"/>
  <path d="${textPath("inter-600", banner.name, name)}" fill="${t.ink}"/>
  <path d="${textPath("inter-400", banner.subline, subline)}" fill="${t.muted}"/>
</svg>
`;
}

mkdirSync(join(ROOT, "assets"), { recursive: true });
for (const mode of MODES) {
  const out = join(ROOT, "assets", `banner-${mode}.svg`);
  writeFileSync(out, svg(mode));
  console.log(`wrote assets/banner-${mode}.svg`);
}
