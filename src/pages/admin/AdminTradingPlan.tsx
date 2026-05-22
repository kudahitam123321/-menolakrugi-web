import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import TradingPlanAdminEditor from '../../components/trading-plan/TradingPlanAdminEditor';
import TradingPlanDecisionTree from '../../components/trading-plan/TradingPlanDecisionTree';
import type { PlanConfig, PlanType, TradingPlanConfigRow } from '../../types/tradingPlan';

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', text: 'var(--mr-text)', dim: 'var(--mr-dim)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

type Configs = { basic: PlanConfig | null; advanced: PlanConfig | null };

export default function AdminTradingPlan() {
  const [saved, setSaved]       = useState<Configs>({ basic: null, advanced: null });
  const [edited, setEdited]     = useState<Configs>({ basic: null, advanced: null });
  const [activeTab, setActiveTab] = useState<PlanType>('basic');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('trading_plan_config').select('*');
    if (data) {
      const rows = data as TradingPlanConfigRow[];
      const basic    = rows.find(r => r.plan_type === 'basic')?.config ?? null;
      const advanced = rows.find(r => r.plan_type === 'advanced')?.config ?? null;
      setSaved({ basic, advanced });
      setEdited({ basic, advanced });
    }
    setLoading(false);
  }

  function isDirty(): boolean {
    return JSON.stringify(edited.basic)    !== JSON.stringify(saved.basic) ||
           JSON.stringify(edited.advanced) !== JSON.stringify(saved.advanced);
  }

  async function save() {
    setSaving(true);
    try {
      const toUpsert: Array<{ plan_type: PlanType; config: PlanConfig; updated_at: string }> = [];
      if (edited.basic    && JSON.stringify(edited.basic)    !== JSON.stringify(saved.basic))
        toUpsert.push({ plan_type: 'basic',    config: edited.basic,    updated_at: new Date().toISOString() });
      if (edited.advanced && JSON.stringify(edited.advanced) !== JSON.stringify(saved.advanced))
        toUpsert.push({ plan_type: 'advanced', config: edited.advanced, updated_at: new Date().toISOString() });

      for (const row of toUpsert) {
        const { error } = await supabase.from('trading_plan_config').upsert(row, { onConflict: 'plan_type' });
        if (error) throw new Error(error.message);
      }
      setSaved({ ...edited });
      showToast('✅ Perubahan berhasil disimpan!', true);
    } catch (e) {
      showToast(`❌ Gagal menyimpan: ${e instanceof Error ? e.message : 'Error tidak diketahui'}`, false);
    }
    setSaving(false);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const currentConfig = edited[activeTab];

  return (
    <div style={{ padding: 24, fontFamily: CV.sans, color: CV.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>// ADMIN — CONTENT</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>Trading Plan — Kelola Teks</h2>
          <p style={{ color: CV.dim, fontSize: 12, margin: '4px 0 0', fontFamily: CV.mono }}>Edit teks rule dan scenario. Perubahan langsung terlihat di preview.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {toast && (
            <span style={{ fontFamily: CV.mono, fontSize: 11, color: toast.ok ? CV.up : CV.down, padding: '5px 12px', borderRadius: 6, border: `1px solid ${toast.ok ? CV.up : CV.down}`, background: toast.ok ? 'var(--mr-tint-green)' : 'var(--mr-tint-red)' }}>
              {toast.msg}
            </span>
          )}
          <button
            onClick={save}
            disabled={!isDirty() || saving}
            style={{
              fontFamily: CV.mono, fontSize: 11, fontWeight: 700, padding: '8px 18px', borderRadius: 6, border: 'none',
              cursor: isDirty() && !saving ? 'pointer' : 'not-allowed',
              background: isDirty() && !saving ? CV.gold : CV.border,
              color: isDirty() && !saving ? '#000' : CV.dim,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '⏳ MENYIMPAN...' : '💾 SIMPAN PERUBAHAN'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['basic', 'advanced'] as PlanType[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '6px 18px', borderRadius: 20, cursor: 'pointer',
            background: activeTab === t ? CV.gold : 'none',
            border: `1px solid ${activeTab === t ? CV.gold : CV.border}`,
            color: activeTab === t ? '#000' : CV.dim,
          }}>
            {t === 'basic' ? 'Basic Plan' : 'Advanced Plan'}
            {(() => {
              const editedC = edited[t];
              const savedC  = saved[t];
              if (!editedC || !savedC) return null;
              if (JSON.stringify(editedC) !== JSON.stringify(savedC)) {
                return <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: '50%', background: CV.gold, display: 'inline-block', verticalAlign: 'middle' }}/>;
              }
              return null;
            })()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' as const, padding: 60, fontFamily: CV.mono, color: CV.dim }}>⏳ Memuat...</div>
      ) : !currentConfig ? (
        <div style={{ padding: 28, background: 'var(--mr-tint-red)', border: '1px solid var(--mr-down-a20)', borderRadius: 12, fontFamily: CV.mono, color: CV.down, fontSize: 12, lineHeight: 1.7 }}>
          ❌ Config tidak ditemukan. Pastikan SQL sudah dijalankan di Supabase SQL Editor.<br/>
          Jika sudah, periksa RLS policy — ganti <code>auth.role() = 'authenticated'</code> dengan <code>true</code> pada policy SELECT agar akses anon diizinkan.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28 }}>
          {/* Editor */}
          <TradingPlanAdminEditor
            planType={activeTab}
            config={currentConfig}
            onChange={newCfg => setEdited(prev => ({ ...prev, [activeTab]: newCfg }))}
          />

          {/* Preview */}
          <div style={{ background: CV.panel, border: `1px solid ${CV.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 9, letterSpacing: 1.5, marginBottom: 16 }}>// PREVIEW LANGSUNG — {activeTab.toUpperCase()} PLAN</div>
            <TradingPlanDecisionTree planType={activeTab} config={currentConfig} />
          </div>
        </div>
      )}
    </div>
  );
}
