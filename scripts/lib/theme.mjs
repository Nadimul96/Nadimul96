// One palette for the banner, cards and social previews. The light and dark
// backgrounds match GitHub's own page colors so the images sit flush on the profile.
export const THEMES = {
  light: {
    page: "#ffffff",
    panel: "#f6f8fa",
    panelEdge: "#d8dee4",
    media: "#eef1f5",
    termBg: "#fbfcfd",
    ink: "#1b2d47",
    text: "#24292f",
    muted: "#57606a",
    faint: "#8c959f",
    grid: "#d0d7de",
    line: "#b6c0cc",
    accent: "#2563eb",
    verified: "#1a7f37",
    blocked: "#cf222e",
  },
  dark: {
    page: "#0d1117",
    panel: "#111821",
    panelEdge: "#262f3b",
    media: "#0a0e14",
    termBg: "#0a0d12",
    ink: "#e6edf3",
    text: "#d1d9e0",
    muted: "#9198a1",
    faint: "#6e7681",
    grid: "#1f2630",
    line: "#3a4553",
    accent: "#6ca4ff",
    verified: "#3fb950",
    blocked: "#f47067",
  },
};

export const MODES = Object.keys(THEMES);
