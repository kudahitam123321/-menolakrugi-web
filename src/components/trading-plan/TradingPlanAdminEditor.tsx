import React, { useState } from 'react';
import type {
  TreePlanConfig, TreeNode, TreeQuestion, TreeResult,
  TreeChoice, PlanStep, PlanLevel, PlanType,
} from '../../types/tradingPlan';

interface Props {
  planType: PlanType;
  config: TreePlanConfig;
  onChange: (newConfig: TreePlanConfig) => void;
}

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace',
};

const LEVEL_OPTS: { level: PlanLevel; label: string; color: string }[] = [
  { level: 'ok',     label: '✓', color: 'var(--mr-up)'   },
  { level: 'warn',   label: '!', color: 'var(--mr-gold)' },
  { level: 'danger', label: '✕', color: 'var(--mr-down)' },
  { level: 'eye',    label: '◉', color: 'var(--mr-dim)'  },
];

const CLS_OPTS: { cls: TreeResult['cls']; label: string; color: string }[] = [
  { cls: 'rc-ok',     label: '✓ OK',        color: 'var(--mr-up)'   },
  { cls: 'rc-warn',   label: '! Hati-hati', color: 'var(--mr-gold)' },
  { cls: 'rc-danger', label: '✕ Bahaya',    color: 'var(--mr-down)' },
];

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}
function clsColor(cls: TreeResult['cls']) {
  return cls === 'rc-ok' ? CV.up : cls === 'rc-warn' ? CV.gold : CV.down;
}
function clsBg(cls: TreeResult['cls']) {
  return cls === 'rc-ok' ? 'var(--mr-tint-green)' : cls === 'rc-warn' ? 'var(--mr-tint-gold)' : 'var(--mr-tint-red)';
}
function clsBorder(cls: TreeResult['cls']) {
  return cls === 'rc-ok' ? 'var(--mr-up-a27)' : cls === 'rc-warn' ? 'var(--mr-gold-a27)' : 'var(--mr-down-a20)';
}

