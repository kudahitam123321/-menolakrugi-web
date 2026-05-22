// lib/theme.ts — Menolak Rugi Brand Tokens
// Colors are CSS custom properties defined in index.css.
// Changing data-theme attribute on <html> switches the palette instantly.

export const MR = {
  gold:      'var(--mr-gold)',
  gold2:     'var(--mr-gold2)',
  bg:        'var(--mr-bg)',
  dark:      'var(--mr-dark)',
  darker:    'var(--mr-darker)',
  panel:     'var(--mr-panel)',
  border:    'var(--mr-border)',
  borderHot: 'var(--mr-border2)',
  text:      'var(--mr-text)',
  muted:     'var(--mr-muted)',
  dim:       'var(--mr-dim)',
  dimmer:    'var(--mr-dimmer)',
  up:        'var(--mr-up)',
  down:      'var(--mr-down)',
  sans: '"Geist",system-ui,sans-serif',
  mono: '"Geist Mono",monospace',
};

export const TIER_ACCENT: Record<string, string> = {
  'SMC Platinum 1 on 1': '#ef4444',
  'SMC Gold Mentorship':  '#16a34a',
  'SMC Silver Mentorship':'#22c55e',
  'SMC Bronze Mentorship':'#4ade80',
};

export function initTheme(): void {
  const saved = localStorage.getItem('mr_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

export function toggleTheme(): void {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mr_theme', next);
}
