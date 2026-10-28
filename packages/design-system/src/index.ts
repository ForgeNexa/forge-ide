export type Theme = 'graphite-dark' | 'sand-light';

export const THEMES = {
  GRAPHITE_DARK: 'graphite-dark' as const,
  SAND_LIGHT: 'sand-light' as const,
};

export const DIMENSIONS = {
  ACTIVITY_BAR_WIDTH: 48,
  SIDEBAR_MIN_WIDTH: 180,
  SIDEBAR_DEFAULT_WIDTH: 260,
  STATUS_BAR_HEIGHT: 24,
  TITLE_BAR_HEIGHT: 36,
  TAB_HEIGHT: 35,
};

export const PRODUCT_INFO = {
  NAME: 'my-forge',
  COMPANY: 'Yantra Works',
  TAGLINE: 'Your workspace for building software.',
  VERSION: '0.1.0',
};
