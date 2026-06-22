import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
const OWNER_EMAIL = 'araiakhylbek78@gmail.com';
export function Admin() {
    const { user, loading } = useAuth();
    const [tab, setTab] = useState('pending');
    const [generating, setGenerating] = useState(false);
    const [generateMsg, setGenerateMsg] = useState(null);
    const qc = useQueryClient();
    if (loading)
        return null;
    if (!user || user.email?.toLowerCase() !== OWNER_EMAIL)
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(AdminInner, { tab: tab, setTab: setTab, generating: generating, setGenerating: setGenerating, generateMsg: generateMsg, setGenerateMsg: setGenerateMsg, qc: qc });
}
function AdminInner({ tab, setTab, generating, setGenerating, generateMsg, setGenerateMsg, qc, }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-templates', tab],
        queryFn: () => apiFetch(`/api/admin/templates?status=${tab}`),
    });
    const approve = useMutation({
        mutationFn: (id) => apiFetch(`/api/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-templates'] }); },
    });
    const remove = useMutation({
        mutationFn: (id) => apiFetch(`/api/admin/templates/${id}`, { method: 'DELETE' }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-templates'] }); },
    });
    async function triggerGenerate() {
        setGenerating(true);
        setGenerateMsg(null);
        try {
            await apiFetch('/api/admin/generate', { method: 'POST' });
            setGenerateMsg('⏳ Generating templates (2-4 min)… Refresh Pending in a bit.');
            // Poll every 30s for new pending templates
            const poll = setInterval(() => {
                qc.invalidateQueries({ queryKey: ['admin-templates'] });
            }, 30000);
            setTimeout(() => {
                clearInterval(poll);
                setGenerateMsg('✅ Done! Check Pending tab.');
                setGenerating(false);
            }, 4 * 60 * 1000);
        }
        catch (e) {
            setGenerateMsg(`❌ ${e.message}`);
            setGenerating(false);
        }
    }
    const templates = data?.templates ?? [];
    return (_jsxs("div", { style: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontStyle: 'italic' }, children: "Template Queue" }), _jsx("p", { style: { color: '#666', fontSize: 13, marginTop: 4 }, children: "Review AI-generated templates before they go live" })] }), _jsx("button", { onClick: triggerGenerate, disabled: generating, style: {
                            padding: '10px 20px', borderRadius: 12, border: 'none',
                            background: generating ? '#333' : 'linear-gradient(135deg, #ff6b9d, #c084fc)',
                            color: generating ? '#888' : '#fff', fontSize: 13, fontWeight: 600,
                            cursor: generating ? 'default' : 'pointer', fontFamily: '"DM Sans", sans-serif',
                        }, children: generating ? '⏳ Generating…' : '⚡ Generate Now' })] }), generateMsg && (_jsx("div", { style: { marginBottom: '1.5rem', padding: '12px 16px', borderRadius: 12, background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', color: '#c084fc', fontSize: 13 }, children: generateMsg })), _jsx("div", { style: { display: 'flex', gap: 8, marginBottom: '1.5rem' }, children: ['pending', 'published'].map((t) => (_jsxs("button", { onClick: () => setTab(t), style: {
                        padding: '7px 18px', borderRadius: 20, border: '1px solid',
                        borderColor: tab === t ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.08)',
                        background: tab === t ? 'rgba(255,107,157,0.1)' : 'transparent',
                        color: tab === t ? '#ff6b9d' : '#666',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        textTransform: 'capitalize',
                    }, children: [t, " ", tab === t && data ? `(${data.total})` : ''] }, t))) }), isLoading ? (_jsx("div", { style: { color: '#666', textAlign: 'center', padding: '4rem' }, children: "Loading\u2026" })) : templates.length === 0 ? (_jsx("div", { style: { color: '#555', textAlign: 'center', padding: '4rem' }, children: tab === 'pending' ? 'No pending templates. Click "Generate Now" to create some.' : 'No published templates yet.' })) : (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }, children: templates.map((t) => (_jsxs("div", { style: { background: '#16161a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }, children: [_jsxs("div", { style: { aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }, children: [_jsx("img", { src: t.image, alt: t.label, style: { width: '100%', height: '100%', objectFit: 'cover' } }), t.trendTopic && (_jsx("div", { style: { position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 8px', fontSize: 10, color: '#c084fc', fontWeight: 600 }, children: t.trendTopic }))] }), _jsxs("div", { style: { padding: '12px 12px 10px' }, children: [_jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }, children: [t.emoji, " ", t.label] }), _jsxs("div", { style: { fontSize: 11, color: '#555', marginBottom: 12 }, children: [t.style, " \u00B7 ", t.cat] }), tab === 'pending' ? (_jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => approve.mutate(t.id), disabled: approve.isPending, style: { flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff6b9d, #c084fc)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }, children: "\u2713 Publish" }), _jsx("button", { onClick: () => remove.mutate(t.id), disabled: remove.isPending, style: { padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 12, cursor: 'pointer' }, children: "\u2715" })] })) : (_jsx("button", { onClick: () => remove.mutate(t.id), disabled: remove.isPending, style: { width: '100%', padding: '8px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }, children: "Delete" }))] })] }, t.id))) }))] }));
}
