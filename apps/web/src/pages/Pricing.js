import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PLANS } from '@trendy/shared';
import { useAuth } from '../hooks/useAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { apiFetch } from '../lib/api';
import { AuthModal } from '../components/auth/AuthModal';
const PLAN_STYLES = {
    free: { border: 'border-white/10', badge: 'bg-plan-free/20 text-plan-free' },
    pro: {
        border: 'border-plan-pro/50',
        badge: 'bg-plan-pro/20 text-plan-pro',
        highlight: true,
    },
    studio: { border: 'border-plan-studio/50', badge: 'bg-plan-studio/20 text-plan-studio' },
};
export function Pricing() {
    const { user } = useAuth();
    const { data: currentUser } = useCurrentUser();
    const [loading, setLoading] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const currentTier = currentUser?.tier ?? 'free';
    async function handleUpgrade(planId) {
        if (!user) {
            setShowAuth(true);
            return;
        }
        setLoading(planId);
        try {
            const { checkoutUrl } = await apiFetch('/api/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({ planId }),
            });
            window.location.href = checkoutUrl;
        }
        catch (e) {
            alert(e.message);
            setLoading(null);
        }
    }
    async function handlePortal() {
        setLoading('portal');
        try {
            const { portalUrl } = await apiFetch('/api/billing/portal', {
                method: 'POST',
            });
            window.location.href = portalUrl;
        }
        catch (e) {
            alert(e.message);
            setLoading(null);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("main", { className: "max-w-5xl mx-auto px-4 py-16", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "font-display text-4xl font-bold text-white mb-3", children: "Simple pricing" }), _jsx("p", { className: "text-text-muted", children: "Start free. Upgrade when you need more." })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6", children: ['free', 'pro', 'studio'].map((planId) => {
                            const plan = PLANS[planId];
                            const styles = PLAN_STYLES[planId];
                            const isCurrent = currentTier === planId;
                            return (_jsxs("div", { className: `rounded-2xl p-6 bg-surface border ${styles.border} ${'highlight' in styles && styles.highlight ? 'ring-1 ring-plan-pro/50' : ''}`, children: ['highlight' in styles && styles.highlight && (_jsx("div", { className: "text-center mb-3", children: _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-medium bg-plan-pro text-black", children: "Most popular" }) })), _jsx("div", { className: `inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${styles.badge}`, children: plan.label }), _jsxs("div", { className: "text-3xl font-bold text-white mb-4", children: [plan.price === 0 ? 'Free' : `$${plan.price}`, plan.price > 0 && _jsx("span", { className: "text-text-muted text-base font-normal", children: "/mo" })] }), _jsx("ul", { className: "space-y-2 mb-6 text-sm text-text-muted", children: plan.features.map((f) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "text-plan-free flex-shrink-0", children: "\u2713" }), f] }, f))) }), isCurrent ? (_jsx("div", { className: "w-full py-2.5 rounded-xl border border-white/10 text-text-muted text-sm text-center", children: "Current plan" })) : planId === 'free' ? (_jsx("div", { className: "w-full py-2.5 rounded-xl border border-white/10 text-text-muted text-sm text-center", children: "Free forever" })) : (_jsx("button", { onClick: () => handleUpgrade(planId), disabled: !!loading, className: `w-full py-2.5 rounded-xl font-medium text-sm transition-opacity disabled:opacity-50 ${planId === 'pro' ? 'bg-plan-pro text-black' : 'bg-plan-studio text-black'} hover:opacity-90`, children: loading === planId ? 'Redirecting...' : `Get ${plan.label}` }))] }, planId));
                        }) }), user && currentTier !== 'free' && (_jsx("div", { className: "text-center mt-8", children: _jsx("button", { onClick: handlePortal, disabled: loading === 'portal', className: "text-text-muted text-sm hover:text-white transition-colors underline", children: loading === 'portal' ? 'Loading...' : 'Manage billing / cancel subscription' }) }))] }), showAuth && _jsx(AuthModal, { onClose: () => setShowAuth(false) })] }));
}