// ── Level picker ──────────────────────────────────────────────────────────────
function LevelPicker({ current, onChange }: { current: PlanLevel; onChange: (l: PlanLevel) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
      {LEVEL_OPTS.map(opt => (
        <button key={opt.level} onClick={() => onChange(opt.level)} style={{
          width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
          border: `2px solid ${current === opt.level ? opt.color : 'transparent'}`,
          background: current === opt.level ? `${opt.color}30` : CV.border,
          color: opt.color, fontWeight: 700, fontSize: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

// ── Step row ───────────────────────────────────────────────────────────────────
function StepRow({ step, onChange, onDelete }: {
  step: PlanStep; onChange: (s: PlanStep) => void; onDelete: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <LevelPicker current={step.level} onChange={level => onChange({ ...step, level })} />
      <input
        value={step.text}
        onChange={e => onChange({ ...step, text: e.target.value })}
        placeholder="Teks langkah..."
        style={{
          flex: 1, background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
          borderRadius: 5, padding: '6px 10px', fontFamily: CV.mono, fontSize: 11, outline: 'none',
        }}
      />
      <button onClick={onDelete} style={{
        background: 'none', border: `1px solid ${CV.border}`, color: CV.down,
        borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>×</button>
    </div>
  );
}

// ── Tree map (recursive visual preview) ───────────────────────────────────────
function TreeMapNode({ nodeId, nodes, visited }: {
  nodeId: string;
  nodes: Record<string, TreeNode>;
  visited: Set<string>;
}) {
  if (visited.has(nodeId)) {
    return <span style={{ fontFamily: CV.mono, fontSize: 10, color: '#ef4444' }}>⚠ Siklus!</span>;
  }
  const node = nodes[nodeId];
  if (!node) {
    return <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, fontStyle: 'italic' }}>? tidak ditemukan</span>;
  }
  const newVisited = new Set([...visited, nodeId]);

  if (node.type === 'result') {
    const color = clsColor(node.cls);
    const icon  = node.cls === 'rc-ok' ? '✓' : node.cls === 'rc-warn' ? '!' : '✕';
    return (
      <span style={{ fontFamily: CV.mono, fontSize: 10, color, fontWeight: 700 }}>
        [{icon} {node.title || '(tanpa judul)'}]
      </span>
    );
  }

  return (
    <div>
      <span style={{ fontFamily: CV.mono, fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>
        [❓ {node.text || '(tanpa teks)'}]
      </span>
      <div style={{ paddingLeft: 14 }}>
        {node.choices.length === 0 && (
          <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, fontStyle: 'italic', marginTop: 2 }}>
            (tidak ada pilihan)
          </div>
        )}
        {node.choices.map((choice, i) => (
          <div key={choice.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 3 }}>
            <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, flexShrink: 0, marginTop: 1 }}>
              {i === node.choices.length - 1 ? '└─' : '├─'}
            </span>
            <div>
              <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.text }}>
                {choice.label || <span style={{ fontStyle: 'italic', color: CV.dim }}>(kosong)</span>}
              </span>
              <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim }}> → </span>
              {choice.nextId
                ? <TreeMapNode nodeId={choice.nextId} nodes={nodes} visited={newVisited} />
                : <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, fontStyle: 'italic' }}>(belum ditetapkan)</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function TradingPlanAdminEditor({ config, onChange }: Props) {
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const [showMap,   setShowMap]   = useState(false);
  const tog = (k: string) => setOpenNodes(p => ({ ...p, [k]: !p[k] }));

  const { nodes, rootId, keyrules } = config;
  const questions = Object.values(nodes).filter((n): n is TreeQuestion => n.type === 'question');
  const results   = Object.values(nodes).filter((n): n is TreeResult   => n.type === 'result');

  // ── Config helpers ─────────────────────────────────────────────────────────
  function updNodes(newNodes: Record<string, TreeNode>) {
    onChange({ ...config, nodes: newNodes });
  }
  function setRoot(id: string) { onChange({ ...config, rootId: id }); }

  // ── Keyrules ───────────────────────────────────────────────────────────────
  function updRule(i: number, s: PlanStep) {
    onChange({ ...config, keyrules: keyrules.map((r, idx) => idx === i ? s : r) });
  }
  function delRule(i: number) {
    onChange({ ...config, keyrules: keyrules.filter((_, idx) => idx !== i) });
  }
  function addRule() {
    onChange({ ...config, keyrules: [...keyrules, { level: 'ok' as PlanLevel, text: '' }] });
  }

  // ── Question CRUD ──────────────────────────────────────────────────────────
  function addQuestion() {
    const id = uid('q');
    const node: TreeQuestion = { id, type: 'question', text: '', choices: [] };
    const newNodes = { ...nodes, [id]: node };
    // Auto-set root if first question
    onChange({ ...config, nodes: newNodes, rootId: rootId || id });
    setOpenNodes(p => ({ ...p, [id]: true }));
  }

  function updQuestion(id: string, upd: Partial<Omit<TreeQuestion, 'id' | 'type'>>) {
    const q = nodes[id] as TreeQuestion;
    updNodes({ ...nodes, [id]: { ...q, ...upd } });
  }

  function delQuestion(id: string) {
    const { [id]: _, ...rest } = nodes;
    const cleaned: Record<string, TreeNode> = {};
    for (const [k, n] of Object.entries(rest)) {
      cleaned[k] = n.type === 'question'
        ? { ...n, choices: n.choices.map(c => c.nextId === id ? { ...c, nextId: '' } : c) }
        : n;
    }
    onChange({ ...config, nodes: cleaned, rootId: rootId === id ? '' : rootId });
  }

  // ── Choice CRUD ────────────────────────────────────────────────────────────
  function addChoice(qId: string) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: [...q.choices, { id: uid('c'), label: '', nextId: '' }] } });
  }
  function updChoice(qId: string, ci: number, upd: Partial<TreeChoice>) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: q.choices.map((c, i) => i === ci ? { ...c, ...upd } : c) } });
  }
  function delChoice(qId: string, ci: number) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: q.choices.filter((_, i) => i !== ci) } });
  }

  // ── Result CRUD ────────────────────────────────────────────────────────────
  function addResult() {
    const id = uid('r');
    const node: TreeResult = { id, type: 'result', cls: 'rc-ok', title: '', steps: [] };
    updNodes({ ...nodes, [id]: node });
    setOpenNodes(p => ({ ...p, [id]: true }));
  }
  function updResult(id: string, upd: Partial<Omit<TreeResult, 'id' | 'type'>>) {
    const r = nodes[id] as TreeResult;
    updNodes({ ...nodes, [id]: { ...r, ...upd } });
  }
  function delResult(id: string) {
    const { [id]: _, ...rest } = nodes;
    const cleaned: Record<string, TreeNode> = {};
    for (const [k, n] of Object.entries(rest)) {
      cleaned[k] = n.type === 'question'
        ? { ...n, choices: n.choices.map(c => c.nextId === id ? { ...c, nextId: '' } : c) }
        : n;
    }
    onChange({ ...config, nodes: cleaned });
  }
  function addStep(id: string) {
    const r = nodes[id] as TreeResult;
    updResult(id, { steps: [...r.steps, { level: 'ok' as PlanLevel, text: '' }] });
  }
  function updStep(id: string, si: number, s: PlanStep) {
    const r = nodes[id] as TreeResult;
    updResult(id, { steps: r.steps.map((st, i) => i === si ? s : st) });
  }
  function delStep(id: string, si: number) {
    const r = nodes[id] as TreeResult;
    updResult(id, { steps: r.steps.filter((_, i) => i !== si) });
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '7px 10px', fontFamily: CV.mono, fontSize: 11,
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const sel: React.CSSProperties = {
    background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '6px 8px', fontFamily: CV.mono, fontSize: 11,
    outline: 'none', cursor: 'pointer',
  };
  const addBtn = (color: string, borderColor: string): React.CSSProperties => ({
    fontFamily: CV.mono, fontSize: 10, color,
    background: 'none', border: `1px dashed ${borderColor}`,
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', width: '100%', marginTop: 4,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

      {/* ── Kunci Utama ─────────────────────────────────────────────── */}
      <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1, marginBottom: 12 }}>// KUNCI UTAMA</div>
        <p style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, margin: '0 0 10px', lineHeight: 1.6 }}>
          Aturan yang selalu ditampilkan di bawah setiap hasil akhir.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {keyrules.map((rule, i) => (
            <StepRow key={i} step={rule} onChange={s => updRule(i, s)} onDelete={() => delRule(i)} />
          ))}
        </div>
        <button onClick={addRule} style={addBtn(CV.gold, CV.border2)}>+ Tambah kunci</button>
      </div>

      {/* ── Pertanyaan Awal ──────────────────────────────────────────── */}
      <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1, marginBottom: 8 }}>// PERTANYAAN AWAL (ROOT)</div>
        <p style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, margin: '0 0 10px', lineHeight: 1.6 }}>
          Pertanyaan pertama yang dilihat member saat membuka Trading Plan.
        </p>
        <select value={rootId} onChange={e => setRoot(e.target.value)} style={{ ...sel, width: '100%' }}>
          <option value="">— Pilih pertanyaan awal —</option>
          {questions.map(q => (
            <option key={q.id} value={q.id}>{q.text.slice(0, 80) || '(pertanyaan tanpa teks)'}</option>
          ))}
        </select>
      </div>

      {/* ── Peta Pohon ──────────────────────────────────────────────── */}
      {rootId && nodes[rootId] && (
        <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <button
            onClick={() => setShowMap(p => !p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1 }}>// PETA POHON KEPUTUSAN</span>
            <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim }}>{showMap ? '▾' : '▸'}</span>
          </button>
          {showMap && (
            <div style={{ padding: '4px 16px 16px', overflowX: 'auto' as const }}>
              <TreeMapNode nodeId={rootId} nodes={nodes} visited={new Set()} />
            </div>
          )}
        </div>
      )}

      {/* ── Pertanyaan ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: '#60a5fa', letterSpacing: 1 }}>// PERTANYAAN</div>
        <p style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, margin: 0, lineHeight: 1.6 }}>
          Tambah pertanyaan, lalu buat pilihan jawaban. Tiap jawaban bisa mengarah ke pertanyaan lain atau ke hasil akhir.
        </p>

        {questions.map((q) => {
          const isOpen = !!openNodes[q.id];
          const isRoot = rootId === q.id;
          return (
            <div key={q.id} style={{ border: `1px solid ${isRoot ? '#3b82f6' : CV.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', background: isRoot ? 'rgba(59,130,246,0.07)' : CV.panel }}>
                <button onClick={() => tog(q.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, minWidth: 0 }}>
                  {isRoot && (
                    <span style={{ fontFamily: CV.mono, fontSize: 8, background: '#3b82f6', color: '#fff', padding: '2px 7px', borderRadius: 3, flexShrink: 0 }}>ROOT</span>
                  )}
                  <span style={{ fontSize: 13, flexShrink: 0 }}>❓</span>
                  <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {q.text || <span style={{ color: CV.dim, fontStyle: 'italic' }}>pertanyaan tanpa teks</span>}
                  </span>
                  <span style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, flexShrink: 0 }}>{q.choices.length} pilihan</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10 }}>
                  <button onClick={() => delQuestion(q.id)} title="Hapus pertanyaan" style={{
                    background: 'none', border: `1px solid ${CV.border2}`, color: CV.down,
                    borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>×</button>
                  <span style={{ fontFamily: CV.mono, fontSize: 11, color: CV.dim, width: 14, textAlign: 'center' as const }}>{isOpen ? '▾' : '▸'}</span>
                </div>
              </div>

              {/* Body */}
              {isOpen && (
                <div style={{ padding: '14px 16px', background: CV.bg, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {/* Question text */}
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 6 }}>TEKS PERTANYAAN</div>
                    <input
                      value={q.text}
                      onChange={e => updQuestion(q.id, { text: e.target.value })}
                      placeholder="Contoh: Bagaimana kondisi MTF saat ini?"
                      style={{ ...inp, width: '100%' }}
                    />
                  </div>

                  {/* Choices */}
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 8 }}>
                      PILIHAN JAWABAN &amp; ALUR
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {q.choices.map((choice, ci) => (
                        <div key={choice.id} style={{
                          background: CV.panel, borderRadius: 7, border: `1px solid ${CV.border}`,
                          padding: '10px 12px',
                        }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, flexShrink: 0, minWidth: 18 }}>
                              {ci + 1}.
                            </span>
                            <input
                              value={choice.label}
                              onChange={e => updChoice(q.id, ci, { label: e.target.value })}
                              placeholder="Teks pilihan jawaban..."
                              style={{ ...inp, flex: 1 }}
                            />
                            <button onClick={() => delChoice(q.id, ci)} style={{
                              background: 'none', border: `1px solid ${CV.border2}`, color: CV.down,
                              borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: 14, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>×</button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 24 }}>
                            <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, flexShrink: 0 }}>→ menuju:</span>
                            <select
                              value={choice.nextId}
                              onChange={e => updChoice(q.id, ci, { nextId: e.target.value })}
                              style={{ ...sel, flex: 1 }}
                            >
                              <option value="">— Belum ditetapkan —</option>
                              {questions.filter(qq => qq.id !== q.id).length > 0 && (
                                <optgroup label="PERTANYAAN LAIN">
                                  {questions.filter(qq => qq.id !== q.id).map(qq => (
                                    <option key={qq.id} value={qq.id}>
                                      ❓ {qq.text.slice(0, 55) || '(tanpa teks)'}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {results.length > 0 && (
                                <optgroup label="HASIL AKHIR">
                                  {results.map(r => {
                                    const icon = r.cls === 'rc-ok' ? '✓' : r.cls === 'rc-warn' ? '!' : '✕';
                                    return (
                                      <option key={r.id} value={r.id}>
                                        {icon} {r.title.slice(0, 55) || '(tanpa judul)'}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addChoice(q.id)} style={addBtn('#60a5fa', 'rgba(96,165,250,0.4)')}>
                      + Tambah Pilihan Jawaban
                    </button>
                  </div>

                  {/* Set as root */}
                  {!isRoot && (
                    <button onClick={() => setRoot(q.id)} style={{
                      fontFamily: CV.mono, fontSize: 9, color: '#60a5fa',
                      background: 'none', border: '1px solid rgba(96,165,250,0.35)',
                      padding: '5px 12px', borderRadius: 5, cursor: 'pointer', alignSelf: 'flex-start' as const,
                    }}>⚑ Jadikan Pertanyaan Awal (ROOT)</button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={addQuestion} style={addBtn('#60a5fa', 'rgba(96,165,250,0.4)')}>
          + Tambah Pertanyaan
        </button>
      </div>

      {/* ── Hasil Akhir ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ fontFamily: CV.mono, fontSize: 10, color: CV.gold, letterSpacing: 1 }}>// HASIL AKHIR</div>
        <p style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, margin: 0, lineHeight: 1.6 }}>
          Kotak keputusan final. Pilihan jawaban dari pertanyaan akan mengarah ke salah satu hasil ini.
        </p>

        {results.map((r) => {
          const isOpen  = !!openNodes[r.id];
          const color   = clsColor(r.cls);
          const bg      = clsBg(r.cls);
          const bord    = clsBorder(r.cls);
          const icon    = r.cls === 'rc-ok' ? '✓' : r.cls === 'rc-warn' ? '!' : '✕';

          return (
            <div key={r.id} style={{ border: `1px solid ${bord}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: bg }}>
                <button onClick={() => tog(r.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, minWidth: 0 }}>
                  <span style={{ fontFamily: CV.mono, fontSize: 13, color, fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontFamily: CV.mono, fontSize: 10, color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {r.title || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>hasil tanpa judul</span>}
                  </span>
                  <span style={{ fontFamily: CV.mono, fontSize: 9, color, opacity: 0.7, flexShrink: 0 }}>{r.steps.length} langkah</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10 }}>
                  <button onClick={() => delResult(r.id)} title="Hapus hasil" style={{
                    background: 'none', border: `1px solid ${bord}`, color: CV.down,
                    borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>×</button>
                  <span style={{ fontFamily: CV.mono, fontSize: 11, color, width: 14, textAlign: 'center' as const }}>{isOpen ? '▾' : '▸'}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: '14px 16px', background: CV.panel, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {/* Cls picker */}
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 7 }}>GAYA HASIL</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {CLS_OPTS.map(opt => (
                        <button key={opt.cls} onClick={() => updResult(r.id, { cls: opt.cls })} style={{
                          fontFamily: CV.mono, fontSize: 9, padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                          border: `1px solid ${r.cls === opt.cls ? opt.color : CV.border2}`,
                          background: r.cls === opt.cls ? `${opt.color}20` : CV.bg,
                          color: r.cls === opt.cls ? opt.color : CV.dim,
                        }}>{opt.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 5 }}>JUDUL KEPUTUSAN</div>
                    <input
                      value={r.title}
                      onChange={e => updResult(r.id, { title: e.target.value })}
                      placeholder="Contoh: Setup ideal — boleh entry BUY"
                      style={{ ...inp, width: '100%' }}
                    />
                  </div>

                  {/* Steps */}
                  <div>
                    <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 8 }}>LANGKAH-LANGKAH</div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                      {r.steps.map((step, si) => (
                        <StepRow key={si} step={step} onChange={s => updStep(r.id, si, s)} onDelete={() => delStep(r.id, si)} />
                      ))}
                    </div>
                    <button onClick={() => addStep(r.id)} style={addBtn(color, bord)}>+ Tambah langkah</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={addResult} style={addBtn(CV.gold, CV.border2)}>+ Tambah Hasil Akhir</button>
      </div>
    </div>
  );
}
