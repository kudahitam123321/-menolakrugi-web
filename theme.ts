// lib/theme.ts — Design tokens untuk Direction A (Terminal / Bloomberg)
// Import ini di setiap komponen yang butuh warna/spacing konsisten

export const MR = {
  // Background
  bg:       '#070707',
  panel:    '#0d0d0d',
  panel2:   '#111111',
  dark:     '#040404',
  darker:   '#050505',

  // Border
  border:   '#1f1f1f',
  borderHot:'#2a2a2a',

  // Text
  text:     '#e7e5e4',
  dim:      '#737373',
  dimmer:   '#525252',
  muted:    '#d4d4d4',

  // Accent
  up:       '#10b981',   // green — profit / bullish
  down:     '#ef4444',   // red   — loss / bearish
  gold:     '#eab308',   // gold  — CTA / highlight

  // Font
  mono:     '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
  sans:     '"Geist", system-ui, sans-serif',
  serif:    '"Instrument Serif", "Times New Roman", serif',
} as const;

// Tier accent colors
export const TIER_ACCENT: Record<string, { bg: string; border: string; label: string }> = {
  neutral:  { bg: MR.panel,    border: MR.border,   label: MR.dim },
  trial:    { bg: MR.panel,    border: MR.border,   label: MR.dim },
  bronze:   { bg: MR.panel,    border: '#3a2a1a',    label: '#c89a6a' },
  gold:     { bg: '#0e0c04',   border: MR.gold,      label: MR.gold },
  platinum: { bg: MR.panel,    border: '#2a2c3a',    label: '#b9c4d9' },
};

// Helper — tier label dari DB ke display
export const TIER_LABELS: Record<string, string> = {
  trial:          'SMC Trial',
  bronze:         'SMC Bronze',
  'smc silver':   'SMC Silver',
  gold:           'SMC Gold Mentorship',
  platinum:       'SMC Platinum 1-on-1',
};

// Helper CSS class string — reuse di setiap root artboard
export const MR_ROOT_STYLE: React.CSSProperties = {
  fontFamily: MR.sans,
  color: MR.text,
  background: MR.bg,
  minHeight: '100vh',
  WebkitFontSmoothing: 'antialiased',
};
