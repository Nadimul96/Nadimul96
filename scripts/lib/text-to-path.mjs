// Converts text to SVG path data so the banner renders identically everywhere.
// GitHub serves README SVGs as images, which cannot load web fonts, so every
// glyph is outlined at build time from the bundled Inter / JetBrains Mono files.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import opentype from "opentype.js";

const require = createRequire(import.meta.url);
const cache = new Map();

const FONT_FILES = {
  "inter-400": "@fontsource/inter/files/inter-latin-400-normal.woff",
  "inter-500": "@fontsource/inter/files/inter-latin-500-normal.woff",
  "inter-600": "@fontsource/inter/files/inter-latin-600-normal.woff",
  "mono-400": "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  "mono-500": "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff",
};

export function loadFont(key) {
  if (!cache.has(key)) {
    const file = FONT_FILES[key];
    if (!file) throw new Error(`unknown font key: ${key}`);
    const buf = readFileSync(require.resolve(file));
    cache.set(key, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return cache.get(key);
}

// Lays glyphs out manually (advance + kerning + optional tracking) instead of
// using opentype's shaper, which does not support every GSUB lookup in Inter.
function layout(font, text, size, tracking) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...text].map((ch) => font.charToGlyph(ch));
  const placed = [];
  let x = 0;
  glyphs.forEach((glyph, i) => {
    placed.push({ glyph, x });
    x += glyph.advanceWidth * scale + tracking;
    const next = glyphs[i + 1];
    if (next) x += font.getKerningValue(glyph, next) * scale;
  });
  return { placed, width: x - (glyphs.length ? tracking : 0) };
}

export function measure(fontKey, text, size, tracking = 0) {
  return layout(loadFont(fontKey), text, size, tracking).width;
}

/** Returns SVG path data for `text` with its baseline at (x, y). */
export function textPath(fontKey, text, { x, y, size, tracking = 0, anchor = "start" }) {
  const font = loadFont(fontKey);
  const { placed, width } = layout(font, text, size, tracking);
  const originX = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
  return placed
    .map(({ glyph, x: gx }) => glyph.getPath(originX + gx, y, size).toPathData(2))
    .filter(Boolean)
    .join("");
}
