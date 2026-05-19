// lib/theme.ts — Menolak Rugi Brand Colors
// Primary: Hijau (profit/positif) + Merah (branding logo)

export const MR = {
  // ── Brand utama ──
  gold:     '#16a34a',   // Hijau — primary accent (was #eab308 gold)
  gold2:    '#15803d',   // Hijau gelap — hover state
  
  // ── Background ──
  bg:       '#080808',
  dark:     '#0a0a0a',
  darker:   '#050505',
  panel:    '#111',
  
  // ── Border ──
  border:   '#1e1e1e',
  borderHot:'#2a2a2a',
  
  // ── Text ──
  text:     '#e7e5e4',
  muted:    '#9a9895',
  dim:      '#666',
  dimmer:   '#444',
  
  // ── Status ──
  up:       '#22c55e',   // Hijau terang — profit/aktif
  down:     '#ef4444',   // Merah — loss/negatif  
  
  // ── Typography ──
  sans: '"Geist",system-ui,sans-serif',
  mono: '"Geist Mono",monospace',
};

// Tier accent colors — logo hijau-merah theme
export const TIER_ACCENT: Record<string, string> = {
  'SMC Platinum 1 on 1': '#ef4444',   // Merah — tier tertinggi
  'SMC Gold Mentorship':  '#16a34a',  // Hijau — tier utama
  'SMC Silver Mentorship':'#22c55e',  // Hijau muda
  'SMC Bronze Mentorship':'#4ade80',  // Hijau pastel
};
