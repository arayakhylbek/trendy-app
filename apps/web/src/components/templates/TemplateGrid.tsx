import type { Template } from '@trendy/shared';
import { TemplateCard } from './TemplateCard';

interface Props {
  templates: Template[];
  onSelect: (template: Template) => void;
}

export function TemplateGrid({ templates, onSelect }: Props) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-20 text-text-muted">
        <p className="text-4xl mb-4">✨</p>
        <p>No templates found for this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((t) => (
        <TemplateCard key={t.id ?? t.label} template={t} onSelect={onSelect} />
      ))}
    </div>
  );
}
