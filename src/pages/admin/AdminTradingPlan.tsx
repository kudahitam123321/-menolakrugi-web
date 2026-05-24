import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import TradingPlanAdminEditor from '../../components/trading-plan/TradingPlanAdminEditor';
import TradingPlanDecisionTree from '../../components/trading-plan/TradingPlanDecisionTree';
import type { TreePlanConfig, TradingPlanConfigRow } from '../../types/tradingPlan';

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

type Configs = Record<string, TreePlanConfig | null>;

const EMPTY_CONFIG: TreePlanConfig = { rootId: '', nodes: {}, keyrules: [] };

function isTreeConfig(c: unknown): c is TreePlanConfig {
  return !!c && typeof (c as Record<string, unknown>).nodes === 'object'
             && typeof (c as Record<string, unknown>).rootId === 'string';
}

export default function AdminTradingPlan() {
  const [saved,       setSaved]       = useState<Configs>({});
  const [edited,      setEdited]      = useState<Configs>({});
  const [planTypes,   setPlanTypes]   = useState<string[]>([]);
  const [activeTab,   setActiveTab]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const newPlanRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (showNewPlan) newPlanRef.current?.focus(); }, [showNewPlan]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('trading_plan_config')
      .select('*')
      .order('updated_at', { ascending: true });
    if (data) {
      const rows = data as TradingPlanConfigRow[];
      const types = rows.map(r => r.plan_type);
      const configs: Configs = {};
      rows.forEach(r => { configs[r.plan_type] = isTreeConfig(r.config) ? r.config : null; });
      setPlanTypes(types);
      setSaved({ ...configs });
      setEdited({ ...configs });
      setActiveTab(prev => types.includes(prev) ? prev : (types[0] || ''));
    }
    setLoading(false);
  }

  function initPlan(type: string) {
    setEdited(prev => ({ ...prev, [type]: { ...EMPTY_CONFIG } }));
  }

  function isDirty() {
    return planTypes.some(t => JSON.stringify(edited[t]) !== JSON.stringify(saved[t]));
  }

  function addNewPlan() {
    const key = newPlanName.trim();
    if (!key) return;
    if (planTypes.includes(key)) { showToast(`Plan "${key}" sudah ada.`, false); return; }
    setPlanTypes(prev => [...prev, key]);
    setEdited(prev => ({ ...prev, [key]: null }));
    setSaved(prev => ({ ...prev, [key]: null }));
    setActiveTab(key);
    setNewPlanName('');
    setShowNewPlan(false);
  }

  async function deletePlan(type: string) {
    if (!confirm(`Hapus Trading Plan "${type}"?\nSemua konfigurasi plan ini akan hilang permanen.`)) return;
    setDeleting(true);
    try {
      await supabase.from('trading_plan_config').delete().eq('plan_type', type);
      const newTypes = planTypes.filter(t => t !== type);
      setPlanTypes(newTypes);
      setSaved(prev => { const n = { ...prev }; delete n[type]; return n; });
      setEdited(prev => { const n = { ...prev }; delete n[type]; return n; });
      setActiveTab(newTypes[0] || '');
      showToast(`✅ Plan "${type}" dihapus.`, true);
    } catch {
      showToast('❌ Gagal menghapus plan.', false);
    }
    setDeleting(false);
  }

  async function save() {
    setSaving(true);
    try {
      for (const t of planTypes) {
        const e = edited[t]; const s = saved[t];
        if (e && JSON.stringify(e) !== JSON.stringify(s)) {
          const { error } = await supabase
            .from('trading_plan_config')
            .upsert({ plan_type: t, config: e, updated_at: new Date().toISOString() }, { onConflict: 'plan_type' });
          if (error) throw new Error(error.message);
        }
      }
      setSaved({ ...edited });
      showToast('✅ Perubahan berhasil disimpan!', true);
    } catch (e) {
      showToast(`❌ Gagal menyimpan: ${e instanceof Error ? e.message : 'Error'}`, false);
    }
    setSaving(false);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const currentConfig = activeTab ? edited[activeTab] : null;

  return (
    <div style={{ padding: 24, fontFamily: CV.sans, color: CV.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>// ADMIN — TRADING PLAN</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>Trading Plan — Builder</h2>
          <p style={{ color: CV.dim, fontSize: 12, margin: '4px 0 0', fontFamily: CV.mono }}>
            Buat beberapa model plan, hubungkan pertanyaan ke hasil akhir.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {toast && (
            <span style={{
              fontFamily: CV.mono, fontSize: 11,
              color: toast.ok ? CV.up : CV.down,
              padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${toast.ok ? CV.up : CV.down}`,
              background: toast.ok ? 'var(--mr-tint-green)' : 'var(--mr-tint-red)',
            }}>{toast.msg}</span>
          )}
          {activeTab && (
            <button
              onClick={() => deletePlan(activeTab)}
              disabled={deleting}
              style={{
                fontFamily: CV.mono, fontSize: 11, fontWeight: 700, padding: '8px 14px',
                borderRadius: 6, border: `1px solid ${CV.down}`,
                cursor: deleting ? 'not-allowed' : 'pointer',
                background: 'var(--mr-tint-red)', color: CV.down, opacity: deleting ? 0.6 : 1,
              }}
            >{deleting ? '⏳' : '🗑 Hapus Plan Ini'}</button>
          )}
          <button
            onClick={save}
            disabled={!isDirty() || saving}
            style={{
              fontFamily: CV.mono, fontSize: 11, fontWeight: 700, padding: '8px 18px',
              borderRadius: 6, border: 'none',
              cursor: isDirty() && !saving ? 'pointer' : 'not-allowed',
              background: isDirty() && !saving ? CV.gold : CV.border,
              color: isDirty() && !saving ? '#000' : CV.dim,
              opacity: saving ? 0.7 : 1,
            }}
          >{saving ? '⏳ MENYIMPAN...' : '💾 SIMPAN'}</button>
        </div>
      </div>

      {/* Plan tabs + Add new */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        {planTypes.map(t => {
          const e = edited[t]; const s = saved[t];
          const dirty = e && s && JSON.stringify(e) !== JSON.stringify(s);
          return (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '6px 18px',
              borderRadius: 20, cursor: 'pointer',
              background: activeTab === t ? CV.gold : 'none',
              border: `1px solid ${activeTab === t ? CV.gold : CV.border}`,
              color: activeTab === t ? '#000' : CV.dim,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t}
              {dirty && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeTab === t ? '#000' : CV.gold, display: 'inline-block' }} />
              )}
            </button>
          );
        })}

        {/* Inline add new plan */}
        {showNewPlan ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              ref={newPlanRef}
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addNewPlan();
                if (e.key === 'Escape') { setShowNewPlan(false); setNewPlanName(''); }
              }}
              placeholder="Nama plan baru..."
              style={{
                fontFamily: CV.mono, fontSize: 11, padding: '5px 10px',
                background: CV.bg, border: `1px solid ${CV.gold}`,
                borderRadius: 6, color: CV.text, outline: 'none', width: 160,
              }}
            />
            <button onClick={addNewPlan} style={{
              fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '5px 12px',
              borderRadius: 6, border: 'none', background: CV.gold, color: '#000', cursor: 'pointer',
            }}>+ Tambah</button>
            <button onClick={() => { setShowNewPlan(false); setNewPlanName(''); }} style={{
              fontFamily: CV.mono, fontSize: 10, padding: '5px 10px',
              borderRadius: 6, border: `1px solid ${CV.border}`, background: 'none', color: CV.dim, cursor: 'pointer',
            }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNewPlan(true)} style={{
            fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '6px 14px',
            borderRadius: 20, cursor: 'pointer', border: `1px dashed ${CV.border2}`,
            background: 'none', color: CV.dim,
          }}>+ Tambah Plan</button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center' as const, padding: 60, fontFamily: CV.mono, color: CV.dim }}>⏳ Memuat...</div>
      )}

      {!loading && planTypes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16, padding: '60px 0' }}>
          <div style={{ fontFamily: CV.mono, fontSize: 13, color: CV.dim, textAlign: 'center' as const, lineHeight: 1.7 }}>
            Belum ada Trading Plan.<br />Klik <strong style={{ color: CV.gold }}>+ Tambah Plan</strong> di atas untuk mulai.
          </div>
        </div>
      )}

      {!loading && activeTab && !currentConfig && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16, padding: '48px 0' }}>
          <div style={{ fontFamily: CV.mono, fontSize: 13, color: CV.dim, textAlign: 'center' as const, lineHeight: 1.7 }}>
            Trading Plan <strong style={{ color: CV.text }}>"{activeTab}"</strong> belum dibuat.<br />
            Klik tombol di bawah untuk mulai membangun decision tree.
          </div>
          <button
            onClick={() => initPlan(activeTab)}
            style={{
              fontFamily: CV.mono, fontSize: 11, fontWeight: 700, padding: '10px 24px',
              borderRadius: 8, cursor: 'pointer', border: 'none',
              background: CV.gold, color: '#000',
            }}
          >+ Buat Decision Tree untuk "{activeTab}"</button>
        </div>
      )}

      {!loading && activeTab && currentConfig && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 32 }}>
          <TradingPlanAdminEditor
            planType={activeTab}
            config={currentConfig}
            onChange={newCfg => setEdited(prev => ({ ...prev, [activeTab]: newCfg }))}
          />
          <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 9, letterSpacing: 1.5, marginBottom: 16 }}>
              // PREVIEW LANGSUNG — {activeTab.toUpperCase()}
            </div>
            <TradingPlanDecisionTree planType={activeTab} config={currentConfig} />
          </div>
        </div>
      )}
    </div>
  );
}
