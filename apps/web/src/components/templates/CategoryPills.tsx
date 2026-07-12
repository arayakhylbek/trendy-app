const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'sports', label: '🏆 Sports' },
  { id: 'leisure', label: '🌴 Leisure' },
  { id: 'meme', label: '😂 Memes' },
  { id: 'kdrama', label: 'K-Drama' },
  { id: 'aesthetic', label: 'Aesthetic' },
];

interface Props {
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryPills({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`
            whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              active === cat.id
                ? 'bg-gradient-accent text-black'
                : 'bg-surface border border-surface-border text-text-muted hover:text-white hover:border-white/20'
            }
          `}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
