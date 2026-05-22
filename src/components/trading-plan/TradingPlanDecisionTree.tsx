import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Ban, Eye } from 'lucide-react';
import type { PlanConfig, PlanLevel, PlanType, ScenarioKey } from '../../types/tradingPlan';

interface Props {
  planType: PlanType;
  config: PlanConfig;
  memberName?: string;
}

type BiasType = 'bull' | 'bear';
type MtfDir = 'same' | 'opp';
type RangeSize = 'small' | 'large';
type PijakanChoice = 'yes' | 'no';
type AreaPos = 'supporting' | 'blocking';

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

interface LevelStyle { color: string; bg: string; border: string }
function levelStyle(level: PlanLevel): LevelStyle {
  switch (level) {
    case 'ok':     return { color: 'var(--mr-up)',   bg: 'var(--mr-tint-green)', border: 'var(--mr-up-a27)' };
    case 'warn':   return { color: 'var(--mr-gold)', bg: 'var(--mr-tint-gold)',  border: 'var(--mr-gold-a27)' };
    case 'danger': return { color: 'var(--mr-down)', bg: 'var(--mr-tint-red)',   border: 'var(--mr-down-a20)' };
    case 'eye':    return { color: 'var(--mr-dim)',  bg: 'var(--mr-panel)',       border: 'var(--mr-border)' };
  }
}

function LevelIcon({ level, size = 13 }: { level: PlanLevel; size?: number }) {
  const s = levelStyle(level);
  const props = { size, color: s.color, style: { flexShrink: 0, marginTop: 2 } as React.CSSProperties };
  switch (level) {
    case 'ok':     return <CheckCircle {...props} />;
    case 'warn':   return <AlertTriangle {...props} />;
    case 'danger': return <Ban {...props} />;
    case 'eye':    return <Eye {...props} />;
  }
}

function resolveScenario(
  mtfDir: MtfDir | null,
  rangeSize: RangeSize | null,
  pijakan: PijakanChoice | null,
  areaPos: AreaPos | null,
): ScenarioKey | null {
  if (!mtfDir) return null;
  if (mtfDir === 'same') {
    if (!rangeSize) return null;
    if (rangeSize === 'small') return 'same_kecil';
    if (!pijakan) return null;
    return pijakan === 'yes' ? 'same_besar_pijakan' : 'same_besar_nopijakan';
  }
  if (!areaPos) return null;
  if (areaPos === 'blocking') return 'opp_blocked';
  if (!pijakan) return null;
  return pijakan === 'yes' ? 'opp_allowed_pijakan' : 'opp_allowed_nopijakan';
}

function fill(text: string, bias: BiasType): string {
  const act = bias === 'bull' ? 'BUY' : 'SELL';
  const opp = bias === 'bull' ? 'SELL' : 'BUY';
  const premArea = bias === 'bull' ? 'Premium' : 'Diskon';
  return text.replace(/\{act\}/g, act).replace(/\{opp\}/g, opp).replace(/\{premArea\}/g, premArea);
}

