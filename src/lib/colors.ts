// Keep in sync with the brand tokens in tailwind.config.js theme.extend.colors.
// Duplicated here because tailwind.config.js only runs in Node at build time,
// while these values are needed at runtime for third-party components (icons)
// that don't support NativeWind className interop.
export const colors = {
  primary: '#004AC6',
  warning: '#996100',
  statusPending: '#BA1A1A',
  statusReview: '#004AC6',
  statusResolved: '#006C49',
} as const;
