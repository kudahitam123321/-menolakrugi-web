import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Ban, Eye } from 'lucide-react';
import type { TreePlanConfig, TreeNode, TreeResult, PlanLevel } from '../../types/tradingPlan';

interface Props {
  planType: string;
  config: TreePlanConfig;
  memberName?: string;
}

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

// path entry tracks which question was answered and where it led
interface PathEntry {
  fromId: string;
  choiceLabel: string;
  nextId: string;
}

function levelColor(level: PlanLevel): string {
  switch (level) {
    case 'ok':     return CV.up;
    case 'warn':   return CV.gold;
    case 'danger': return CV.down;
    case 'eye':    return CV.dim;
  }
}

function LevelIcon({ level, size = 13 }: { level: PlanLevel; size?: number }) {
  const color = levelColor(level);
  const s: React.CSSProperties = { flexShrink: 0, marginTop: 2 };
  switch (level) {
    case 'ok':     return <CheckCircle   size={size} color={color} style={s} />;
    case 'warn':   return <AlertTriangle size={size} color={color} style={s} />;
    case 'danger': return <Ban           size={size} color={color} style={s} />;
    case 'eye':    return <Eye           size={size} color={color} style={s} />;
  }
}

function resultColors(cls: TreeResult['cls']) {
  if (cls === 'rc-ok')     return { bg: 'var(--mr-tint-green)', border: 'var(--mr-up-a27)',    title: CV.up   };
  if (cls === 'rc-warn')   return { bg: 'var(--mr-tint-gold)',  border: 'var(--mr-gold-a27)',  title: CV.gold };
  return                          { bg: 'var(--mr-tint-red)',   border: 'var(--mr-down-a20)',  title: CV.down };
}

function ResultIcon({ cls, size = 20 }: { cls: TreeResult['cls']; size?: number }) {
  const color = resultColors(cls).title;
  const s: React.CSSProperties = { flexShrink: 0, marginTop: 2 };
  if (cls === 'rc-ok')     return <CheckCircle   size={size} color={color} style={s} />;
  if (cls === 'rc-warn')   return <AlertTriangle size={size} color={color} style={s} />;
  return                          <Ban           size={size} color={color} style={s} />;
}

