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
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
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

function uid(p: string) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
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
function clsIcon(cls: TreeResult['cls']) {
  return cls === 'rc-ok' ? '✓' : cls === 'rc-warn' ? '!' : '✕';
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

// ── Step row ──────────────────────────────────────────────────────────────────
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
        style={{ flex: 1, background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text, borderRadius: 5, padding: '6px 10px', fontFamily: CV.mono, fontSize: 11, outline: 'none' }}
      />
      <button onClick={onDelete} style={{ background: 'none', border: `1px solid ${CV.border}`, color: CV.down, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
  );
}

// ── Visual tree node (recursive) ──────────────────────────────────────────────
interface VNProps {
  nodeId: string;
  nodes: Record<string, TreeNode>;
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  visited: Set<string>;
}

function VisualNode({ nodeId, nodes, rootId, selectedId, onSelect, visited }: VNProps) {
  if (visited.has(nodeId)) {
    return (
      <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.down, padding: '3px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 4, border: '1px solid var(--mr-down-a20)', display: 'inline-block' }}>
        ⚠ siklus
      </div>
    );
  }

  const node = nodes[nodeId];
  if (!node) return null;

  const newVisited = new Set([...visited, nodeId]);
  const isSel = selectedId === nodeId;
  const isRoot = rootId === nodeId;

  // ── Result leaf ─────────────────────────────────────────────────────────────
  if (node.type === 'result') {
    return (
      <div
        onClick={() => onSelect(nodeId)}
        title="Klik untuk edit"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
          background: clsBg(node.cls),
          border: `2px solid ${isSel ? CV.gold : clsBorder(node.cls)}`,
          boxShadow: isSel ? `0 0 0 3px ${CV.gold}25` : 'none',
          maxWidth: 220,
        }}
      >
        <span style={{ fontFamily: CV.mono, fontSize: 11, fontWeight: 700, color: clsColor(node.cls), flexShrink: 0 }}>{clsIcon(node.cls)}</span>
        <span style={{ fontFamily: CV.mono, fontSize: 9, color: clsColor(node.cls), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {node.title || <em style={{ opacity: 0.6 }}>tanpa judul</em>}
        </span>
      </div>
    );
  }

  // ── Question node ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
      <div
        onClick={() => onSelect(nodeId)}
        title="Klik untuk edit"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
          background: 'rgba(59,130,246,0.08)',
          border: `2px solid ${isSel ? CV.gold : isRoot ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.22)'}`,
          boxShadow: isSel ? `0 0 0 3px ${CV.gold}25` : 'none',
          maxWidth: 240,
        }}
      >
        {isRoot && (
          <span style={{ fontFamily: CV.mono, fontSize: 7, background: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>ROOT</span>
        )}
        <span style={{ fontSize: 10, flexShrink: 0 }}>❓</span>
        <span style={{ fontFamily: CV.mono, fontSize: 9, color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {node.text || <em style={{ opacity: 0.6, color: CV.dim }}>tanpa teks</em>}
        </span>
        <span style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, flexShrink: 0 }}>({node.choices.length})</span>
      </div>

      {/* Choices + children */}
      <div style={{ paddingLeft: 8 }}>
        {node.choices.length === 0 && (
          <div style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, fontStyle: 'italic', paddingLeft: 8, marginTop: 3 }}>
            (tidak ada pilihan)
          </div>
        )}
        {node.choices.map((choice, i) => {
          const last = i === node.choices.length - 1;
          const hasChild = !!choice.nextId && !!nodes[choice.nextId];
          return (
            <div key={choice.id} style={{ display: 'flex', alignItems: 'flex-start', marginTop: 4 }}>
              {/* Branch connector */}
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: CV.dim, flexShrink: 0, lineHeight: 1, paddingTop: 7, minWidth: 14 }}>
                {last ? '└' : '├'}
              </span>
              {/* Choice label + arrow + child */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 4, flexWrap: 'nowrap' as const }}>
                <span style={{
                  fontFamily: CV.mono, fontSize: 8, background: CV.panel,
                  border: `1px solid ${CV.border}`, borderRadius: 3,
                  padding: '3px 7px', flexShrink: 0, color: CV.text,
                  maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  marginTop: 3,
                }}>
                  {choice.label || <em style={{ color: CV.dim }}>…</em>}
                </span>
                <span style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, paddingTop: 5, flexShrink: 0 }}>›</span>
                <div style={{ marginTop: 2 }}>
                  {hasChild ? (
                    <VisualNode nodeId={choice.nextId} nodes={nodes} rootId={rootId} selectedId={selectedId} onSelect={onSelect} visited={newVisited} />
                  ) : (
                    <span style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, fontStyle: 'italic', display: 'inline-block', paddingTop: 7 }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function TradingPlanAdminEditor({ config, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(config.rootId || null);
  const { nodes, rootId, keyrules } = config;

  const questions = Object.values(nodes).filter((n): n is TreeQuestion => n.type === 'question');
  const results   = Object.values(nodes).filter((n): n is TreeResult   => n.type === 'result');

  // Find nodes reachable from root (to detect orphans)
  function collectReachable(id: string, vis: Set<string> = new Set()): Set<string> {
    if (!id || vis.has(id) || !nodes[id]) return vis;
    vis.add(id);
    const n = nodes[id];
    if (n.type === 'question') n.choices.forEach(c => { if (c.nextId) collectReachable(c.nextId, vis); });
    return vis;
  }
  const reachable = rootId ? collectReachable(rootId) : new Set<string>();
  const orphans   = Object.keys(nodes).filter(id => !reachable.has(id));

  // ── Config helpers ──────────────────────────────────────────────────────────
  function upd(patch: Partial<TreePlanConfig>) { onChange({ ...config, ...patch }); }
  function updNodes(n: Record<string, TreeNode>) { upd({ nodes: n }); }

  function addQuestion(wiredToChoice?: { qId: string; ci: number }) {
    const id = uid('q');
    const node: TreeQuestion = { id, type: 'question', text: '', choices: [] };
    let newNodes: Record<string, TreeNode> = { ...nodes, [id]: node };
    if (wiredToChoice) {
      const q = newNodes[wiredToChoice.qId] as TreeQuestion;
      newNodes[wiredToChoice.qId] = { ...q, choices: q.choices.map((c, i) => i === wiredToChoice.ci ? { ...c, nextId: id } : c) };
    }
    onChange({ ...config, nodes: newNodes, rootId: rootId || id });
    setSelectedId(id);
  }

  function addResult(wiredToChoice?: { qId: string; ci: number }) {
    const id = uid('r');
    const node: TreeResult = { id, type: 'result', cls: 'rc-ok', title: '', steps: [] };
    let newNodes: Record<string, TreeNode> = { ...nodes, [id]: node };
    if (wiredToChoice) {
      const q = newNodes[wiredToChoice.qId] as TreeQuestion;
      newNodes[wiredToChoice.qId] = { ...q, choices: q.choices.map((c, i) => i === wiredToChoice.ci ? { ...c, nextId: id } : c) };
    }
    updNodes(newNodes);
    setSelectedId(id);
  }

  function delNode(id: string) {
    const { [id]: _, ...rest } = nodes;
    const cleaned: Record<string, TreeNode> = {};
    for (const [k, n] of Object.entries(rest)) {
      cleaned[k] = n.type === 'question'
        ? { ...n, choices: n.choices.map(c => c.nextId === id ? { ...c, nextId: '' } : c) }
        : n;
    }
    onChange({ ...config, nodes: cleaned, rootId: rootId === id ? '' : rootId });
    if (selectedId === id) setSelectedId(null);
  }

  function updQuestion(id: string, patch: Partial<Omit<TreeQuestion, 'id' | 'type'>>) {
    const q = nodes[id] as TreeQuestion;
    updNodes({ ...nodes, [id]: { ...q, ...patch } });
  }

  function addChoice(qId: string) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: [...q.choices, { id: uid('c'), label: '', nextId: '' }] } });
  }

  function updChoice(qId: string, ci: number, patch: Partial<TreeChoice>) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: q.choices.map((c, i) => i === ci ? { ...c, ...patch } : c) } });
  }

  function delChoice(qId: string, ci: number) {
    const q = nodes[qId] as TreeQuestion;
    updNodes({ ...nodes, [qId]: { ...q, choices: q.choices.filter((_, i) => i !== ci) } });
  }

  function updResult(id: string, patch: Partial<Omit<TreeResult, 'id' | 'type'>>) {
    const r = nodes[id] as TreeResult;
    updNodes({ ...nodes, [id]: { ...r, ...patch } });
  }

  const selectedNode = selectedId ? nodes[selectedId] : null;

  const inp: React.CSSProperties = {
    background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '7px 10px', fontFamily: CV.mono, fontSize: 11,
    outline: 'none', boxSizing: 'border-box' as const, width: '100%',
  };
  const sel: React.CSSProperties = {
    background: CV.bg, border: `1px solid ${CV.border2}`, color: CV.text,
    borderRadius: 5, padding: '6px 8px', fontFamily: CV.mono, fontSize: 11,
    outline: 'none', cursor: 'pointer', width: '100%',
  };
  const dashBtn = (color: string, border: string): React.CSSProperties => ({
    width: '100%', fontFamily: CV.mono, fontSize: 9, padding: '7px 0',
    borderRadius: 6, cursor: 'pointer', background: 'none',
    border: `1px dashed ${border}`, color,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

      {/* ── Two-panel: Tree | Editor ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' as const }}>

        {/* LEFT — Visual tree panel */}
        <div style={{ flex: '0 0 calc(50% - 8px)', minWidth: 280, background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: CV.mono, fontSize: 9, color: CV.gold, letterSpacing: 1.5 }}>// POHON KEPUTUSAN</span>
            <span style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim }}>klik node untuk edit →</span>
          </div>

          {/* Tree canvas */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520, paddingBottom: 4 }}>
            {rootId && nodes[rootId] ? (
              <VisualNode
                nodeId={rootId}
                nodes={nodes}
                rootId={rootId}
                selectedId={selectedId}
                onSelect={setSelectedId}
                visited={new Set()}
              />
            ) : (
              <div style={{ fontFamily: CV.mono, fontSize: 11, color: CV.dim, textAlign: 'center' as const, padding: '32px 0', lineHeight: 1.8 }}>
                Belum ada node.<br />Klik tombol di bawah untuk mulai.
              </div>
            )}
          </div>

          {/* Orphan nodes */}
          {orphans.length > 0 && (
            <div>
              <div style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, letterSpacing: 1, marginBottom: 6 }}>// TIDAK TERHUBUNG</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                {orphans.map(id => {
                  const n = nodes[id];
                  const isSel = selectedId === id;
                  const isQ = n.type === 'question';
                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedId(id)}
                      title="Klik untuk edit"
                      style={{
                        fontFamily: CV.mono, fontSize: 8, padding: '3px 9px', borderRadius: 5, cursor: 'pointer',
                        background: isQ ? 'rgba(59,130,246,0.08)' : clsBg((n as TreeResult).cls),
                        border: `1px solid ${isSel ? CV.gold : (isQ ? 'rgba(59,130,246,0.3)' : clsBorder((n as TreeResult).cls))}`,
                        color: isQ ? '#93c5fd' : clsColor((n as TreeResult).cls),
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 160,
                      }}
                    >
                      {isQ ? '❓' : clsIcon((n as TreeResult).cls)}{' '}
                      {isQ ? ((n as TreeQuestion).text || 'tanpa teks').slice(0, 25) : ((n as TreeResult).title || 'tanpa judul').slice(0, 25)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => addQuestion()} style={{ flex: 1, fontFamily: CV.mono, fontSize: 9, padding: '7px 0', borderRadius: 6, cursor: 'pointer', background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(96,165,250,0.4)', color: '#60a5fa' }}>
              + Pertanyaan
            </button>
            <button onClick={() => addResult()} style={{ flex: 1, fontFamily: CV.mono, fontSize: 9, padding: '7px 0', borderRadius: 6, cursor: 'pointer', background: 'rgba(22,163,74,0.06)', border: `1px dashed ${CV.up}44`, color: CV.up }}>
              + Hasil Akhir
            </button>
          </div>
        </div>

        {/* RIGHT — Node editor */}
        <div style={{ flex: 1, minWidth: 280 }}>

          {/* Nothing selected */}
          {!selectedNode && (
            <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 12, padding: 32, textAlign: 'center' as const, fontFamily: CV.mono, fontSize: 11, color: CV.dim, lineHeight: 2 }}>
              ← Klik node pada pohon<br />untuk mulai mengedit
            </div>
          )}

          {/* Question editor */}
          {selectedNode && selectedNode.type === 'question' && (() => {
            const q = selectedNode as TreeQuestion;
            return (
              <div style={{ background: CV.panel, border: `2px solid rgba(59,130,246,0.35)`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {rootId === selectedId && (
                      <span style={{ fontFamily: CV.mono, fontSize: 7, background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>ROOT</span>
                    )}
                    <span style={{ fontFamily: CV.mono, fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>❓ Pertanyaan</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {rootId !== selectedId && (
                      <button onClick={() => upd({ rootId: selectedId! })} style={{ fontFamily: CV.mono, fontSize: 8, color: '#60a5fa', background: 'none', border: '1px solid rgba(96,165,250,0.35)', padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>
                        ⚑ Set ROOT
                      </button>
                    )}
                    <button onClick={() => delNode(selectedId!)} style={{ fontFamily: CV.mono, fontSize: 8, color: CV.down, background: 'none', border: `1px solid ${CV.down}40`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>
                      🗑 Hapus
                    </button>
                  </div>
                </div>

                {/* Question text */}
                <div>
                  <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 5 }}>TEKS PERTANYAAN</div>
                  <input
                    value={q.text}
                    onChange={e => updQuestion(selectedId!, { text: e.target.value })}
                    placeholder="Contoh: Bagaimana kondisi MTF saat ini?"
                    style={inp}
                  />
                </div>

                {/* Choices */}
                <div>
                  <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 8 }}>PILIHAN JAWABAN</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {q.choices.map((choice, ci) => (
                      <div key={choice.id} style={{ background: CV.bg, border: `1px solid ${CV.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {/* Label */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontFamily: CV.mono, fontSize: 10, color: CV.dim, flexShrink: 0 }}>{ci + 1}.</span>
                          <input
                            value={choice.label}
                            onChange={e => updChoice(selectedId!, ci, { label: e.target.value })}
                            placeholder="Teks pilihan..."
                            style={{ ...inp, flex: 1, width: 'auto' }}
                          />
                          <button onClick={() => delChoice(selectedId!, ci)} style={{ background: 'none', border: `1px solid ${CV.border2}`, color: CV.down, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                        </div>

                        {/* Destination */}
                        <div>
                          <div style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, marginBottom: 4 }}>→ MENUJU:</div>
                          <select value={choice.nextId} onChange={e => updChoice(selectedId!, ci, { nextId: e.target.value })} style={sel}>
                            <option value="">— Belum ditetapkan —</option>
                            {questions.filter(qq => qq.id !== selectedId).length > 0 && (
                              <optgroup label="PERTANYAAN">
                                {questions.filter(qq => qq.id !== selectedId).map(qq => (
                                  <option key={qq.id} value={qq.id}>❓ {qq.text.slice(0, 52) || '(tanpa teks)'}</option>
                                ))}
                              </optgroup>
                            )}
                            {results.length > 0 && (
                              <optgroup label="HASIL AKHIR">
                                {results.map(r => (
                                  <option key={r.id} value={r.id}>{clsIcon(r.cls)} {r.title.slice(0, 52) || '(tanpa judul)'}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        {/* Quick-create shortcuts (only when unconnected) */}
                        {!choice.nextId && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => addQuestion({ qId: selectedId!, ci })} style={{ flex: 1, fontFamily: CV.mono, fontSize: 8, padding: '4px 0', borderRadius: 4, cursor: 'pointer', background: 'rgba(59,130,246,0.07)', border: '1px dashed rgba(96,165,250,0.35)', color: '#60a5fa' }}>
                              + Buat Pertanyaan Baru
                            </button>
                            <button onClick={() => addResult({ qId: selectedId!, ci })} style={{ flex: 1, fontFamily: CV.mono, fontSize: 8, padding: '4px 0', borderRadius: 4, cursor: 'pointer', background: 'rgba(22,163,74,0.06)', border: `1px dashed ${CV.up}40`, color: CV.up }}>
                              + Buat Hasil Akhir Baru
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addChoice(selectedId!)} style={{ ...dashBtn('#60a5fa', 'rgba(96,165,250,0.35)'), marginTop: 6 }}>
                    + Tambah Pilihan Jawaban
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Result editor */}
          {selectedNode && selectedNode.type === 'result' && (() => {
            const r = selectedNode as TreeResult;
            const color = clsColor(r.cls);
            const bord  = clsBorder(r.cls);
            return (
              <div style={{ background: clsBg(r.cls), border: `2px solid ${bord}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: CV.mono, fontSize: 10, color, fontWeight: 700 }}>
                    {clsIcon(r.cls)} Hasil Akhir
                  </span>
                  <button onClick={() => delNode(selectedId!)} style={{ fontFamily: CV.mono, fontSize: 8, color: CV.down, background: 'none', border: `1px solid ${CV.down}40`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>
                    🗑 Hapus
                  </button>
                </div>

                {/* Style picker */}
                <div>
                  <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 6 }}>GAYA HASIL</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {CLS_OPTS.map(opt => (
                      <button key={opt.cls} onClick={() => updResult(selectedId!, { cls: opt.cls })} style={{
                        flex: 1, fontFamily: CV.mono, fontSize: 9, padding: '5px 0', borderRadius: 5, cursor: 'pointer',
                        border: `1px solid ${r.cls === opt.cls ? opt.color : CV.border2}`,
                        background: r.cls === opt.cls ? `${opt.color}20` : CV.panel,
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
                    onChange={e => updResult(selectedId!, { title: e.target.value })}
                    placeholder="Contoh: Setup ideal — boleh entry BUY"
                    style={{ ...inp, background: CV.panel }}
                  />
                </div>

                {/* Steps */}
                <div>
                  <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.dim, marginBottom: 8 }}>LANGKAH-LANGKAH</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                    {r.steps.map((step, si) => (
                      <StepRow
                        key={si}
                        step={step}
                        onChange={s => updResult(selectedId!, { steps: r.steps.map((st, i) => i === si ? s : st) })}
                        onDelete={() => updResult(selectedId!, { steps: r.steps.filter((_, i) => i !== si) })}
                      />
                    ))}
                  </div>
                  <button onClick={() => updResult(selectedId!, { steps: [...r.steps, { level: 'ok' as PlanLevel, text: '' }] })} style={{ ...dashBtn(color, bord), marginTop: 6 }}>
                    + Tambah langkah
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Kunci Utama ─────────────────────────────────────────────────────── */}
      <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontFamily: CV.mono, fontSize: 9, color: CV.gold, letterSpacing: 1, marginBottom: 4 }}>// KUNCI UTAMA</div>
        <p style={{ fontFamily: CV.mono, fontSize: 8, color: CV.dim, margin: '0 0 10px', lineHeight: 1.6 }}>
          Aturan ini selalu ditampilkan di bawah setiap hasil akhir saat member menggunakan trading plan.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {keyrules.map((rule, i) => (
            <StepRow
              key={i}
              step={rule}
              onChange={s => upd({ keyrules: keyrules.map((r, idx) => idx === i ? s : r) })}
              onDelete={() => upd({ keyrules: keyrules.filter((_, idx) => idx !== i) })}
            />
          ))}
        </div>
        <button onClick={() => upd({ keyrules: [...keyrules, { level: 'ok' as PlanLevel, text: '' }] })} style={{ ...dashBtn(CV.gold, CV.border2), marginTop: 8 }}>
          + Tambah kunci
        </button>
      </div>

    </div>
  );
}
