import { jsx as _jsx } from "react/jsx-runtime";
const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'couple', label: '💑 Couples' },
    { id: 'carfit', label: '🚗 Car Fit' },
    { id: 'kdrama', label: 'K-Drama' },
    { id: 'gossipgirl', label: 'Gossip Girl' },
    { id: 'anime', label: 'Anime' },
    { id: 'aesthetic', label: 'Aesthetic' },
    { id: 'vintage', label: 'Vintage' },
];
export function CategoryPills({ active, onChange }) {
    return (_jsx("div", { className: "flex gap-2 overflow-x-auto pb-2 scrollbar-hide", children: CATEGORIES.map((cat) => (_jsx("button", { onClick: () => onChange(cat.id), className: `
            whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all
            ${active === cat.id
                ? 'bg-gradient-accent text-black'
                : 'bg-surface border border-surface-border text-text-muted hover:text-white hover:border-white/20'}
          `, children: cat.label }, cat.id))) }));
}
