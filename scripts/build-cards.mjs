// Builds the featured-work cards and the repo social previews from cards.json.
//
//   assets/cards/<repo>-light.webp, assets/cards/<repo>-dark.webp   (README grid)
//   assets/social/<repo>.png                                         (1280x640, Settings → Social preview)
//
// Usage: node scripts/build-cards.mjs [repo ...]   (no args = every card)
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { launch } from "./lib/browser.mjs";
import { MEDIA_CSS, renderMedia } from "./lib/media.mjs";
import { MODES, THEMES } from "./lib/theme.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const config = JSON.parse(readFileSync(join(ROOT, "cards.json"), "utf8"));

// gutter: transparent margin baked into each side of the card image, so two
// cards placed edge to edge in the README get an even gap between them.
const CARD = { width: 560, height: 444, gutter: 8, scale: 2, maxBytes: 250 * 1024 };
const SOCIAL = { width: 1280, height: 640, maxBytes: 1024 * 1024, mode: "dark" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const font = (pkg, file) => pathToFileURL(require.resolve(`@fontsource/${pkg}/files/${file}`)).href;

const FONT_CSS = [
  ["Inter", 400, font("inter", "inter-latin-400-normal.woff2")],
  ["Inter", 500, font("inter", "inter-latin-500-normal.woff2")],
  ["Inter", 600, font("inter", "inter-latin-600-normal.woff2")],
  ["JetBrains Mono", 400, font("jetbrains-mono", "jetbrains-mono-latin-400-normal.woff2")],
  ["JetBrains Mono", 500, font("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff2")],
]
  .map(([family, weight, src]) => `@font-face{font-family:"${family}";font-weight:${weight};src:url("${src}") format("woff2");}`)
  .join("\n");

const ARROW = `<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function page(mode, body, extraCss) {
  const vars = Object.entries(THEMES[mode]).map(([k, v]) => `--${k}:${v};`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
:root{${vars}--sans:"Inter",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;}
*{box-sizing:border-box;}
html,body{margin:0;background:var(--page);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}
.stack{display:flex;flex-wrap:wrap;gap:0 10px;font:400 12.5px/1.4 var(--mono);color:var(--faint);}
.stack span+span::before{content:"·";margin-right:10px;color:var(--line);}
.tag{display:inline-flex;align-items:center;gap:7px;height:24px;padding:0 10px;border-radius:999px;font:500 11.5px/1 var(--mono);
  color:var(--verified);background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid color-mix(in srgb,var(--verified) 35%,var(--panelEdge));
  backdrop-filter:blur(6px);}
.tag::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;}
${MEDIA_CSS}
${extraCss}
</style></head><body>${body}</body></html>`;
}

const CARD_CSS = `
.card{position:relative;margin:0 ${CARD.gutter}px;width:${CARD.width}px;height:${CARD.height}px;padding:10px;border-radius:16px;background:var(--panel);border:1px solid var(--panelEdge);display:flex;flex-direction:column;}
.card .media{height:232px;border-radius:9px;flex:none;--frame-h:184px;--frame-gap:16px;--term-size:10.2px;}
.card .media-html .lin{zoom:.8;padding-bottom:40px;}
.card .caption{font-size:10px;}
.tag{position:absolute;top:10px;right:10px;z-index:2;}
.body{flex:1;display:flex;flex-direction:column;padding:16px 12px 4px;}
.kicker{font:500 12.5px/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--faint);}
.name{display:flex;align-items:center;justify-content:space-between;margin-top:10px;font:600 28px/1.1 var(--sans);letter-spacing:-.025em;color:var(--ink);}
.name svg{color:var(--faint);width:22px;height:22px;}
.line{margin-top:8px;font:400 17px/1.42 var(--sans);color:var(--muted);}
.body .stack{margin-top:auto;font-size:14px;}
`;

function cardHtml(card, mode) {
  const tag = card.tag ? `<span class="tag">${esc(card.tag)}</span>` : "";
  const stack = card.stack.map((s) => `<span>${esc(s)}</span>`).join("");
  return page(
    mode,
    `<div class="card">${renderMedia(card, mode, ROOT, tag)}<div class="body">
      <div class="kicker">${esc(card.kicker)}</div>
      <div class="name"><span>${esc(card.name)}</span>${ARROW}</div>
      <div class="line">${esc(card.line)}</div>
      <div class="stack">${stack}</div></div></div>`,
    CARD_CSS,
  );
}

