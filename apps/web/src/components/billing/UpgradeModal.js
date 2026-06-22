import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PLANS } from '@trendy/shared';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
export function UpgradeModal({ onClose }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    async function handleUpgrade(planId) {
        if (!user)
            return;
        setLoading(planId);
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
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-lg bg-surface rounded-2xl border border-surface-border p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "font-display text-xl text-white", children: "Upgrade your plan" }), _jsx("button", { onClick: onClose, className: "text-text-muted hover:text-white transition-colors", children: "\u2715" })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-4", children: error }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: ['pro', 'studio'].map((planId) => {
                        const plan = PLANS[planId];
                        const isPro = planId === 'pro';
                        return (_jsxs("div", { className: `rounded-xl p-4 border ${isPro ? 'border-plan-pro/50 bg-plan-pro/5' : 'border-plan-studio/50 bg-plan-studio/5'}`, children: [_jsx("div", { className: `text-sm font-medium mb-1 ${isPro ? 'text-plan-pro' : 'text-plan-studio'}`, children: plan.label }), _jsxs("div", { className: "text-2xl font-bold text-white mb-3", children: ["$", plan.price, _jsx("span", { className: "text-text-muted text-sm font-normal", children: "/mo" })] }), _jsx("ul", { className: "text-text-muted text-xs space-y-1 mb-4", children: plan.features.map((f) => (_jsxs("li", { children: ["\u2713 ", f] }, f))) }), _jsx("button", { onClick: () => handleUpgrade(planId), disabled: !!loading, className: `w-full py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50 ${isPro ? 'bg-plan-pro text-black' : 'bg-plan-studio text-black'} hover:opacity-90`, children: loading === planId ? 'Redirecting...' : `Get ${plan.label}` })] }, planId));
                    }) }), _jsx("button", { onClick: onClose, className: "w-full mt-4 text-text-muted text-sm hover:text-white transition-colors", children: "Maybe later" })] }) }));
}
