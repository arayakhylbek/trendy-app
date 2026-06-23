import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import type { Template } from '@trendy/shared';

const OWNER_EMAIL = 'araiakhylbek78@gmail.com';

type AdminTemplate = Template & { id: string; status?: string; trendTopic?: string };

type TabStatus = 'pending' | 'published';

export function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabStatus>('pending');
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [creditEmail, setCreditEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('3');
  const [creditMsg, setCreditMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  if (loading) return null;
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) return <Navigate to="/" replace />;

  async function grantCredits() {
    if (!creditEmail.trim()) return;
    setCreditMsg(null);
    try {
      const result = await apiFetch<{ granted: number; before: number; after: number }>(
        '/api/admin/users/grant-credits',
        { method: 'POST', body: JSON.stringify({ email: creditEmail.trim(), credits: Number(creditAmount) }) },
      );
      setCreditMsg(`✅ Granted ${result.granted} credits to ${creditEmail}. Used: ${result.before} → ${result.after}`);
      setCreditEmail('');
    } catch (e) {
      setCreditMsg(`❌ ${(e as Error).message}`);
    }
  }

  return <AdminInner tab={tab} setTab={setTab} generating={generating} setGenerating={setGenerating} generateMsg={generateMsg} setGenerateMsg={setGenerateMsg} qc={qc} creditEmail={creditEmail} setCreditEmail={setCreditEmail} creditAmount={creditAmount} setCreditAmount={setCreditAmount} creditMsg={creditMsg} grantCredits={grantCredits} />;
}

function AdminInner({
  tab, setTab, generating, setGenerating, generateMsg, setGenerateMsg, qc,
  creditEmail, setCreditEmail, creditAmount, setCreditAmount, creditMsg, grantCredits,
}: {
  tab: TabStatus;
  setTab: (t: TabStatus) => void;
  generating: boolean;
  setGenerating: (v: boolean) => void;
  generateMsg: string | null;
  setGenerateMsg: (v: string | null) => void;
  creditEmail: string;
  setCreditEmail: (v: string) => void;
  creditAmount: string;
  setCreditAmount: (v: string) => void;
  creditMsg: string | null;
  grantCredits: () => void;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-templates', tab],
    queryFn: () => apiFetch<{ templates: AdminTemplate[]; total: number }>(`/api/admin/templates?status=${tab}`),
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-templates'] }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-templates'] }); },
  });

  async function triggerGenerate() {
    setGenerating(true);
    setGenerateMsg('⏳ Generating templates… this takes 2–4 min, please wait.');
    try {
      const result = await apiFetch<{ templatesGenerated: number; errors: string[] | null; error?: string | null; status?: string }>(
        '/api/admin/generate',
        { method: 'POST' },
      );
      const count = result.templatesGenerated ?? 0;
      const errDetail = result.error ?? result.errors?.join(' | ') ?? '';
      setGenerateMsg(count > 0
        ? `✅ Generated ${count} template${count !== 1 ? 's' : ''}! Check Pending tab.`
        : `⚠️ 0 templates generated. ${errDetail || 'Unknown error — check Vercel logs.'}`
      );
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
    } catch (e) {
      setGenerateMsg(`❌ Error: ${(e as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  const templates = data?.templates ?? [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>
            Template Queue
          </h1>
          <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Review AI-generated templates before they go live</p>
        </div>
        <button
          onClick={triggerGenerate}
          disabled={generating}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: generating ? '#333' : 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            color: generating ? '#888' : '#fff', fontSize: 13, fontWeight: 600,
            cursor: generating ? 'default' : 'pointer', fontFamily: '"DM Sans", sans-serif',
          }}
        >
          {generating ? '⏳ Generating…' : '⚡ Generate Now'}
        </button>
      </div>

      {generateMsg && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 16px', borderRadius: 12, background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', color: '#c084fc', fontSize: 13 }}>
          {generateMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        {(['pending', 'published'] as TabStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 18px', borderRadius: 20, border: '1px solid',
              borderColor: tab === t ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(255,107,157,0.1)' : 'transparent',
              color: tab === t ? '#ff6b9d' : '#666',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t} {tab === t && data ? `(${data.total})` : ''}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '4rem' }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ color: '#555', textAlign: 'center', padding: '4rem' }}>
          {tab === 'pending' ? 'No pending templates. Click "Generate Now" to create some.' : 'No published templates yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{ background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
            >
              {/* Image */}
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={t.image}
                  alt={t.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {t.trendTopic && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 8px', fontSize: 10, color: '#c084fc', fontWeight: 600 }}>
                    {t.trendTopic}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '12px 12px 10px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  {t.emoji} {t.label}
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>{t.style} · {t.cat}</div>

                {/* Actions */}
                {tab === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approve.mutate(t.id!)}
                      disabled={approve.isPending}
                      style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff6b9d, #c084fc)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✓ Publish
                    </button>
                    <button
                      onClick={() => remove.mutate(t.id!)}
                      disabled={remove.isPending}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => remove.mutate(t.id!)}
                    disabled={remove.isPending}
                    style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grant credits */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Grant Credits</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="user@email.com"
            value={creditEmail}
            onChange={(e) => setCreditEmail(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e12', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <input
            type="number"
            min={1}
            max={100}
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            style={{ width: 70, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e12', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={grantCredits}
            disabled={!creditEmail.trim()}
            style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff6b9d, #c084fc)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Grant
          </button>
        </div>
        {creditMsg && <p style={{ marginTop: 10, fontSize: 12, color: creditMsg.startsWith('✅') ? '#4ade80' : '#ef4444' }}>{creditMsg}</p>}
      </div>
    </div>
  );
}