const SOCIAL_CSS = `
.social{position:relative;width:${SOCIAL.width}px;height:${SOCIAL.height}px;overflow:hidden;background:var(--panel);display:grid;grid-template-columns:480px 1fr;gap:40px;padding:64px 56px 64px 72px;}
.social::before{content:"";position:absolute;inset:0;background-image:radial-gradient(var(--grid) 1.2px,transparent 1.2px);background-size:22px 22px;
  -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 70%);mask-image:linear-gradient(90deg,transparent 0%,#000 70%);opacity:.9;}
.copy{position:relative;display:flex;flex-direction:column;}
.owner{font:400 19px/1 var(--mono);color:var(--faint);}
.owner b{font-weight:500;color:var(--muted);}
.social .name{margin-top:26px;font:600 var(--name-size,72px)/1.04 var(--sans);letter-spacing:-.035em;color:var(--ink);white-space:nowrap;}
.social .kicker{margin-top:22px;font:500 15px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);}
.social .line{margin-top:18px;font:400 27px/1.45 var(--sans);color:var(--muted);}
.social .stack{margin-top:auto;font-size:17px;gap:0 14px;}
.social .stack span+span::before{margin-right:14px;}
.social .media{position:relative;height:100%;border-radius:16px;
  --frame-h:330px;--frame-gap:22px;--term-size:15px;}
.social .tag{position:absolute;z-index:2;top:16px;right:16px;height:30px;font-size:14px;padding:0 13px;}
.social .media-screenshot{height:auto;aspect-ratio:16/10;align-self:center;}
`;

function socialHtml(card) {
  const mode = SOCIAL.mode;
  const tag = card.tag ? `<span class="tag">${esc(card.tag)}</span>` : "";
  const stack = card.stack.map((s) => `<span>${esc(s)}</span>`).join("");
  return page(
    mode,
    `<div class="social"><div class="copy">
      <div class="owner"><b>${esc(config.author)}</b> · github.com/${esc(config.owner)}</div>
      <div class="name">${esc(card.name)}</div>
      <div class="kicker">${esc(card.kicker)}</div>
      <div class="line">${esc(card.line)}</div>
      <div class="stack">${stack}</div></div>${renderMedia(card, mode, ROOT, tag)}</div>
      <script>
        // Called by capture() once web fonts are loaded, so widths are measured in Inter.
        window.fitToWidth = () => {
          const n = document.querySelector('.social .name'); let size = 72;
          while (n.scrollWidth > n.clientWidth && size > 36) { size -= 2; n.style.setProperty('--name-size', size + 'px'); }
        };
      </script>`,
    SOCIAL_CSS,
  );
}

async function capture(browser, html, { width, height, scale, transparent = false, workDir, name }) {
  const file = join(workDir, `${name}.html`);
  writeFileSync(file, html);
  const pageHandle = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await pageHandle.goto(pathToFileURL(file).href);
  await pageHandle.evaluate(() => document.fonts.ready);
  await pageHandle.evaluate(() => window.fitToWidth?.());
  const broken = await pageHandle.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
  if (broken.length) throw new Error(`${name}: images failed to load: ${broken.join(", ")}`);
  if (transparent) await pageHandle.addStyleTag({ content: "html,body{background:transparent}" });
  const png = await pageHandle.screenshot({ clip: { x: 0, y: 0, width, height }, omitBackground: transparent });
  await pageHandle.close();
  return png;
}

function report(path, bytes, max) {
  const kb = (bytes / 1024).toFixed(0);
  if (bytes > max) throw new Error(`${path} is ${kb} KB, over the ${(max / 1024).toFixed(0)} KB budget`);
  console.log(`wrote ${path} (${kb} KB)`);
}

async function main() {
  const only = process.argv.slice(2);
  const cards = only.length ? config.cards.filter((c) => only.includes(c.repo)) : config.cards;
  if (only.length && cards.length !== only.length) throw new Error(`unknown repo in: ${only.join(", ")}`);

  mkdirSync(join(ROOT, "assets/cards"), { recursive: true });
  mkdirSync(join(ROOT, "assets/social"), { recursive: true });
  const workDir = mkdtempSync(join(tmpdir(), "profile-cards-"));
  const browser = await launch();
  try {
    for (const card of cards) {
      for (const mode of MODES) {
        const png = await capture(browser, cardHtml(card, mode), {
          ...CARD,
          width: CARD.width + 2 * CARD.gutter,
          transparent: true,
          workDir,
          name: `${card.repo}-${mode}`,
        });
        const rel = `assets/cards/${card.repo}-${mode}.webp`;
        await sharp(png).webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(join(ROOT, rel));
        report(rel, statSync(join(ROOT, rel)).size, CARD.maxBytes);
      }
      const png = await capture(browser, socialHtml(card), { ...SOCIAL, scale: 1, workDir, name: `${card.repo}-social` });
      const rel = `assets/social/${card.repo}.png`;
      await sharp(png).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(ROOT, rel));
      report(rel, statSync(join(ROOT, rel)).size, SOCIAL.maxBytes);
    }
  } finally {
    await browser.close();
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
