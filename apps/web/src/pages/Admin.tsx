import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import type { Template } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

type AdminTemplate = Template & { id: string; status?: string; trendTopic?: string; _isStatic?: boolean };

// Same 9 concepts as the "sports" entries in apps/api/src/routes/admin.ts STYLED_PROMPTS —
// paired here with a real supplied photo instead of an AI-generated preview.
const SPORTS_PHOTO_SLOTS: Array<{ emoji: string; label: string; style: string; cat: string; prompt: string }> = [
  { emoji: '🎾', label: 'Tennis Ace', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic sporty editorial portrait. Young woman sitting on a tennis court, one leg extended, wearing an all-white tennis fit — ribbed tank top, pleated tennis skirt, matching headband, white sneakers and crew socks. Tennis racket and two tennis balls resting beside her on the court. Court is bold blue and green with white sideline markings, tennis net visible behind her. Bright, clean daylight, high-fashion sports editorial lighting. Confident, relaxed pose, subtle smile. Hyper-realistic, 4K, professional sports lifestyle photography.' },
  { emoji: '🏐', label: 'Volleyball Star', style: 'Sporty', cat: 'sports',
    prompt: 'Dramatic photorealistic sports portrait. Young woman leaning against a volleyball net, wearing a long-sleeve blue volleyball jersey with a bold number and team lettering, knee pads, holding a volleyball at her hip. Backlit rim lighting cutting through the net, dark moody gym background with subtle lens flare. Intense, focused expression, athletic confident stance. Hyper-realistic, 4K, dramatic senior sports photography.' },
  { emoji: '🏀', label: 'Hoop Dreams', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic studio sports portrait. Young woman crouching low, dribbling a basketball, wearing a yellow and navy basketball uniform, hair in double braids, basketball sneakers. Clean bright white studio background, soft even lighting with subtle shadow. Confident, powerful athletic pose, direct gaze at camera. Hyper-realistic, 4K, professional sports studio photography.' },
  { emoji: '🏐', label: 'Varsity Volleyball', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic senior sports portrait. Young woman standing side-on against a plain dark studio backdrop, wearing a navy volleyball uniform with an arm sleeve and bold number, holding a volleyball against her hip, warm confident smile, long hair loose. Soft dramatic side lighting with a subtle rim light. Hyper-realistic, 4K, professional senior sports photography.' },
  { emoji: '⛳', label: 'Country Club Cart', style: 'Preppy', cat: 'sports',
    prompt: 'Photorealistic preppy lifestyle portrait. Young woman sitting in a golf cart on a sunny golf course, wearing a white sports-bra top, matching pleated skirt, cream knit cardigan, and white visor, one hand adjusting the visor. Golf clubs visible in the bag beside her, lush green fairway and trees in the background. Bright natural daylight, clean aspirational lifestyle photography. Relaxed, chic pose. Hyper-realistic, 4K, editorial lifestyle photography.' },
  { emoji: '🎾', label: 'Clay Court Glow', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic golden hour tennis portrait. Young woman standing at the net on a red clay tennis court, wearing a fitted white halter tennis dress and white visor, holding a tennis racket, warm low sunlight creating soft flare and glow. Elegant, poised stance, looking off to the side. Hyper-realistic, 4K, editorial sports lifestyle photography.' },
  { emoji: '🎾', label: 'Match Point Smile', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic sporty portrait. Young woman standing on an outdoor tennis court, wearing a white zip-up tennis polo and holding a tennis racket over her shoulder and a tennis ball in hand, bright genuine smile, long wavy hair. Soft overcast daylight, clean green court background. Hyper-realistic, 4K, professional sports lifestyle photography.' },
  { emoji: '🏀', label: 'Fire on the Court', style: 'Sporty', cat: 'sports',
    prompt: 'Cinematic dramatic sports portrait. Young woman sitting on a folding chair on a basketball court surrounded by basketballs, wearing a white and red basketball uniform with an arm sleeve, resting a basketball on her lap, one foot propped on a ball. Thick orange smoke and dramatic rim lighting fill the background, moody gym atmosphere. Hyper-realistic, 4K, dramatic senior sports photography.' },
  { emoji: '⛳', label: 'Fairway Glam', style: 'Preppy', cat: 'sports',
    prompt: 'Photorealistic glamorous golf lifestyle portrait. Young woman lounging playfully in a golf cart, wearing a fitted white sleeveless golf dress and white cap, legs draped over the seat, playful joyful smile, golf clubs and bag beside her. Warm bright sunny daylight on a manicured golf course. Hyper-realistic, 4K, aspirational lifestyle photography.' },
];

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [generatingSports, setGeneratingSports] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [creditEmail, setCreditEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('3');
  const [creditMsg, setCreditMsg] = useState<string | null>(null);
  const [sportsFiles, setSportsFiles] = useState<Record<number, File>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [quickFiles, setQuickFiles] = useState<File[]>([]);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);

  async function uploadQuickPhotos() {
    if (quickFiles.length === 0) return;
    setQuickUploading(true);
    setQuickMsg(null);
    let done = 0;
    const errors: string[] = [];
    for (const file of quickFiles) {
      try {
        const imageBase64 = await readFileAsDataUri(file);
        await apiFetch('/api/admin/templates/quick-upload', {
          method: 'POST',
          body: JSON.stringify({ imageBase64 }),
        });
        done++;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    setQuickMsg(errors.length === 0
      ? `✅ ${done} photo(s) uploaded — waiting in Pending for review.`
      : `⚠️ ${done} uploaded, ${errors.length} failed: ${errors.join(' | ')}`
    );
    setQuickFiles([]);
    setQuickUploading(false);
    qc.invalidateQueries({ queryKey: ['admin-templates'] });
  }

  async function uploadSportsPhotos() {
    const entries = Object.entries(sportsFiles);
    if (entries.length === 0) return;
    setUploadingPhotos(true);
    setPhotoMsg(null);
    let done = 0;
    const errors: string[] = [];
    for (const [idxStr, file] of entries) {
      const slot = SPORTS_PHOTO_SLOTS[Number(idxStr)]!;
      try {
        const imageBase64 = await readFileAsDataUri(file);
        await apiFetch('/api/admin/templates/upload-photo', {
          method: 'POST',
          body: JSON.stringify({ ...slot, imageBase64 }),
        });
        done++;
      } catch (e) {
        errors.push(`${slot.label}: ${(e as Error).message}`);
      }
    }
    setPhotoMsg(errors.length === 0
      ? `✅ ${done} photo template(s) published!`
      : `⚠️ ${done} published, ${errors.length} failed: ${errors.join(' | ')}`
    );
    setSportsFiles({});
    setUploadingPhotos(false);
    qc.invalidateQueries({ queryKey: ['admin-templates'] });
  }

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

  async function generateSports() {
    setGeneratingSports(true);
    setMsg('⏳ Generating sports templates… ~2–3 min');
    try {
      const result = await apiFetch<{ generated: number; errors: string[] | null }>(
        '/api/admin/generate-styled?cat=sports', { method: 'POST' },
      );
      setMsg(result.generated > 0
        ? `✅ ${result.generated} sports templates added live!`
        : `⚠️ 0 generated. ${result.errors?.join(' | ') ?? ''}`
      );
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
    } catch (e) { setMsg(`❌ ${(e as Error).message}`); }
    finally { setGeneratingSports(false); }
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
  const busy = generating || generatingTrend || generatingSports;

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
          <button
            onClick={generateSports}
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
            {generatingSports ? '⏳ Generating…' : '🏆 Generate Sports (9)'}
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

      {/* Quick Upload — just drop photos, Claude names them later */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,107,157,0.2)' }}>
        <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📥 Quick Upload</h3>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 14 }}>
          Drop photos here — no need to fill anything in. They land in the Pending tab; Claude reviews, names, and publishes them.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setQuickFiles(Array.from(e.target.files ?? []))}
          style={{ fontSize: 12, color: '#888' }}
        />
        <div>
          <button
            onClick={uploadQuickPhotos}
            disabled={quickUploading || quickFiles.length === 0}
            style={{
              marginTop: 14, padding: '9px 20px', borderRadius: 10, border: 'none',
              background: quickUploading ? '#222' : 'linear-gradient(135deg, #ff6b9d, #c084fc)',
              color: quickUploading ? '#555' : '#fff', fontSize: 13, fontWeight: 600,
              cursor: quickUploading ? 'default' : 'pointer',
            }}
          >
            {quickUploading ? '⏳ Uploading…' : `📤 Upload ${quickFiles.length || ''} Photo(s)`}
          </button>
        </div>
        {quickMsg && <p style={{ marginTop: 10, fontSize: 12, color: quickMsg.startsWith('✅') ? '#4ade80' : '#ef4444' }}>{quickMsg}</p>}
      </div>

      {/* Upload Sports Photos */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload Sports Photos</h3>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 14 }}>
          Assign a real photo to each concept — published as-is, no AI generation.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {SPORTS_PHOTO_SLOTS.map((slot, i) => (
            <div key={slot.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 190, fontSize: 13, color: '#ccc', flexShrink: 0 }}>
                {slot.emoji} {slot.label}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSportsFiles((prev) => {
                    const next = { ...prev };
                    if (file) next[i] = file;
                    else delete next[i];
                    return next;
                  });
                }}
                style={{ fontSize: 12, color: '#888', flex: 1 }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={uploadSportsPhotos}
          disabled={uploadingPhotos || Object.keys(sportsFiles).length === 0}
          style={{
            marginTop: 14, padding: '9px 20px', borderRadius: 10, border: 'none',
            background: uploadingPhotos ? '#222' : 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            color: uploadingPhotos ? '#555' : '#fff', fontSize: 13, fontWeight: 600,
            cursor: uploadingPhotos ? 'default' : 'pointer',
          }}
        >
          {uploadingPhotos ? '⏳ Uploading…' : `📷 Upload ${Object.keys(sportsFiles).length || ''} Photo(s)`}
        </button>
        {photoMsg && <p style={{ marginTop: 10, fontSize: 12, color: photoMsg.startsWith('✅') ? '#4ade80' : '#ef4444' }}>{photoMsg}</p>}
      </div>

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