export default function TradingPlanDecisionTree({ planType, config }: Props) {
  const { nodes, rootId, keyrules } = config;
  const [path, setPath] = useState<PathEntry[]>([]);

  // Current node derived from path state — no extra useState needed
  const currentId   = path.length > 0 ? path[path.length - 1].nextId : rootId;
  const currentNode: TreeNode | undefined = nodes[currentId];

  function reset() { setPath([]); }
  function goBack() { setPath(prev => prev.slice(0, -1)); }
  function selectChoice(choiceLabel: string, nextId: string) {
    setPath(prev => [...prev, { fromId: currentId, choiceLabel, nextId }]);
  }

  const isBasicPill = planType.toLowerCase().includes('basic');
  const pill = isBasicPill
    ? { text: planType, bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)', color: '#60a5fa' }
    : { text: planType, bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.28)',  color: CV.gold   };

  // ── Guard: not configured ─────────────────────────────────────────────────
  if (!rootId || !nodes[rootId]) {
    return (
      <div style={{ padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid var(--mr-down-a20)', borderRadius: 10, fontFamily: CV.mono, color: CV.down, fontSize: 12, lineHeight: 1.7 }}>
        Trading Plan belum dikonfigurasi.<br />
        Admin perlu menambahkan pertanyaan dan menetapkan pertanyaan awal.
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div style={{ padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid var(--mr-down-a20)', borderRadius: 10, fontFamily: CV.mono, color: CV.down, fontSize: 12 }}>
        Node tidak ditemukan ({currentId}). Konfigurasi trading plan perlu diperbaiki oleh admin.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: CV.sans, color: CV.text, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: pill.bg, border: `1px solid ${pill.border}` }}>
          <span style={{ fontFamily: CV.mono, fontSize: 10, fontWeight: 700, color: pill.color, letterSpacing: 0.5 }}>
            {pill.text}
          </span>
        </div>
        {path.length > 0 && (
          <button onClick={reset} style={{
            fontFamily: CV.mono, fontSize: 9, color: CV.dim, background: 'none',
            border: `1px solid ${CV.border2}`, padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
          }}>↺ Mulai Ulang</button>
        )}
      </div>

      {/* ── Breadcrumb path ───────────────────────────────────────────── */}
      {path.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, alignItems: 'center' }}>
          {path.map((entry, i) => (
            <React.Fragment key={i}>
              <span style={{
                fontFamily: CV.mono, fontSize: 9, color: CV.dim,
                padding: '2px 8px', background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 20,
              }}>{entry.choiceLabel}</span>
              {i < path.length - 1 && (
                <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim }}>›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Question node ─────────────────────────────────────────────── */}
      {currentNode.type === 'question' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, letterSpacing: 1, marginBottom: 8 }}>
              LANGKAH {path.length + 1}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: CV.text, lineHeight: 1.5, marginBottom: 14 }}>
              {currentNode.text || 'Pertanyaan'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {currentNode.choices.length === 0 && (
                <div style={{ fontFamily: CV.mono, fontSize: 11, color: CV.dim, padding: '12px', textAlign: 'center' as const, border: `1px dashed ${CV.border2}`, borderRadius: 7 }}>
                  Pertanyaan ini belum memiliki pilihan jawaban.
                </div>
              )}
              {currentNode.choices.map((choice) => {
                const target = nodes[choice.nextId];
                const isResult = target?.type === 'result';
                const hoverColor = isResult
                  ? resultColors((target as TreeResult).cls).title
                  : CV.gold;

                return (
                  <button
                    key={choice.id}
                    onClick={() => choice.nextId && selectChoice(choice.label, choice.nextId)}
                    disabled={!choice.nextId}
                    style={{
                      padding: '12px 14px', background: CV.bg,
                      border: `1px solid ${choice.nextId ? CV.border2 : CV.border}`,
                      borderRadius: 8, cursor: choice.nextId ? 'pointer' : 'not-allowed',
                      textAlign: 'left' as const, transition: 'border-color 0.15s',
                      opacity: choice.nextId ? 1 : 0.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    }}
                    onMouseEnter={e => { if (choice.nextId) (e.currentTarget as HTMLButtonElement).style.borderColor = hoverColor; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = choice.nextId ? CV.border2 : CV.border; }}
                  >
                    <span style={{ fontFamily: CV.mono, fontSize: 12, fontWeight: 600, color: CV.text }}>
                      {choice.label || '(pilihan tanpa teks)'}
                    </span>
                    <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, flexShrink: 0 }}>
                      {choice.nextId ? '›' : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {path.length > 0 && (
            <button onClick={goBack} style={{
              fontFamily: CV.mono, fontSize: 10, color: CV.dim, background: 'none',
              border: `1px solid ${CV.border}`, padding: '7px 16px', borderRadius: 6,
              cursor: 'pointer', alignSelf: 'flex-start' as const,
            }}>← Kembali</button>
          )}
        </div>
      )}

      {/* ── Result node ───────────────────────────────────────────────── */}
      {currentNode.type === 'result' && (() => {
        const clr = resultColors(currentNode.cls);
        return (
          <>
            {/* Result card */}
            <div style={{ background: clr.bg, border: `1px solid ${clr.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${clr.border}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ResultIcon cls={currentNode.cls} />
                <div>
                  <div style={{ fontFamily: CV.mono, fontSize: 8, color: clr.title, letterSpacing: 1, marginBottom: 4 }}>// KEPUTUSAN TRADING</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: clr.title, lineHeight: 1.4 }}>
                    {currentNode.title || '(tanpa judul)'}
                  </div>
                </div>
              </div>
              {currentNode.steps.length > 0 && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {currentNode.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <LevelIcon level={step.level} />
                      <div style={{ fontSize: 12, color: CV.text, lineHeight: 1.6, flex: 1 }}>{step.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key rules */}
            {keyrules.length > 0 && (
              <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.gold, letterSpacing: 1, marginBottom: 10 }}>// KUNCI UTAMA — SELALU BERLAKU</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                  {keyrules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <LevelIcon level={rule.level} />
                      <div style={{ fontSize: 12, color: CV.text, lineHeight: 1.5, flex: 1 }}>{rule.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {path.length > 0 && (
                <button onClick={goBack} style={{
                  fontFamily: CV.mono, fontSize: 10, color: CV.dim, background: 'none',
                  border: `1px solid ${CV.border}`, padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                }}>← Kembali</button>
              )}
              <button onClick={reset} style={{
                fontFamily: CV.mono, fontSize: 10, color: CV.gold, background: 'none',
                border: `1px solid ${CV.border2}`, padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
              }}>↺ Mulai Ulang</button>
            </div>
          </>
        );
      })()}

    </div>
  );
}
