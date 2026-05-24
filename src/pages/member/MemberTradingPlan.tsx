import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import TradingPlanDecisionTree from '../../components/trading-plan/TradingPlanDecisionTree';
import type { TreePlanConfig, TradingPlanConfigRow } from '../../types/tradingPlan';

const CV = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  text: 'var(--mr-text)', dim: 'var(--mr-dim)', down: 'var(--mr-down)', gold: 'var(--mr-gold)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

function canSeeAll(tier: string): boolean {
  const t = tier.toLowerCase();
  return t.includes('platinum') || t.includes('gold');
}

function isTreeConfig(c: unknown): c is TreePlanConfig {
  return !!c && typeof (c as Record<string, unknown>).nodes === 'object'
             && typeof (c as Record<string, unknown>).rootId === 'string';
}

interface Plan { type: string; config: TreePlanConfig }

export default function MemberTradingPlan() {
  const [memberTier, setMemberTier] = useState('');
  const [memberNama, setMemberNama] = useState('');
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (!raw) { setError('Sesi tidak valid, silakan login ulang.'); setLoading(false); return; }
    try {
      const m = JSON.parse(raw) as { nama: string; tier: string };
      setMemberTier(m.tier);
      setMemberNama(m.nama);
      fetchConfigs(m.tier);
    } catch {
      setError('Sesi tidak valid, silakan login ulang.');
      setLoading(false);
    }
  }, []);

  async function fetchConfigs(tier: string) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('trading_plan_config')
        .select('*')
        .order('updated_at', { ascending: true });

      if (err || !data) {
        setError('Trading Plan belum tersedia. Silakan hubungi admin.');
      } else {
        const rows = data as TradingPlanConfigRow[];
        const valid = rows.filter(r => isTreeConfig(r.config)).map(r => ({
          type: r.plan_type,
          config: r.config as TreePlanConfig,
        }));

        // Access control: gold/platinum see all plans;
        // others only see plans whose name contains "basic", or the first plan as fallback
        let accessible: Plan[];
        if (canSeeAll(tier)) {
          accessible = valid;
        } else {
          const basicOnes = valid.filter(p => p.type.toLowerCase().includes('basic'));
          accessible = basicOnes.length > 0 ? basicOnes : valid.slice(0, 1);
        }

        if (accessible.length === 0) {
          setError('Trading Plan belum tersedia. Silakan hubungi admin.');
        } else {
          setPlans(accessible);
          setActivePlan(accessible[0].type);
        }
      }
    } catch {
      setError('Gagal memuat Trading Plan, coba refresh.');
    }
    setLoading(false);
  }

  const activeConfig = plans.find(p => p.type === activePlan)?.config ?? null;

  return (
    <div style={{ padding: 24, fontFamily: CV.sans, color: CV.text, maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: CV.mono, color: CV.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// TRADING PLAN</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Trading Plan</h2>
        <p style={{ color: CV.dim, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
          Ikuti decision tree di bawah untuk menentukan keputusan trading berdasarkan kondisi pasar.
        </p>
      </div>

      {/* Tab switcher — only shown when there are multiple accessible plans */}
      {!loading && !error && plans.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' as const }}>
          {plans.map(p => (
            <button key={p.type} onClick={() => setActivePlan(p.type)} style={{
              fontFamily: CV.mono, fontSize: 10, fontWeight: 700, padding: '6px 18px',
              borderRadius: 20, cursor: 'pointer',
              background: activePlan === p.type ? CV.gold : 'none',
              border: `1px solid ${activePlan === p.type ? CV.gold : CV.border}`,
              color: activePlan === p.type ? '#000' : CV.dim,
            }}>{p.type}</button>
          ))}
        </div>
      )}

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

      {!loading && !error && activeConfig && (
        <TradingPlanDecisionTree planType={activePlan} config={activeConfig} memberName={memberNama} />
      )}
    </div>
  );
}
