# Profile asset scripts

Everything the profile README shows is generated here and committed under `assets/`.
No third-party image services; nothing is fetched at view time.

```bash
npm install
npm run build      # banner SVGs, featured-work cards, repo social previews
npm run preview    # render README.md via GitHub's markdown API, screenshot light/dark/mobile into .preview/
```

The build expects the project repos cloned next to this one (`../bestdecks`, `../slideshow-renderer`, ...),
because card images are read from their `docs/` folders. Chromium comes from the local Playwright cache;
set `CHROMIUM_PATH` to use another binary.

| Script | Reads | Writes |
| --- | --- | --- |
| `build-banner.mjs` | `cards.json` → `banner` | `assets/banner-{light,dark}.svg` (all text outlined to paths) |
| `build-cards.mjs [repo ...]` | `cards.json` → `cards` | `assets/cards/<repo>-{light,dark}.webp`, `assets/social/<repo>.png` (1280x640) |
| `preview-readme.mjs` | `README.md` | `.preview/readme-{light,dark,mobile}.png` (gitignored) |

## Editing cards

All copy lives in `cards.json`. Each card's `media` block picks one of four renderers:

| `type` | `src` | Notes |
| --- | --- | --- |
| `screenshot` | image path, or `{ "light": ..., "dark": ... }` | optional `position` (CSS object-position) and `zoom` |
| `frames` | array of 9:16 image paths | shown side by side as phone frames |
| `terminal` | text file; a first line starting with `$ ` is the command | optional `title` for the window bar |
| `html` | HTML fragment using the card's CSS variables | optional `caption` |

To swap in a new screenshot, point `src` at it and run `npm run build`. A missing file fails the build
rather than producing an empty card. Cards must stay under 250 KB and social previews under 1 MB; the
script checks both.
