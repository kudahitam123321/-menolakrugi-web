import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import TradingPlanDecisionTree from '../../components/trading-plan/TradingPlanDecisionTree';
import type { PlanConfig, PlanType, TradingPlanConfigRow } from '../../types/tradingPlan';

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  text: 'var(--mr-text)', dim: 'var(--mr-dim)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

function tierToPlanType(tier: string): PlanType {
  const t = tier.toLowerCase();
  if (t.includes('platinum') || t.includes('gold')) return 'advanced';
  return 'basic';
}

function canSeeAdvanced(tier: string): boolean {
  const t = tier.toLowerCase();
  return t.includes('platinum') || t.includes('gold');
}

export default function MemberTradingPlan() {
  const [memberTier, setMemberTier] = useState('');
  const [memberNama, setMemberNama] = useState('');
  const [planType, setPlanType] = useState<PlanType>('basic');
  const [config, setConfig]     = useState<PlanConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (!raw) { setError('Sesi tidak valid, silakan login ulang.'); setLoading(false); return; }
    try {
      const m = JSON.parse(raw) as { nama: string; tier: string };
      setMemberTier(m.tier);
      setMemberNama(m.nama);
      const pt = tierToPlanType(m.tier);
      setPlanType(pt);
      fetchConfig(pt);
    } catch {
      setError('Sesi tidak valid, silakan login ulang.');
      setLoading(false);
    }
  }, []);

  async function fetchConfig(type: PlanType) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('trading_plan_config')
        .select('*')
        .eq('plan_type', type)
        .single();
      if (err || !data) {
        setError('Gagal memuat Trading Plan, coba refresh. (Pastikan tabel sudah dibuat di Supabase)');
      } else {
        setConfig((data as TradingPlanConfigRow).config);
      }
    } catch {
      setError('Gagal memuat Trading Plan, coba refresh.');
    }
    setLoading(false);
  }

  function switchPlan(type: PlanType) {
    setPlanType(type);
    setConfig(null);
    fetchConfig(type);
  }

  return (
    <div style={{ padding: 24, fontFamily: CV.sans, color: CV.text, maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// TRADING PLAN</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Trading Plan</h2>
        <p style={{ color: CV.dim, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
          Ikuti decision tree di bawah untuk menentukan keputusan trading yang tepat berdasarkan kondisi pasar.
        </p>
      </div>

      {/* Tab switcher for Gold/Platinum */}
      {memberTier && canSeeAdvanced(memberTier) && !loading && !error && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {(['basic', 'advanced'] as PlanType[]).map(t => (
            <button key={t} onClick={() => switchPlan(t)} style={{
              fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '6px 18px',
              borderRadius: 20, cursor: 'pointer',
              background: planType === t ? CV.gold : 'none',
              border: `1px solid ${planType === t ? CV.gold : CV.border}`,
              color: planType === t ? '#000' : CV.dim,
            }}>
              {t === 'basic' ? 'Basic Plan' : 'Advanced Plan'}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center' as const, fontFamily: CV.mono, color: CV.dim }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
          Memuat Trading Plan...
        </div>
      )}
      {!loading && error && (
        <div style={{ padding: 20, background: 'var(--mr-tint-red)', border: '1px solid var(--mr-down-a20)', borderRadius: 10, fontFamily: CV.mono, color: CV.down, fontSize: 12, lineHeight: 1.6 }}>
          {error}
        </div>
      )}
      {!loading && !error && config && (
        <TradingPlanDecisionTree planType={planType} config={config} memberName={memberNama} />
      )}
    </div>
  );
}
