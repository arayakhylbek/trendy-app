import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
export function UpgradeModal({ onClose }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    async function handleCheckout(uiPlan) {
        if (!user)
            return;
        const planId = uiPlan === 'lite' ? 'pro' : 'studio';
        setLoading(uiPlan);
        setError(null);
        try {
            const { checkoutUrl } = await apiFetch('/api/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({ planId }),
            });
            window.location.href = checkoutUrl;
        }
        catch (e) {
            setError(e.message);
            setLoading(null);
        }
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { style: {
                width: '100%',
                maxWidth: 580,
                background: '#0e0e12',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '2rem',
                position: 'relative',
            }, children: [_jsx("button", { onClick: onClose, style: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }, children: "\u2715" }), _jsxs("div", { style: { textAlign: 'center', marginBottom: '1.75rem' }, children: [_jsx("div", { style: { fontSize: 36, marginBottom: 10 }, children: "\u2728" }), _jsx("h2", { style: { fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.45rem', fontWeight: 700, color: '#fff', marginBottom: 6 }, children: "You've used your free generations" }), _jsx("p", { style: { fontSize: 13, color: '#888' }, children: "Upgrade to keep creating \u2014 cancel anytime" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }, children: [_jsxs("div", { style: {
                                background: 'linear-gradient(135deg, rgba(255,107,157,0.08), rgba(192,132,252,0.08))',
                                border: '1px solid rgba(255,107,157,0.45)',
                                borderRadius: 18,
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                            }, children: [_jsx("div", { style: {
                                        position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
                                        color: '#fff', fontSize: 10, fontWeight: 700,
                                        padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '.05em',
                                    }, children: "MOST POPULAR" }), _jsx("div", { style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888', marginBottom: 12 }, children: "Lite" }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }, children: [_jsx("span", { style: { fontSize: 18, fontWeight: 700, color: '#ff5c7a', textDecoration: 'line-through', fontFamily: '"DM Sans", sans-serif' }, children: "$3.99" }), _jsx("span", { style: { fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: '"DM Sans", sans-serif' }, children: "$2.99" })] }), _jsx("div", { style: { fontSize: 12, color: '#888', marginBottom: 14 }, children: "/ month" }), _jsx("ul", { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20, flex: 1 }, children: ['10 generations / month', 'All templates', 'HD quality', 'No watermark'].map(f => (_jsxs("li", { style: { fontSize: 12, color: '#bbb', display: 'flex', alignItems: 'center', gap: 7 }, children: [_jsx("span", { style: { color: '#ff6b9d', fontSize: 9 }, children: "\u2726" }), f] }, f))) }), _jsx("button", { onClick: () => handleCheckout('lite'), disabled: loading === 'lite', style: {
                                        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                                        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
                                        color: '#fff', fontSize: 13, fontWeight: 600,
                                        cursor: loading === 'lite' ? 'default' : 'pointer',
                                        opacity: loading === 'lite' ? 0.7 : 1,
                                        fontFamily: '"DM Sans", sans-serif',
                                    }, children: loading === 'lite' ? 'Redirecting…' : 'Upgrade to Lite ✦' })] }), _jsxs("div", { style: {
                                background: '#16161a',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 18,
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                            }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888', marginBottom: 12 }, children: "Pro" }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }, children: [_jsx("span", { style: { fontSize: 18, fontWeight: 700, color: '#ff5c7a', textDecoration: 'line-through', fontFamily: '"DM Sans", sans-serif' }, children: "$6.99" }), _jsx("span", { style: { fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: '"DM Sans", sans-serif' }, children: "$4.99" })] }), _jsx("div", { style: { fontSize: 12, color: '#888', marginBottom: 14 }, children: "/ month" }), _jsx("ul", { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20, flex: 1 }, children: ['30 generations / month', 'All templates + early access', '4K quality', 'No watermark'].map(f => (_jsxs("li", { style: { fontSize: 12, color: '#bbb', display: 'flex', alignItems: 'center', gap: 7 }, children: [_jsx("span", { style: { color: '#ff6b9d', fontSize: 9 }, children: "\u2726" }), f] }, f))) }), _jsx("button", { onClick: () => handleCheckout('pro'), disabled: loading === 'pro', style: {
                                        width: '100%', padding: '12px', borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: '#1e1e24', color: '#f0f0f5', fontSize: 13, fontWeight: 600,
                                        cursor: loading === 'pro' ? 'default' : 'pointer',
                                        opacity: loading === 'pro' ? 0.7 : 1,
                                        fontFamily: '"DM Sans", sans-serif',
                                    }, children: loading === 'pro' ? 'Redirecting…' : 'Upgrade to Pro ✦' })] })] }), error && _jsx("p", { style: { textAlign: 'center', marginTop: 12, fontSize: 12, color: '#ef4444' }, children: error }), _jsx("p", { style: { textAlign: 'center', marginTop: 14, fontSize: 11, color: '#444' }, children: "Cancel anytime \u00B7 No questions asked" })] }) }));
}
