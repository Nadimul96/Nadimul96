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
const H = 340;
const LEFT = 60;
const TEXT_MAX = 700;

function assertFits(label, width) {
  if (width > TEXT_MAX) throw new Error(`banner ${label} is ${Math.round(width)}px wide; max is ${TEXT_MAX}px. Shorten it in cards.json.`);
}

// Provenance motif: sources converge on an anchor step, pass a verify gate,
// and either ship or get blocked. Geometry is fixed; labels come from cards.json.
function motif(t) {
  const { sources, stages, output, blocked } = banner.motifLabels;
  const srcX = 790;
  const srcW = 60;
  const ys = sources.map((_, i) => 92 + i * 44);
  const anchor = { x: 952, y: 180 };
  const verify = { x: 1040, y: 180 };
  const ship = { x: 1128, y: 132 };
  const stop = { x: 1128, y: 236 };
  const parts = [];

  ys.forEach((y, i) => {
    const x0 = srcX + srcW;
    parts.push(`<path d="M${x0} ${y} C ${x0 + 48} ${y}, ${anchor.x - 52} ${anchor.y}, ${anchor.x - 7} ${anchor.y}" fill="none" stroke="${t.line}" stroke-width="1.25"/>`);
    parts.push(`<rect x="${srcX}" y="${y - 12}" width="${srcW}" height="24" rx="6" fill="${t.page}" stroke="${t.panelEdge}"/>`);
    parts.push(`<path d="${textPath("mono-400", sources[i], { x: srcX + srcW / 2, y: y + 4.6, size: 13, anchor: "middle" })}" fill="${t.muted}"/>`);
  });

  parts.push(`<path d="M${anchor.x + 7} ${anchor.y} L ${verify.x - 9} ${verify.y}" stroke="${t.accent}" stroke-width="1.5"/>`);
  parts.push(`<path d="M${verify.x + 8} ${verify.y - 4} C ${verify.x + 40} ${verify.y - 10}, ${ship.x - 46} ${ship.y}, ${ship.x - 17} ${ship.y}" fill="none" stroke="${t.verified}" stroke-width="1.75"/>`);
  parts.push(`<path d="M${verify.x + 8} ${verify.y + 4} C ${verify.x + 40} ${verify.y + 10}, ${stop.x - 46} ${stop.y}, ${stop.x - 13} ${stop.y}" fill="none" stroke="${t.blocked}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.85"/>`);

  parts.push(`<circle cx="${anchor.x}" cy="${anchor.y}" r="7" fill="${t.panel}" stroke="${t.accent}" stroke-width="1.75"/>`);
  parts.push(`<rect x="${verify.x - 8}" y="${verify.y - 8}" width="16" height="16" rx="2" transform="rotate(45 ${verify.x} ${verify.y})" fill="${t.panel}" stroke="${t.accent}" stroke-width="1.75"/>`);
  parts.push(`<circle cx="${ship.x}" cy="${ship.y}" r="16" fill="${t.verified}"/>`);
  parts.push(`<path d="M${ship.x - 6.5} ${ship.y + 0.5} l4.5 4.5 l8.5 -9" fill="none" stroke="${t.page}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push(`<circle cx="${stop.x}" cy="${stop.y}" r="12" fill="${t.panel}" stroke="${t.blocked}" stroke-width="1.5"/>`);
  parts.push(`<path d="M${stop.x - 4.5} ${stop.y - 4.5} l9 9 M${stop.x + 4.5} ${stop.y - 4.5} l-9 9" stroke="${t.blocked}" stroke-width="1.75" stroke-linecap="round"/>`);

  const label = (text, x, y, color) => `<path d="${textPath("mono-400", text, { x, y, size: 12.5, anchor: "middle", tracking: 0.2 })}" fill="${color}"/>`;
  parts.push(label(stages[0], anchor.x, anchor.y - 20, t.faint));
  parts.push(label(stages[1], verify.x, verify.y - 22, t.faint));
  parts.push(label(output, ship.x, ship.y - 26, t.verified));
  parts.push(label(blocked, stop.x, stop.y + 30, t.blocked));
  return parts.join("\n    ");
}

function svg(mode) {
  const t = THEMES[mode];
  const eyebrow = { x: LEFT, y: 94, size: 14.5, tracking: 1.5 };
  const name = { x: LEFT, y: 178, size: 74, tracking: -1.8 };
  const headline = { x: LEFT, y: 233, size: 29, tracking: -0.4 };
  const subline = { x: LEFT, y: 271, size: 21, tracking: -0.1 };
  assertFits("name", measure("inter-600", banner.name, name.size, name.tracking));
  assertFits("headline", measure("inter-500", banner.headline, headline.size, headline.tracking));
  assertFits("subline", measure("inter-400", banner.subline, subline.size, subline.tracking));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">${banner.name}</title>
  <desc id="desc">${banner.headline} ${banner.subline}</desc>
  <defs>
    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="${t.grid}"/>
    </pattern>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0.38" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.75" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="fadeMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <clipPath id="panel"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18"/></clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.panel}" stroke="${t.panelEdge}"/>
  <g clip-path="url(#panel)">
    <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#fadeMask)"/>
  </g>
  <path d="${textPath("mono-500", banner.eyebrow, eyebrow)}" fill="${t.faint}"/>
  <path d="${textPath("inter-600", banner.name, name)}" fill="${t.ink}"/>
  <path d="${textPath("inter-500", banner.headline, headline)}" fill="${t.text}"/>
  <path d="${textPath("inter-400", banner.subline, subline)}" fill="${t.muted}"/>
  <g>
    ${motif(t)}
  </g>
</svg>
`;
}

mkdirSync(join(ROOT, "assets"), { recursive: true });
for (const mode of MODES) {
  const out = join(ROOT, "assets", `banner-${mode}.svg`);
  writeFileSync(out, svg(mode));
  console.log(`wrote assets/banner-${mode}.svg`);
}
