import React, { useState } from 'react';
import type { PlanConfig, PlanLevel, PlanType, ScenarioKey, PlanScenario, PlanStep } from '../../types/tradingPlan';

interface Props {
  planType: PlanType;
  config: PlanConfig;
  onChange: (newConfig: PlanConfig) => void;
}

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace',
};

const LEVEL_OPTIONS: { level: PlanLevel; label: string; color: string }[] = [
  { level: 'ok',     label: '✓', color: 'var(--mr-up)'   },
  { level: 'warn',   label: '!', color: 'var(--mr-gold)' },
  { level: 'danger', label: '✕', color: 'var(--mr-down)' },
  { level: 'eye',    label: '◉', color: 'var(--mr-dim)'  },
];

const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  same_kecil:            'MTF Searah + Range Kecil',
  same_besar_pijakan:    'MTF Searah + Range Besar + Ada Pijakan',
  same_besar_nopijakan:  'MTF Searah + Range Besar + Tidak Ada Pijakan',
  opp_blocked:           'MTF Berbeda + Area Tidak Mendukung',
  opp_allowed_pijakan:   'MTF Berbeda + Area Mendukung + Ada Pijakan',
  opp_allowed_nopijakan: 'MTF Berbeda + Area Mendukung + Tidak Ada Pijakan',
};

const SCENARIO_KEYS: ScenarioKey[] = [
  'same_kecil', 'same_besar_pijakan', 'same_besar_nopijakan',
  'opp_blocked', 'opp_allowed_pijakan', 'opp_allowed_nopijakan',
];

function clsStyle(cls: PlanScenario['cls']): { hdr: string; border: string; badge: string } {
  switch (cls) {
    case 'rc-ok':     return { hdr: 'var(--mr-tint-green)', border: 'var(--mr-up-a27)',  badge: 'var(--mr-up)'   };
    case 'rc-warn':   return { hdr: 'var(--mr-tint-gold)',  border: 'var(--mr-gold-a27)', badge: 'var(--mr-gold)' };
    case 'rc-danger': return { hdr: 'var(--mr-tint-red)',   border: 'var(--mr-down-a20)', badge: 'var(--mr-down)' };
  }
}

