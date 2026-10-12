// Renders a card's `media` block (from cards.json) to an HTML fragment.
// Every image path is checked up front: a missing screenshot fails the build
// instead of silently producing a card with an empty panel.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function resolveAsset(root, path, label) {
  const abs = resolve(root, path);
  if (!existsSync(abs)) throw new Error(`${label}: file not found: ${path} (resolved to ${abs})`);
  return abs;
}

const forMode = (value, mode) => (value && typeof value === "object" && !Array.isArray(value) ? value[mode] : value);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const url = (abs) => pathToFileURL(abs).href;

function screenshot(media, mode, root, label) {
  const src = resolveAsset(root, forMode(media.src, mode), label);
  const position = forMode(media.position, mode) ?? "50% 0%";
  const zoom = forMode(media.zoom, mode) ?? 1;
  return `<img class="shot" src="${url(src)}" style="object-position:${position};transform:scale(${zoom});transform-origin:${position}" alt="">`;
}

function frames(media, mode, root, label) {
  const srcs = forMode(media.src, mode);
  return `<div class="frames">${srcs
    .map((p, i) => `<figure><img src="${url(resolveAsset(root, p, label))}" alt=""><figcaption>${String(i + 1).padStart(2, "0")}</figcaption></figure>`)
    .join("")}</div>`;
}

function terminal(media, mode, root, label) {
  const text = readFileSync(resolveAsset(root, forMode(media.src, mode), label), "utf8").trimEnd();
  const lines = text.split("\n").map((line) => {
    let html = esc(line);
    if (line.startsWith("$ ")) return `<span class="prompt">$</span> <span class="cmd">${html.slice(2)}</span>`;
    html = html.replace(/\[critical\]/g, '<span class="crit">[critical]</span>').replace(/\[info\s*\]/g, (m) => `<span class="info">${m}</span>`);
    return html;
  });
  const title = media.title ?? text.split("\n")[0].replace(/^\$ /, "");
  return `<div class="term"><div class="bar"><i></i><i></i><i></i><span>${esc(title)}</span></div><pre>${lines.join("\n")}</pre></div>`;
}

function html(media, mode, root, label) {
  return readFileSync(resolveAsset(root, forMode(media.src, mode), label), "utf8");
}

const RENDERERS = { screenshot, frames, terminal, html };

export function renderMedia(card, mode, root, overlay = "") {
  const { media } = card;
  const render = RENDERERS[media?.type];
  if (!render) throw new Error(`${card.repo}: unknown media.type "${media?.type}" (expected ${Object.keys(RENDERERS).join(", ")})`);
  const caption = media.caption ? `<div class="caption">${esc(media.caption)}</div>` : "";
  return `<div class="media media-${media.type}">${render(media, mode, root, card.repo)}${caption}${overlay}</div>`;
}

export const MEDIA_CSS = `
  .media { position: relative; overflow: hidden; background: var(--media); border: 1px solid var(--panelEdge); }
  .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .caption { position: absolute; right: 12px; bottom: 10px; font: 400 11px/1 var(--mono); color: var(--faint); letter-spacing: 0.02em; }
  .frames { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: var(--frame-gap, 18px);
    background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 10%, var(--media)), var(--media)); }
  .frames figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .frames img { height: var(--frame-h, 228px); aspect-ratio: 9 / 16; object-fit: cover; border-radius: 12px; display: block;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 14%, transparent), 0 12px 28px -12px rgba(0, 0, 0, 0.45); }
  .frames figcaption { font: 400 11px/1 var(--mono); color: var(--faint); }
  .term { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--termBg); }
  .term .bar { display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border-bottom: 1px solid var(--panelEdge); }
  .term .bar i { width: 10px; height: 10px; border-radius: 50%; background: var(--line); opacity: 0.8; }
  .term .bar span { flex: 1; text-align: center; margin-right: 44px; font: 400 11.5px/1 var(--mono); color: var(--faint); }
  .term pre { margin: 0; padding: 14px 16px; font: 400 var(--term-size, 11.4px)/1.62 var(--mono); color: var(--text); white-space: pre; overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, #000 86%, transparent); mask-image: linear-gradient(90deg, #000 86%, transparent); }
  .term .prompt { color: var(--verified); }
  .term .cmd { color: var(--ink); font-weight: 500; }
  .term .crit { color: var(--blocked); }
  .term .info { color: var(--accent); }
`;