// ── Step card (collapsible) ─────────────────────────────────────────────────
function StepCard({ title, hint, collapsed, onToggle, children, visible }: {
  title: string; hint?: string; collapsed: boolean;
  onToggle: () => void; children: React.ReactNode; visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontFamily: CV.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: CV.gold }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hint && <span style={{ fontFamily: CV.mono, fontSize: 9, color: CV.up }}>{hint}</span>}
          <span style={{ fontFamily: CV.mono, fontSize: 11, color: CV.dim }}>{collapsed ? '▸' : '▾'}</span>
        </div>
      </button>
      {!collapsed && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Option button ────────────────────────────────────────────────────────────
function OptBtn({ label, desc, active, onClick, color = CV.gold }: {
  label: string; desc?: string; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 12px', background: active ? `${color}18` : CV.bg,
      border: `1px solid ${active ? color : CV.border2}`, borderRadius: 8,
      cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s',
    }}>
      <div style={{ fontFamily: CV.mono, fontSize: 11, fontWeight: 700, color: active ? color : CV.dim }}>{label}</div>
      {desc && <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TradingPlanDecisionTree({ planType, config }: Props) {
  const [bias, setBias]         = useState<BiasType | null>(null);
  const [mtfDir, setMtfDir]     = useState<MtfDir | null>(null);
  const [rangeSize, setRangeSize] = useState<RangeSize | null>(null);
  const [pijakan, setPijakan]   = useState<PijakanChoice | null>(null);
  const [areaPos, setAreaPos]   = useState<AreaPos | null>(null);
  const [notes, setNotes]       = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function reset() {
    setBias(null); setMtfDir(null); setRangeSize(null);
    setPijakan(null); setAreaPos(null); setNotes(''); setCollapsed({});
  }
  function tog(id: string) { setCollapsed(p => ({ ...p, [id]: !p[id] })); }
  function col(id: string) { setCollapsed(p => ({ ...p, [id]: true })); }

  function selectBias(b: BiasType) {
    setBias(b); setMtfDir(null); setRangeSize(null); setPijakan(null); setAreaPos(null);
  }
  function selectMtf(d: MtfDir) {
    setMtfDir(d); setRangeSize(null); setPijakan(null); setAreaPos(null); col('step-mtf');
  }
  function selectRange(s: RangeSize) {
    setRangeSize(s); setPijakan(null); col('step-range');
  }
  function selectArea(p: AreaPos) {
    setAreaPos(p); setPijakan(null); col('step-area');
  }
  function selectPijakan(p: PijakanChoice) {
    setPijakan(p); col(mtfDir === 'same' ? 'step-pij-same' : 'step-pij-opp');
  }

  const scenarioKey = resolveScenario(mtfDir, rangeSize, pijakan, areaPos);

  const pill = planType === 'basic'
    ? { text: 'Konfirmasi: Real Structure Only', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)', color: '#60a5fa' }
    : { text: 'Konfirmasi: Internal Structure + Real Structure', bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.28)', color: 'var(--mr-gold)' };

  const biasBullLabel = bias === 'bull' ? 'Bullish' : 'Bearish';
  const biasBearLabel = bias === 'bull' ? 'Bearish' : 'Bullish';
  const supportingAreaLabel = bias === 'bull' ? 'Area Premium' : 'Area Diskon';
  const blockingAreaLabel   = bias === 'bull' ? 'Area Diskon'  : 'Area Premium';

  return (
    <div style={{ fontFamily: CV.sans, color: CV.text, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: pill.bg, border: `1px solid ${pill.border}` }}>
          <span style={{ fontFamily: CV.mono, fontSize: 10, fontWeight: 700, color: pill.color, letterSpacing: 0.5 }}>{pill.text}</span>
        </div>
        {bias !== null && (
          <button onClick={reset} style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, background: 'none', border: `1px solid ${CV.border2}`, padding: '4px 10px', borderRadius: 5, cursor: 'pointer' }}>
            ↺ Mulai ulang
          </button>
        )}
      </div>

      {/* Bias toggle */}
      <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, letterSpacing: 1, marginBottom: 10 }}>PILIH BIAS UTAMA</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => selectBias('bull')} style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: CV.mono, fontSize: 11, fontWeight: 700,
            border: `1px solid ${bias === 'bull' ? 'var(--mr-up)' : CV.border2}`,
            background: bias === 'bull' ? 'var(--mr-tint-green)' : CV.bg,
            color: bias === 'bull' ? 'var(--mr-up)' : CV.dim,
          }}>▲ Bias Bullish · BUY</button>
          <button onClick={() => selectBias('bear')} style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: CV.mono, fontSize: 11, fontWeight: 700,
            border: `1px solid ${bias === 'bear' ? 'var(--mr-down)' : CV.border2}`,
            background: bias === 'bear' ? 'var(--mr-tint-red)' : CV.bg,
            color: bias === 'bear' ? 'var(--mr-down)' : CV.dim,
          }}>▼ Bias Bearish · SELL</button>
        </div>
        {bias && (
          <div style={{ marginTop: 8, fontFamily: CV.mono, fontSize: 10, color: bias === 'bull' ? 'var(--mr-up)' : 'var(--mr-down)' }}>
            Bias: {bias === 'bull' ? '▲ Bullish — arah utama BUY' : '▼ Bearish — arah utama SELL'}
          </div>
        )}
      </div>

      {/* Step 1 — MTF Direction */}
      <StepCard
        title="STEP 1 — KONDISI MTF"
        hint={mtfDir ? (mtfDir === 'same' ? `MTF searah ${biasBullLabel} ✓` : `MTF berbeda ${biasBearLabel} ✓`) : undefined}
        collapsed={!!collapsed['step-mtf']} onToggle={() => tog('step-mtf')} visible={bias !== null}
      >
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 2 }}>Bagaimana arah MTF relatif terhadap Bias?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OptBtn label={`MTF searah (${biasBullLabel})`} desc="MTF mengonfirmasi arah Bias" active={mtfDir === 'same'} onClick={() => selectMtf('same')} color="var(--mr-up)" />
          <OptBtn label={`MTF berbeda (${biasBearLabel})`} desc="MTF berlawanan dengan Bias" active={mtfDir === 'opp'} onClick={() => selectMtf('opp')} color="var(--mr-gold)" />
        </div>
      </StepCard>

      {/* Step 2a — Range (MTF same) */}
      <StepCard
        title="STEP 2 — UKURAN TRADING RANGE"
        hint={rangeSize ? (rangeSize === 'small' ? 'Range kecil ✓' : 'Range besar ✓') : undefined}
        collapsed={!!collapsed['step-range']} onToggle={() => tog('step-range')} visible={mtfDir === 'same'}
      >
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 2 }}>Seberapa besar trading range saat ini?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OptBtn label="Range kecil" desc="Kondisi consolidation / ranging sempit" active={rangeSize === 'small'} onClick={() => selectRange('small')} color="var(--mr-up)" />
          <OptBtn label="Range besar" desc="Pergerakan harga cukup signifikan" active={rangeSize === 'large'} onClick={() => selectRange('large')} color="var(--mr-gold)" />
        </div>
      </StepCard>

      {/* Step 3a — Pijakan (same + large) */}
      <StepCard
        title="STEP 3 — ADA PIJAKAN?"
        hint={pijakan !== null && mtfDir === 'same' ? (pijakan === 'yes' ? 'Ada pijakan ✓' : 'Tidak ada ✓') : undefined}
        collapsed={!!collapsed['step-pij-same']} onToggle={() => tog('step-pij-same')}
        visible={mtfDir === 'same' && rangeSize === 'large'}
      >
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 2 }}>Apakah ada pijakan untuk counter trend?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OptBtn label="Ada pijakan" desc="POI lama / struktur H1 teridentifikasi" active={pijakan === 'yes' && mtfDir === 'same'} onClick={() => selectPijakan('yes')} color="var(--mr-up)" />
          <OptBtn label="Tidak ada pijakan" desc="Tidak ada POI / struktur yang valid" active={pijakan === 'no' && mtfDir === 'same'} onClick={() => selectPijakan('no')} color="var(--mr-down)" />
        </div>
      </StepCard>

      {/* Step 2b — Area (MTF opp) */}
      <StepCard
        title="STEP 2 — POSISI HARGA VS BIAS"
        hint={areaPos ? (areaPos === 'supporting' ? `${supportingAreaLabel} ✓` : `${blockingAreaLabel} ✓`) : undefined}
        collapsed={!!collapsed['step-area']} onToggle={() => tog('step-area')} visible={mtfDir === 'opp'}
      >
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 6 }}>Di mana posisi harga terhadap range Bias?</div>
        <div style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, padding: '5px 10px', background: CV.bg, border: `1px solid ${CV.border}`, borderRadius: 5, marginBottom: 8 }}>
          ℹ️ Premium = harga sudah tinggi (di atas 50% range Bias)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OptBtn
            label={`${supportingAreaLabel} (mendukung MTF)`}
            desc={bias === 'bull' ? 'Harga di premium — ideal untuk SELL counter' : 'Harga di diskon — ideal untuk BUY counter'}
            active={areaPos === 'supporting'} onClick={() => selectArea('supporting')} color="var(--mr-gold)"
          />
          <OptBtn
            label={`${blockingAreaLabel} (tidak mendukung)`}
            desc="Ikut MTF di sini sangat berisiko"
            active={areaPos === 'blocking'} onClick={() => selectArea('blocking')} color="var(--mr-down)"
          />
        </div>
      </StepCard>

      {/* Step 3b — Pijakan (opp + supporting) */}
      <StepCard
        title="STEP 3 — ADA PIJAKAN?"
        hint={pijakan !== null && mtfDir === 'opp' && areaPos === 'supporting' ? (pijakan === 'yes' ? 'Ada pijakan ✓' : 'Tidak ada ✓') : undefined}
        collapsed={!!collapsed['step-pij-opp']} onToggle={() => tog('step-pij-opp')}
        visible={mtfDir === 'opp' && areaPos === 'supporting'}
      >
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 2 }}>Apakah ada pijakan untuk counter trend?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OptBtn label="Ada pijakan" desc="POI lama / struktur H1 teridentifikasi" active={pijakan === 'yes' && mtfDir === 'opp'} onClick={() => selectPijakan('yes')} color="var(--mr-up)" />
          <OptBtn label="Tidak ada pijakan" desc="Tidak ada POI / struktur yang valid" active={pijakan === 'no' && mtfDir === 'opp'} onClick={() => selectPijakan('no')} color="var(--mr-down)" />
        </div>
      </StepCard>

      {/* Result box */}
      {(() => {
        if (!scenarioKey || !bias) return null;
        const scenario = config.scenarios[scenarioKey];
        if (!scenario) return null;
        const clr = scenario.cls === 'rc-ok'
          ? { bg: 'var(--mr-tint-green)', border: 'var(--mr-up-a27)',    title: 'var(--mr-up)' }
          : scenario.cls === 'rc-warn'
          ? { bg: 'var(--mr-tint-gold)',  border: 'var(--mr-gold-a27)',   title: 'var(--mr-gold)' }
          : { bg: 'var(--mr-tint-red)',   border: 'var(--mr-down-a20)',   title: 'var(--mr-down)' };
        const Icon = scenario.icon === 'check' ? CheckCircle : scenario.icon === 'triangle' ? AlertTriangle : Ban;
        return (
          <div style={{ background: clr.bg, border: `1px solid ${clr.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${clr.border}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon size={20} color={clr.title} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: CV.mono, fontSize: 8, color: clr.title, letterSpacing: 1, marginBottom: 4 }}>// KEPUTUSAN TRADING</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: clr.title, lineHeight: 1.4 }}>{fill(scenario.title, bias)}</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {scenario.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <LevelIcon level={step.level} />
                  <div style={{ fontSize: 12, color: CV.text, lineHeight: 1.6, flex: 1 }}>{fill(step.text, bias)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Key rules */}
      {scenarioKey && (
        <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.gold, letterSpacing: 1, marginBottom: 10 }}>// KUNCI UTAMA — SELALU BERLAKU</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {config.keyrules.map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <LevelIcon level={rule.level} />
                <div style={{ fontSize: 12, color: CV.text, lineHeight: 1.5, flex: 1 }}>{rule.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {scenarioKey && (
        <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, letterSpacing: 1, marginBottom: 8 }}>// CATATAN PRIBADI</div>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Tulis catatan untuk plan ini..." rows={3}
            style={{ width: '100%', background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text, borderRadius: 6, padding: '8px 12px', fontFamily: CV.mono, fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = CV.gold; }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = CV.border2; }}
          />
        </div>
      )}
    </div>
  );
}
