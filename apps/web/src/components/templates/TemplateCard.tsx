import type { Template } from '@trendy/shared';

interface Props {
  template: Template;
  onSelect: (template: Template) => void;
}

export function TemplateCard({ template, onSelect }: Props) {
  return (
    <div
      className="relative group cursor-pointer rounded-2xl overflow-hidden bg-surface border border-surface-border hover:border-white/20 transition-all hover:scale-[1.02]"
      style={{ aspectRatio: '3/4' }}
      onClick={() => onSelect(template)}
    >
      {template.image ? (
        <img
          src={template.image}
          alt={template.label}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface2 text-6xl">
          {template.emoji}
        </div>
      )}

      {template.isTrending && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-accent/90 text-white">
          🔥 Trend
        </div>
      )}
      {template.isNew && !template.isTrending && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-accent3/90 text-black">
          NEW
        </div>
      )}
      {template.isPro && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-plan-pro/90 text-black">
          PRO
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
        <button className="px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
          Try this ✦
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity">
        <p className="text-white text-sm font-medium truncate">{template.label}</p>
      </div>
    </div>
  );
}
