import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Template } from '@trendy/shared';

export function useTemplates(cat?: string) {
  const params = cat && cat !== 'all' ? `?cat=${encodeURIComponent(cat)}` : '';
  return useQuery({
    queryKey: ['templates', cat ?? 'all'],
    queryFn: () =>
      apiFetch<{ templates: Template[] }>(`/api/templates${params}`).then((r) => r.templates),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () =>
      apiFetch<{ template: Template }>(`/api/templates/${id}`).then((r) => r.template),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