function LevelPicker({ current, onChange }: { current: PlanLevel; onChange: (l: PlanLevel) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
      {LEVEL_OPTIONS.map(opt => (
        <button key={opt.level} onClick={() => onChange(opt.level)} title={opt.level} style={{
          width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
          border: `2px solid ${current === opt.level ? opt.color : 'transparent'}`,
          background: current === opt.level ? `${opt.color}30` : 'var(--mr-border)',
          color: opt.color, fontWeight: 700, fontSize: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

function StepRow({ step, onChange, onDelete }: {
  step: PlanStep; onChange: (s: PlanStep) => void; onDelete: () => void;
}) {
  const inp: React.CSSProperties = {
    flex: 1, background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '6px 10px', fontFamily: CV.mono, fontSize: 11, outline: 'none',
  };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <LevelPicker current={step.level} onChange={level => onChange({ ...step, level })} />
      <input value={step.text} onChange={e => onChange({ ...step, text: e.target.value })} style={inp}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = CV.gold; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = CV.border2; }}
      />
      <button onClick={onDelete} style={{
        background: 'none', border: `1px solid var(--mr-border)`, color: CV.down,
        borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>×</button>
    </div>
  );
}

function updScenarios(
  existing: Record<ScenarioKey, PlanScenario>,
  key: ScenarioKey,
  scenario: PlanScenario,
): Record<ScenarioKey, PlanScenario> {
  return { ...existing, [key]: scenario } as Record<ScenarioKey, PlanScenario>;
}

export default function TradingPlanAdminEditor({ planType, config, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ same_kecil: true });
  const tog = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));

  // Key rules
  function updRule(i: number, step: PlanStep) {
    const keyrules = config.keyrules.map((r, idx) => (idx === i ? step : r));
    onChange({ ...config, keyrules });
  }
  function delRule(i: number) {
    onChange({ ...config, keyrules: config.keyrules.filter((_, idx) => idx !== i) });
  }
  function addRule() {
    onChange({ ...config, keyrules: [...config.keyrules, { level: 'ok' as PlanLevel, text: '' }] });
  }

  // Scenario title
  function updTitle(key: ScenarioKey, title: string) {
    onChange({ ...config, scenarios: updScenarios(config.scenarios, key, { ...config.scenarios[key], title }) });
  }

  // Scenario steps
  function updStep(key: ScenarioKey, si: number, step: PlanStep) {
    const steps = config.scenarios[key].steps.map((s, i) => (i === si ? step : s));
    onChange({ ...config, scenarios: updScenarios(config.scenarios, key, { ...config.scenarios[key], steps }) });
  }
  function delStep(key: ScenarioKey, si: number) {
    const steps = config.scenarios[key].steps.filter((_, i) => i !== si);
    onChange({ ...config, scenarios: updScenarios(config.scenarios, key, { ...config.scenarios[key], steps }) });
  }
  function addStep(key: ScenarioKey) {
    const steps = [...config.scenarios[key].steps, { level: 'ok' as PlanLevel, text: '' }];
    onChange({ ...config, scenarios: updScenarios(config.scenarios, key, { ...config.scenarios[key], steps }) });
  }

  const inp: React.CSSProperties = {
    background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '7px 10px', fontFamily: CV.mono, fontSize: 11,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

      {/* Info banner */}
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px' }}>
        <span style={{ fontFamily: CV.mono, fontSize: 10, color: '#60a5fa', lineHeight: 1.7 }}>
          Placeholder: <strong>{'{act}'}</strong> = BUY/SELL sesuai Bias &nbsp;·&nbsp; <strong>{'{opp}'}</strong> = arah berlawanan &nbsp;·&nbsp; <strong>{'{premArea}'}</strong> = Premium/Diskon
        </span>
      </div>

      {/* Key rules */}
      <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1, marginBottom: 12 }}>// KUNCI UTAMA</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {config.keyrules.map((rule, i) => (
            <StepRow key={i} step={rule} onChange={s => updRule(i, s)} onDelete={() => delRule(i)} />
          ))}
        </div>
        <button onClick={addRule} style={{ marginTop: 10, fontFamily: CV.mono, fontSize: 10, color: CV.gold, background: 'none', border: `1px dashed ${CV.border2}`, padding: '6px 12px', borderRadius: 5, cursor: 'pointer', width: '100%' }}>
          + Tambah kunci
        </button>
      </div>

      {/* Scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1 }}>// KOTAK HASIL</div>
        {SCENARIO_KEYS.map(key => {
          const sc = config.scenarios[key];
          if (!sc) return null;
          const st = clsStyle(sc.cls);
          const isOpen = !!open[key];
          return (
            <div key={key} style={{ border: `1px solid ${st.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <button onClick={() => tog(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: st.hdr, border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: CV.mono, fontSize: 10, fontWeight: 700, color: st.badge }}>{SCENARIO_LABELS[key]}</span>
                  <span style={{ fontFamily: CV.mono, fontSize: 8, color: st.badge, border: `1px solid ${st.border}`, padding: '1px 5px', borderRadius: 3 }}>{planType.toUpperCase()}</span>
                </div>
                <span style={{ fontFamily: CV.mono, fontSize: 11, color: st.badge }}>{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '14px 16px', background: CV.panel, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 5 }}>JUDUL</div>
                    <input value={sc.title} onChange={e => updTitle(key, e.target.value)} style={inp}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = CV.gold; }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = CV.border2; }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 8 }}>LANGKAH-LANGKAH</div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                      {sc.steps.map((step, i) => (
                        <StepRow key={i} step={step} onChange={s => updStep(key, i, s)} onDelete={() => delStep(key, i)} />
                      ))}
                    </div>
                    <button onClick={() => addStep(key)} style={{ marginTop: 8, fontFamily: CV.mono, fontSize: 10, color: st.badge, background: 'none', border: `1px dashed ${st.border}`, padding: '5px 10px', borderRadius: 5, cursor: 'pointer', width: '100%' }}>
                      + Tambah langkah
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
