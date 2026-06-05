// pages/admin/AdminCompetitionPage.tsx — Panel Admin Kompetisi
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LeaderboardTable, { LeaderboardEntry } from '../../components/competition/LeaderboardTable';
import CompetitionCountdown from '../../components/competition/CompetitionCountdown';

const G = { gold: 'var(--mr-gold)', gold2: 'var(--mr-gold2)' };
const C = {
  bg: 'var(--mr-bg)', sidebar: 'var(--mr-sidebar)', panel: 'var(--mr-panel)',
  border: 'var(--mr-border)', border2: 'var(--mr-border2)',
  dim: 'var(--mr-dim)', dimmer: 'var(--mr-dimmer)', muted: 'var(--mr-muted)',
  text: 'var(--mr-text)', up: 'var(--mr-up)', down: 'var(--mr-down)',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

const DEFAULT_EQUITY = 10000;

interface Competition {
  id?: string;
  title: string;
  platform_tag: string;
  status: string;
  starts_at: string;
  ends_at: string;
  entry_type: string;
  prize_pool: string;
  more_info: string;
  trading_rules: string[];
  organizer: string;
  is_active: boolean;
}

const EMPTY_COMP: Competition = {
  title: '',
  platform_tag: 'matchtrader',
  status: 'ongoing',
  starts_at: '',
  ends_at: '',
  entry_type: 'Free',
  prize_pool: '',
  more_info: '',
  trading_rules: [''],
  organizer: 'Menolak Rugi',
  is_active: true,
};

function toLocalDatetime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.dim, letterSpacing: 0.8, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '9px 12px', fontSize: 13, fontFamily: C.sans, outline: 'none', borderRadius: 7, boxSizing: 'border-box' as const }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--mr-gold)'}
        onBlur={e => e.currentTarget.style.borderColor = C.border2}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.dim, letterSpacing: 0.8, marginBottom: 6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '9px 12px', fontSize: 13, fontFamily: C.sans, outline: 'none', borderRadius: 7, resize: 'vertical' as const, boxSizing: 'border-box' as const }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--mr-gold)'}
        onBlur={e => e.currentTarget.style.borderColor = C.border2}
      />
    </div>
  );
}

