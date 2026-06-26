import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import type { Template } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

type AdminTemplate = Template & { id: string; status?: string; trendTopic?: string; _isStatic?: boolean };

export function Admin() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) return <Navigate to="/" replace />;
  return <AdminInner />;
}

function AdminInner() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [generating, setGenerating] = useState(false);
  const [generatingTrend, setGeneratingTrend] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [creditEmail, setCreditEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('3');
  const [creditMsg, setCreditMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-templates', tab],
    queryFn: () => {
      const params = tab === 'all'
        ? '?status=published&includeStatic=true'
        : '?status=pending';
      return apiFetch<{ templates: AdminTemplate[]; total: number }>(`/api/admin/templates${params}`);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-templates'] }),
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-templates'] }),
  });

  async function generateStyled() {
    setGenerating(true);
    setMsg('⏳ Generating realistic styled templates… ~1–2 min');
    try {
      const result = await apiFetch<{ generated: number; errors: string[] | null }>(
        '/api/admin/generate-styled?count=3', { method: 'POST' },
      );
      setMsg(result.generated > 0
        ? `✅ ${result.generated} templates added live!`
        : `⚠️ 0 generated. ${result.errors?.join(' | ') ?? ''}`
      );
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
    } catch (e) { setMsg(`❌ ${(e as Error).message}`); }
    finally { setGenerating(false); }
  }

  async function generateTrend() {
    setGeneratingTrend(true);
    setMsg('⏳ Generating trend-based templates… ~2–4 min');
    try {
      const result = await apiFetch<{ templatesGenerated: number; error?: string }>(
        '/api/admin/generate', { method: 'POST' },
      );
      setMsg(result.templatesGenerated > 0
        ? `✅ ${result.templatesGenerated} trend templates added to Pending!`
        : `⚠️ 0 generated. ${result.error ?? ''}`
      );
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
    } catch (e) { setMsg(`❌ ${(e as Error).message}`); }
    finally { setGeneratingTrend(false); }
  }

  async function grantCredits() {
    if (!creditEmail.trim()) return;
    setCreditMsg(null);
    try {
      const result = await apiFetch<{ granted: number; before: number; after: number }>(
        '/api/admin/users/grant-credits',
        { method: 'POST', body: JSON.stringify({ email: creditEmail.trim(), credits: Number(creditAmount) }) },
      );
      setCreditMsg(`✅ +${result.granted} credits to ${creditEmail}. Used: ${result.before} → ${result.after}`);
      setCreditEmail('');
    } catch (e) { setCreditMsg(`❌ ${(e as Error).message}`); }
  }

  const templates = data?.templates ?? [];
  const busy = generating || generatingTrend;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>
            Template Manager
          </h1>
          <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>All templates · delete any · generate new</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={generateStyled}
            disabled={busy}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: busy ? '#222' : 'linear-gradient(135deg, #ff6b9d, #c084fc)',
              color: busy ? '#555' : '#fff', fontSize: 13, fontWeight: 600,
              cursor: busy ? 'default' : 'pointer', fontFamily: '"DM Sans", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {generating ? '⏳ Generating…' : '🎨 Generate Styled'}
          </button>
          <button
            onClick={generateTrend}
            disabled={busy}
            style={{
              padding: '10px 20px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: busy ? '#555' : '#aaa', fontSize: 13, fontWeight: 600,
              cursor: busy ? 'default' : 'pointer', fontFamily: '"DM Sans", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {generatingTrend ? '⏳ Generating…' : '⚡ Trend-Based'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 16px', borderRadius: 12, background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)', color: '#c084fc', fontSize: 13 }}>
          {msg}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        {(['all', 'pending'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 18px', borderRadius: 20, border: '1px solid',
              borderColor: tab === t ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(255,107,157,0.1)' : 'transparent',
              color: tab === t ? '#ff6b9d' : '#666',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t === 'all' ? 'All Templates' : 'Pending'} {tab === t && data ? `(${data.total})` : ''}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '4rem' }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ color: '#555', textAlign: 'center', padding: '4rem' }}>
          {tab === 'pending' ? 'No pending templates.' : 'No templates yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{ background: '#16161a', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}
            >
              {t._isStatic && (
                <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#888', zIndex: 1 }}>
                  static
                </div>
              )}
              {t.status === 'pending' && (
                <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(255,165,0,0.8)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#000', fontWeight: 700, zIndex: 1 }}>
                  PENDING
                </div>
              )}

              <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
                <img
                  src={t.image}
                  alt={t.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.background = '#222'; }}
                />
              </div>

              <div style={{ padding: '10px 10px 8px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.emoji} {t.label}
                </div>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>{t.cat}</div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {t.status === 'pending' && (
                    <button
                      onClick={() => approve.mutate(t.id)}
                      disabled={approve.isPending}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #ff6b9d, #c084fc)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✓ Publish
                    </button>
                  )}
                  <button
                    onClick={() => { if (window.confirm(`Delete "${t.label}"?`)) remove.mutate(t.id); }}
                    disabled={remove.isPending}
                    style={{ flex: t.status === 'pending' ? '0 0 36px' : 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}
                  >
                    {t.status === 'pending' ? '✕' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grant Credits */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Grant Credits</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email" placeholder="user@email.com" value={creditEmail}
            onChange={(e) => setCreditEmail(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e12', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <input
            type="number" min={1} max={100} value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            style={{ width: 70, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e12', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={grantCredits} disabled={!creditEmail.trim()}
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
