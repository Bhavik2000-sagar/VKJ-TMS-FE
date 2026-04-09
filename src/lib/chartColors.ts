export const chartPalette = [
  "#FFCF2B", // brand
  "#22C55E", // green
  "#38BDF8", // sky
  "#A78BFA", // violet
  "#FB7185", // rose
  "#F97316", // orange
  "#34D399", // emerald
  "#60A5FA", // blue
  "#FBBF24", // amber
  "#F472B6", // pink
] as const;

export function chartColor(index: number) {
  const i = Number.isFinite(index) ? Math.abs(index) : 0;
  return chartPalette[i % chartPalette.length];
}
