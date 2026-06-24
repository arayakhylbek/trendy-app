import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
const FEATURES = {
    free: ['2 AI photo generations', 'All 8 templates', 'Standard quality', 'No watermark removal', 'Priority processing'],
    lite: ['10 generations / month', 'All templates + new drops', 'HD quality output', 'No watermark', 'Priority processing'],
    pro: ['10 generations / month', 'All templates + early access', '4K quality output', 'No watermark', 'Priority processing'],
};
const DISABLED = {
    free: ['No watermark removal', 'Priority processing'],
    lite: ['Priority processing'],
    pro: [],
};
export function PricingSection({ onNeedAuth }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);
    async function handleCheckout(uiPlan) {
        if (!user) {
            onNeedAuth?.();
            return;
        }
        // UI "Lite" → backend planId 'pro'; UI "Pro" → backend planId 'studio'
        const planId = uiPlan === 'lite' ? 'pro' : 'studio';
        setLoading(uiPlan);
        setCheckoutError(null);
        try {
            const { checkoutUrl } = await apiFetch('/api/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({ planId }),
            });
            window.location.href = checkoutUrl;
        }
        catch (e) {
            setCheckoutError(e.message);
            setLoading(null);
        }
    }
    return (_jsxs("section", { id: "pricing", className: "px-4 sm:px-6 py-14 text-center", children: [_jsxs("h2", { className: "mb-2", style: {
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                    fontWeight: 700,
                    color: '#fff',
                }, children: ["Choose your", ' ', _jsx("em", { style: {
                            fontStyle: 'italic',
                            background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }, children: "vibe" })] }), _jsx("p", { style: { color: '#888', fontSize: 14, marginBottom: '2.5rem' }, children: "Start free \u2014 no credit card needed" }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                    maxWidth: 900,
                    margin: '0 auto',
                }, children: [_jsxs(Card, { children: [_jsx(PlanName, { children: "Free" }), _jsx(PriceRow, { children: _jsx(BigPrice, { children: "$0" }) }), _jsx(Per, { children: "/ forever" }), _jsx(AlwaysFreeBadge, {}), _jsx(Desc, { children: "Perfect for trying it out. 2 generations on us." }), _jsx(FeatureList, { features: FEATURES.free, disabled: DISABLED.free }), _jsx(DarkButton, { onClick: () => document.getElementById('section-all')?.scrollIntoView({ behavior: 'smooth' }), children: "Get started free" })] }), _jsxs(Card, { featured: true, children: [_jsx(PopularBadge, {}), _jsx(PlanName, { children: "Lite" }), _jsxs(PriceRow, { children: [_jsx(OldPrice, { children: "$2.99" }), _jsx(BigPrice, { children: "$1.99" })] }), _jsx(Per, { children: "/ mo" }), _jsx(PromoBadge, { children: "Limited time \u2014 33% off" }), _jsx(Desc, { children: "For the casual creator who posts regularly." }), _jsx(FeatureList, { features: FEATURES.lite, disabled: DISABLED.lite }), _jsx(GradientButton, { onClick: () => handleCheckout('lite'), disabled: loading === 'lite', children: loading === 'lite' ? 'Redirecting…' : 'Upgrade to Lite ✦' })] }), _jsxs(Card, { children: [_jsx(PlanName, { children: "Pro" }), _jsxs(PriceRow, { children: [_jsx(OldPrice, { children: "$4.99" }), _jsx(BigPrice, { children: "$2.99" })] }), _jsx(Per, { children: "/ mo" }), _jsx(PromoBadge, { children: "Limited time \u2014 40% off" }), _jsx(Desc, { children: "For the serious creator who posts every day." }), _jsx(FeatureList, { features: FEATURES.pro, disabled: DISABLED.pro }), _jsx(DarkButton, { onClick: () => handleCheckout('pro'), disabled: loading === 'pro', children: loading === 'pro' ? 'Redirecting…' : 'Upgrade to Pro ✦' })] })] }), checkoutError && (_jsx("p", { style: { marginTop: '1rem', fontSize: 13, color: '#ef4444' }, children: checkoutError })), _jsx("p", { style: { marginTop: '1.5rem', fontSize: 12, color: '#555' }, children: "Cancel anytime. No questions asked." })] }));
}
/* ── Sub-components ── */
function Card({ children, featured }) {
    return (_jsx("div", { style: {
            background: featured
                ? 'linear-gradient(135deg, rgba(255,107,157,0.08), rgba(192,132,252,0.08))'
                : '#16161a',
            border: featured
                ? '1px solid rgba(255,107,157,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
            boxShadow: featured
                ? '0 0 0 1px rgba(255,107,157,0.2), 0 12px 40px rgba(255,107,157,0.12)'
                : undefined,
            borderRadius: 24,
            padding: '2.75rem 2rem 2.25rem',
            textAlign: 'left',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform .2s, box-shadow .2s',
        }, onMouseEnter: (e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'translateY(0)';
        }, children: children }));
}
function PopularBadge() {
    return (_jsx("div", { style: {
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            letterSpacing: '.04em',
            boxShadow: '0 4px 14px rgba(255,107,157,0.4)',
        }, children: "MOST POPULAR" }));
}
function PlanName({ children }) {
    return (_jsx("div", { style: {
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: '#888',
            marginBottom: '1.25rem',
        }, children: children }));
}
function PriceRow({ children }) {
    return (_jsx("div", { style: {
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            marginBottom: 2,
        }, children: children }));
}
function BigPrice({ children }) {
    return (_jsx("span", { style: {
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 42,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '-0.5px',
        }, children: children }));
}
function OldPrice({ children }) {
    return (_jsx("span", { style: {
            fontSize: 26,
            fontWeight: 600,
            color: '#ff5c7a',
            textDecoration: 'line-through',
            textDecorationColor: '#ff5c7a',
            textDecorationThickness: 3,
            fontFamily: '"DM Sans", system-ui, sans-serif',
        }, children: children }));
}
function Per({ children }) {
    return (_jsx("div", { style: { fontSize: 14, color: '#888', marginBottom: '1.5rem' }, children: children }));
}
function AlwaysFreeBadge() {
    return (_jsx("div", { style: {
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: '#1e1e24',
            color: '#888',
            fontSize: 11,
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 20,
            marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: '.05em',
        }, children: "ALWAYS FREE" }));
}
function PromoBadge({ children }) {
    return (_jsx("div", { style: {
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            padding: '7px 14px',
            borderRadius: 20,
            marginBottom: '1.5rem',
            boxShadow: '0 6px 18px rgba(255,107,157,0.45)',
        }, children: children }));
}
function Desc({ children }) {
    return (_jsx("div", { style: { fontSize: 13, color: '#888', marginBottom: '1.5rem', lineHeight: 1.5 }, children: children }));
}
function FeatureList({ features, disabled }) {
    return (_jsx("ul", { style: {
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: '1.5rem',
            flex: 1,
        }, children: features.map((f) => {
            const muted = disabled.includes(f);
            return (_jsxs("li", { style: {
                    fontSize: 13,
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: muted ? 0.45 : 1,
                }, children: [_jsx("span", { style: { color: muted ? 'rgba(255,255,255,0.12)' : '#ff6b9d', fontSize: 10, flexShrink: 0 }, children: "\u2726" }), f] }, f));
        }) }));
}
function DarkButton({ children, onClick, disabled }) {
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
            width: '100%',
            marginTop: 'auto',
            padding: '14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#1e1e24',
            color: '#f0f0f5',
            fontSize: 14,
            fontWeight: 500,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            transition: 'border-color .2s, color .2s',
        }, onMouseEnter: (e) => {
            const el = e.currentTarget;
            el.style.borderColor = '#ff6b9d';
            el.style.color = '#ff6b9d';
        }, onMouseLeave: (e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'rgba(255,255,255,0.08)';
            el.style.color = '#f0f0f5';
        }, children: children }));
}
function GradientButton({ children, onClick, disabled }) {
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
            width: '100%',
            marginTop: 'auto',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            transition: 'opacity .2s',
        }, onMouseEnter: (e) => { e.currentTarget.style.opacity = '0.88'; }, onMouseLeave: (e) => { e.currentTarget.style.opacity = '1'; }, children: children }));
}
