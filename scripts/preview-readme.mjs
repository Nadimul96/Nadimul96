// Renders README.md the way GitHub does (via the public markdown API, gfm mode),
// places it in a profile-page-sized frame, and screenshots it in light and dark.
// Also checks that every github.com/Nadimul96/<repo>/blob/main/<path> link in the
// README points at a file that exists in the sibling clone (../<repo>/<path>).
//
// Usage: node scripts/preview-readme.mjs [outDir]   (default: .preview/)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./lib/browser.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const outDir = resolve(process.argv[2] ?? join(ROOT, ".preview"));
const { owner } = JSON.parse(readFileSync(join(ROOT, "cards.json"), "utf8"));
const markdown = readFileSync(join(ROOT, "README.md"), "utf8");

function checkLinks() {
  const pattern = new RegExp(`https://github\\.com/${owner}/([\\w.-]+)/blob/main/([^)\\s"#]+)`, "g");
  const missing = [];
  for (const [, repo, path] of markdown.matchAll(pattern)) {
    const local = join(ROOT, "..", repo, path);
    if (!existsSync(local)) missing.push(`${repo}/${path}`);
  }
  if (missing.length) throw new Error(`README links to files missing from the local clones:\n  ${missing.join("\n  ")}`);
  console.log("linked repo files: all present locally");
}

async function renderGfm() {
  const res = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", "User-Agent": `${owner}-profile-preview` },
    body: JSON.stringify({ text: markdown, mode: "gfm", context: `${owner}/${owner}` }),
  });
  if (!res.ok) throw new Error(`GitHub markdown API returned ${res.status}: ${await res.text()}`);
  return res.text();
}

// Approximates github.com/<user> at 1280px: 296px sidebar, README box ~846px inside.
function profilePage(bodyHtml) {
  const css = pathToFileURL(require.resolve("github-markdown-css/github-markdown.css")).href;
  return `<!doctype html><html><head><meta charset="utf-8">
<base href="${pathToFileURL(ROOT).href}/">
<link rel="stylesheet" href="${css}">
<style>
  :root { color-scheme: light dark; --bg:#ffffff; --border:#d1d9e0; --muted:#59636e; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --border:#3d444d; --muted:#9198a1; } }
  body { margin:0; background:var(--bg); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif; }
  .layout { max-width:1280px; margin:0 auto; padding:24px 32px; display:grid; grid-template-columns:296px 1fr; gap:24px; }
  .side .avatar { width:296px; height:296px; border-radius:50%; border:1px solid var(--border); background:color-mix(in srgb,var(--muted) 18%,var(--bg)); }
  .side h1 { margin:16px 0 0; font-size:24px; line-height:1.25; font-weight:600; color:CanvasText; }
  .side p { margin:2px 0 0; font-size:20px; font-weight:300; color:var(--muted); }
  .box { border:1px solid var(--border); border-radius:6px; padding:24px; }
  .box .label { font:12px ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--muted); margin-bottom:16px; }
  .markdown-body { background:transparent; }
</style></head><body><div class="layout">
  <aside class="side"><div class="avatar"></div><h1>Nadimul Haque</h1><p>${owner}</p></aside>
  <main><div class="box"><div class="label">${owner} / README.md</div><article class="markdown-body">${bodyHtml}</article></div></main>
</div></body></html>`;
}

async function main() {
  checkLinks();
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, "readme.html");
  writeFileSync(file, profilePage(await renderGfm()));
  const browser = await launch();
  try {
    for (const colorScheme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme });
      await page.goto(pathToFileURL(file).href);
      await page.waitForLoadState("networkidle");
      const out = join(outDir, `readme-${colorScheme}.png`);
      await page.screenshot({ path: out, fullPage: true });
      await page.close();
      console.log(`wrote ${out}`);
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mobile.goto(pathToFileURL(file).href);
    await mobile.addStyleTag({ content: ".layout{grid-template-columns:1fr;padding:16px}.side{display:none}" });
    await mobile.screenshot({ path: join(outDir, "readme-mobile.png"), fullPage: true });
    console.log(`wrote ${join(outDir, "readme-mobile.png")}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
