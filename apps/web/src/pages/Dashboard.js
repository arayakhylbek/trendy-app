import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { PLANS } from '@trendy/shared';
import { apiFetch } from '../lib/api';
import { useState } from 'react';
export function Dashboard() {
    const { user } = useAuth();
    const { data: currentUser } = useCurrentUser();
    const [portalLoading, setPortalLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);
    const isAdmin = user?.email === 'araiakhylbek78@gmail.com';
    const tier = currentUser?.tier ?? 'free';
    const plan = PLANS[tier];
    const used = currentUser?.generationsUsed ?? 0;
    const limit = plan.monthlyLimit === Infinity ? '∞' : plan.monthlyLimit;
    const pct = plan.monthlyLimit === Infinity ? 0 : Math.round((used / plan.monthlyLimit) * 100);
    async function handleAutoGenerate() {
        setGenerating(true);
        setLastGenerated(null);
        try {
            const { template } = await apiFetch('/api/generate-template', {
                method: 'POST',
            });
            setLastGenerated(template.label);
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setGenerating(false);
        }
    }
    async function handlePortal() {
        setPortalLoading(true);
        try {
            const { portalUrl } = await apiFetch('/api/billing/portal', {
                method: 'POST',
            });
            window.location.href = portalUrl;
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setPortalLoading(false);
        }
    }
    return (_jsxs("main", { className: "max-w-2xl mx-auto px-4 py-16", children: [_jsx("h1", { className: "font-display text-3xl text-white mb-8", children: "Dashboard" }), _jsxs("div", { className: "bg-surface rounded-2xl border border-surface-border p-6 mb-6", children: [_jsx("p", { className: "text-text-muted text-sm mb-1", children: "Account" }), _jsx("p", { className: "text-white font-medium", children: user?.email })] }), _jsxs("div", { className: "bg-surface rounded-2xl border border-surface-border p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("p", { className: "text-text-muted text-sm", children: "Current plan" }), _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-medium bg-accent2/20 text-accent2", children: plan.label })] }), _jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-text-muted", children: "Generations used" }), _jsxs("span", { className: "text-white", children: [used, " / ", limit] })] }), plan.monthlyLimit !== Infinity && (_jsx("div", { className: "h-1.5 bg-surface2 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-accent rounded-full transition-all", style: { width: `${pct}%` } }) }))] }), _jsx("div", { className: "flex gap-3 mt-4", children: tier === 'free' ? (_jsx(Link, { to: "/pricing", className: "flex-1 py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm text-center hover:opacity-90 transition-opacity", children: "Upgrade" })) : (_jsx("button", { onClick: handlePortal, disabled: portalLoading, className: "flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted text-sm hover:text-white transition-colors disabled:opacity-50", children: portalLoading ? 'Loading...' : 'Manage billing' })) })] }), isAdmin && (_jsxs("div", { className: "bg-surface rounded-2xl border border-surface-border p-6 mb-6", children: [_jsx("p", { className: "text-text-muted text-sm mb-3", children: "Admin" }), _jsx("button", { onClick: handleAutoGenerate, disabled: generating, className: "w-full py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50", children: generating ? 'Generating...' : 'Auto-generate template' }), lastGenerated && (_jsxs("p", { className: "text-text-muted text-xs mt-2 text-center", children: ["Added: \"", lastGenerated, "\""] }))] })), _jsx(Link, { to: "/", className: "text-accent text-sm hover:underline", children: "\u2190 Back to gallery" })] }));
}
