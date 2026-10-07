// lib/tokens.ts
export const tokens = {
  color: {
    bg: "#000000", surface: "#0d0d10", surface2: "#111116",
    line: "#1e1e25", line2: "#2a2a33",
    ink: "#f4f4f6", muted: "#8c8c96", muted2: "#6a6a73",
    white: "#ffffff", silver: "#c9ccd4",
  },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  space: (n: number) => n * 4,
  font: {
    display: "var(--font-bebas)",
    body: "var(--font-geist-sans)",
  },
  type: {
    display: { fontFamily: "var(--font-bebas)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.01em" },
    h1:      { fontFamily: "var(--font-bebas)", fontSize: 26, fontWeight: 400 },
    body:    { fontFamily: "var(--font-geist-sans)", fontSize: 15, fontWeight: 400 },
    small:   { fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "#8c8c96" },
    eyebrow: { fontFamily: "var(--font-geist-sans)", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" as const },
  },
} as const;
