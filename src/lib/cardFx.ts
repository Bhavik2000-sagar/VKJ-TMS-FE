/**
 * Shared card effect: top-left "spotlight" circle expands on hover.
 * Implemented with ::before + clip-path so it works with any Card content.
 */
export const topLeftSpotlightCardClass =
  "relative before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] " +
  "before:bg-[color-mix(in_oklab,var(--brand),transparent_88%)] " +
  "dark:before:bg-[color-mix(in_oklab,var(--brand),transparent_82%)] " +
  "before:transition-[clip-path] before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "before:[clip-path:circle(30px_at_0%_0%)] " +
  "hover:before:[clip-path:circle(200%_at_0%_0%)]";

export const spotlightCardContentLayerClass = "relative z-[1]";

