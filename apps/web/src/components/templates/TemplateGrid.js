import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TemplateCard } from './TemplateCard';
export function TemplateGrid({ templates, onSelect }) {
    if (templates.length === 0) {
        return (_jsxs("div", { className: "text-center py-20 text-text-muted", children: [_jsx("p", { className: "text-4xl mb-4", children: "\u2728" }), _jsx("p", { children: "No templates found for this category." })] }));
    }
    return (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: templates.map((t) => (_jsx(TemplateCard, { template: t, onSelect: onSelect }, t.id ?? t.label))) }));
}
