// Launches headless Chromium through playwright-core (no bundled browser download).
// Set CHROMIUM_PATH to use a specific binary; otherwise the newest Playwright
// headless shell in the local cache is used.
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

function cachedHeadlessShell() {
  const cacheDir =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    (platform() === "darwin" ? join(homedir(), "Library/Caches/ms-playwright") : join(homedir(), ".cache/ms-playwright"));
  if (!existsSync(cacheDir)) return undefined;
  const dirs = readdirSync(cacheDir)
    .filter((d) => d.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const dir of dirs) {
    for (const sub of readdirSync(join(cacheDir, dir))) {
      const bin = join(cacheDir, dir, sub, "chrome-headless-shell");
      if (existsSync(bin)) return bin;
    }
  }
  return undefined;
}

export async function launch() {
  const executablePath = process.env.CHROMIUM_PATH ?? cachedHeadlessShell();
  if (!executablePath) {
    throw new Error("No Chromium found. Run `npx playwright install chromium-headless-shell` or set CHROMIUM_PATH.");
  }
  return chromium.launch({ executablePath });
}
