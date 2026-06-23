import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TemplateCard({ template, onSelect }) {
    return (_jsxs("div", { className: "relative group cursor-pointer rounded-2xl overflow-hidden bg-surface border border-surface-border hover:border-white/20 transition-all hover:scale-[1.02]", style: { aspectRatio: '3/4' }, onClick: () => onSelect(template), children: [template.image ? (_jsx("img", { src: template.image, alt: template.label, className: "w-full h-full object-cover", loading: "lazy" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface2 text-6xl", children: template.emoji })), template.isTrending && (_jsx("div", { className: "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-accent/90 text-white", children: "\uD83D\uDD25 Trend" })), template.isNew && !template.isTrending && (_jsx("div", { className: "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-accent3/90 text-black", children: "NEW" })), template.isPro && (_jsx("div", { className: "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-plan-pro/90 text-black", children: "PRO" })), _jsx("div", { style: {
                    position: 'absolute', bottom: 40, right: 10,
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontStyle: 'italic', fontWeight: 700, fontSize: 13,
                    background: 'linear-gradient(to right, #f472b6, #a78bfa, #93c5fd)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', opacity: 0.45, pointerEvents: 'none',
                    userSelect: 'none',
                }, children: "Trendy" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4", children: _jsxs("button", { className: "px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5", children: ["Try this", _jsx("span", { style: {
                                fontFamily: '"Playfair Display", Georgia, serif',
                                fontStyle: 'italic', fontWeight: 700,
                                background: 'linear-gradient(to right, #f472b6, #a78bfa, #93c5fd)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }, children: "Trendy" })] }) }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity", children: _jsx("p", { className: "text-white text-sm font-medium truncate", children: template.label }) })] }));
}