export default function AdminCompetitionPage({ adminName = 'admin' }: { adminName?: string }) {
  const [form, setForm]     = useState<Competition>(EMPTY_COMP);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);

  // Load kompetisi aktif
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setForm({
          ...data,
          starts_at: toLocalDatetime(data.starts_at),
          ends_at:   toLocalDatetime(data.ends_at),
          prize_pool:    data.prize_pool || '',
          more_info:     data.more_info || '',
          trading_rules: data.trading_rules?.length ? data.trading_rules : [''],
        });
        loadLeaderboard(data.starts_at, data.ends_at);
      }
    })();
  }, []);

  async function loadLeaderboard(startsAt: string, endsAt: string) {
    setLoadingLb(true);
    try {
      const startDate = new Date(startsAt).toISOString().split('T')[0];
      const endDate   = new Date(endsAt).toISOString().split('T')[0];
      const [{ data: journals }, { data: members }, { data: settings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,hasil,pnl').gte('tanggal', startDate).lte('tanggal', endDate),
        supabase.from('members').select('id,nama'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);
      if (!journals || !members) { setLoadingLb(false); return; }

      const memberMap: Record<string, string> = {};
      members.forEach((m: any) => { memberMap[m.id] = m.nama || 'Anon'; });

      const equityMap: Record<string, number> = {};
      (settings || []).forEach((s: any) => { equityMap[s.member_id] = s.equity_awal || DEFAULT_EQUITY; });

      const agg: Record<string, { tp: number; total: number; pnl: number }> = {};
      journals.forEach((j: any) => {
        if (!agg[j.member_id]) agg[j.member_id] = { tp: 0, total: 0, pnl: 0 };
        agg[j.member_id].total++;
        agg[j.member_id].pnl += (j.pnl ?? 0);
        if (j.hasil === 'Take Profit' || j.hasil === 'SL Profit') agg[j.member_id].tp++;
      });

      const result: LeaderboardEntry[] = Object.entries(agg)
        .map(([mid, d]) => {
          const equity = equityMap[mid] || DEFAULT_EQUITY;
          const gain   = (d.pnl / equity) * 100;
          return {
            memberId: mid,
            nama: memberMap[mid] || 'Anon',
            trades: d.total,
            winRatio: d.total > 0 ? (d.tp / d.total) * 100 : 0,
            profit: d.pnl,
            gain,
          };
        })
        .sort((a, b) => b.gain - a.gain);

      setEntries(result);
    } catch {}
    setLoadingLb(false);
  }

  function setField(key: keyof Competition, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function setRule(i: number, v: string) {
    const rules = [...form.trading_rules];
    rules[i] = v;
    setField('trading_rules', rules);
  }
  function addRule() { setField('trading_rules', [...form.trading_rules, '']); }
  function removeRule(i: number) {
    const rules = form.trading_rules.filter((_, idx) => idx !== i);
    setField('trading_rules', rules.length ? rules : ['']);
  }

  async function handleSave() {
    if (!form.title || !form.starts_at || !form.ends_at) {
      setMsg({ text: 'Judul, tanggal mulai, dan tanggal selesai wajib diisi.', ok: false });
      return;
    }
    setSaving(true);
    setMsg(null);

    const payload = {
      title:         form.title,
      platform_tag:  form.platform_tag,
      status:        form.status,
      starts_at:     new Date(form.starts_at).toISOString(),
      ends_at:       new Date(form.ends_at).toISOString(),
      entry_type:    form.entry_type,
      prize_pool:    form.prize_pool || null,
      more_info:     form.more_info || null,
      trading_rules: form.trading_rules.filter(r => r.trim()),
      organizer:     form.organizer,
      is_active:     form.is_active,
    };

    try {
      let error: any = null;
      if (form.id) {
        const { data: updated, error: updateErr } = await supabase
          .from('competitions').update(payload).eq('id', form.id).select() as any;
        error = updateErr;
        if (!updateErr && (!updated || updated.length === 0)) {
          error = { message: 'Update diblokir database (RLS). Jalankan SQL fix di Supabase — lihat file supabase-competition-rls-fix.sql' };
        }
      } else {
        const { data, error: e } = await supabase.from('competitions').insert(payload).select().single() as any;
        error = e;
        if (!e && !data) error = { message: 'Insert diblokir database (RLS). Jalankan SQL fix di Supabase — lihat file supabase-competition-rls-fix.sql' };
        if (data) setField('id', data.id);
      }

      if (error) {
        setMsg({ text: `Gagal menyimpan: ${error.message}`, ok: false });
      } else {
        setMsg({ text: '✓ Kompetisi berhasil disimpan!', ok: true });
        loadLeaderboard(payload.starts_at, payload.ends_at);
        await supabase.from('activity_log').insert({ action: 'save_competition', detail: `Simpan kompetisi: ${form.title}`, admin_name: adminName });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, ok: false });
    }
    setSaving(false);
  }

  function handleNew() {
    setForm({ ...EMPTY_COMP, trading_rules: [''] });
    setMsg(null);
    setEntries([]);
  }

  const endsAtIso = form.ends_at ? new Date(form.ends_at).toISOString() : null;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>// ADMIN PANEL</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Manajemen Kompetisi</h2>
        </div>
        <button onClick={handleNew}
          style={{ fontFamily: C.mono, fontSize: 11, color: C.up, background: 'var(--mr-tint-green2)', border: `1px solid var(--mr-tint-green-b)`, padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontWeight: 700 }}>
          + Buat Kompetisi Baru
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* ── Form ── */}
        <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 20 }}>// KONFIGURASI KOMPETISI</div>

          <InputField label="JUDUL KOMPETISI" value={form.title} onChange={v => setField('title', v)} placeholder="June 2026 Monthly Competition" />
          <InputField label="PLATFORM TAG" value={form.platform_tag} onChange={v => setField('platform_tag', v)} placeholder="matchtrader" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="TANGGAL MULAI" value={form.starts_at} onChange={v => setField('starts_at', v)} type="datetime-local" />
            <InputField label="TANGGAL SELESAI" value={form.ends_at} onChange={v => setField('ends_at', v)} type="datetime-local" />
          </div>

          <InputField label="TIPE ENTRY" value={form.entry_type} onChange={v => setField('entry_type', v)} placeholder="Free" />
          <InputField label="ORGANIZER" value={form.organizer} onChange={v => setField('organizer', v)} placeholder="Menolak Rugi" />
          <TextareaField label="PRIZE POOL (opsional)" value={form.prize_pool} onChange={v => setField('prize_pool', v)} placeholder="Deskripsi hadiah kompetisi..." />
          <TextareaField label="MORE INFO (opsional)" value={form.more_info} onChange={v => setField('more_info', v)} placeholder="Informasi tambahan atau link..." />

          {/* Trading Rules */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.dim, letterSpacing: 0.8, marginBottom: 8 }}>TRADING RULES</label>
            {form.trading_rules.map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={rule} onChange={e => setRule(i, e.target.value)} placeholder={`Rule ${i + 1}...`}
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 10px', fontSize: 12, fontFamily: C.sans, outline: 'none', borderRadius: 6 }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--mr-gold)'}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2}
                />
                <button onClick={() => removeRule(i)}
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, padding: '0 10px', cursor: 'pointer', borderRadius: 6, fontSize: 16 }}>×</button>
              </div>
            ))}
            <button onClick={addRule}
              style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, background: 'transparent', border: `1px solid ${C.border}`, padding: '6px 12px', cursor: 'pointer', borderRadius: 6, marginTop: 4 }}>
              + Tambah Rule
            </button>
          </div>

          {/* Status toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.dim, letterSpacing: 0.8, marginBottom: 8 }}>STATUS</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['ongoing', 'ended'] as const).map(s => (
                <button key={s} onClick={() => setField('status', s)}
                  style={{ fontFamily: C.mono, fontSize: 11, padding: '8px 16px', borderRadius: 7, border: `1px solid ${form.status === s ? (s === 'ongoing' ? C.up : C.dim) : C.border}`, background: form.status === s ? (s === 'ongoing' ? 'rgba(34,197,94,0.12)' : 'rgba(100,100,100,0.12)') : 'transparent', color: form.status === s ? (s === 'ongoing' ? C.up : C.muted) : C.muted, cursor: 'pointer' }}>
                  {s === 'ongoing' ? '● Ongoing' : '○ Ended'}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setField('is_active', !form.is_active)}
              style={{ width: 40, height: 22, borderRadius: 11, background: form.is_active ? C.up : C.border2, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: form.is_active ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontFamily: C.mono, fontSize: 11, color: form.is_active ? C.up : C.dim }}>
              {form.is_active ? 'Kompetisi Aktif (tampil ke member)' : 'Nonaktif (tersembunyi)'}
            </span>
          </div>

          {/* Countdown preview */}
          {endsAtIso && (
            <div style={{ padding: '14px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>PREVIEW COUNTDOWN</div>
              <CompetitionCountdown endsAtIso={endsAtIso} />
            </div>
          )}

          {/* Pesan */}
          {msg && (
            <div style={{ fontFamily: C.mono, fontSize: 12, color: msg.ok ? C.up : C.down, background: msg.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, padding: '10px 14px', borderRadius: 7, marginBottom: 16 }}>
              {msg.text}
            </div>
          )}

          {/* Tombol simpan */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', background: saving ? C.border2 : G.gold, color: saving ? C.dim : '#000', fontFamily: C.mono, fontWeight: 700, fontSize: 13, padding: '13px', border: 'none', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'MENYIMPAN...' : form.id ? '▸ SIMPAN PERUBAHAN' : '▸ BUAT KOMPETISI'}
          </button>
        </div>

        {/* ── Preview Leaderboard ── */}
        <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1 }}>// PREVIEW LEADERBOARD</div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{entries.length} peserta</div>
          </div>
          {loadingLb ? (
            <div style={{ padding: 40, textAlign: 'center' as const, fontFamily: C.mono, fontSize: 12, color: C.dim }}>Memuat data...</div>
          ) : (
            <div style={{ padding: '0 0 8px' }}>
              <LeaderboardTable entries={entries} currentMemberId={null} compact />
            </div>
          )}
          {form.starts_at && form.ends_at && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => loadLeaderboard(new Date(form.starts_at).toISOString(), new Date(form.ends_at).toISOString())}
                style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, background: 'transparent', border: `1px solid ${C.border}`, padding: '6px 14px', cursor: 'pointer', borderRadius: 6 }}>
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
