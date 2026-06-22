import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
export function useTemplates(cat) {
    const params = cat && cat !== 'all' ? `?cat=${encodeURIComponent(cat)}` : '';
    return useQuery({
        queryKey: ['templates', cat ?? 'all'],
        queryFn: () => apiFetch(`/api/templates${params}`).then((r) => r.templates),
        staleTime: 5 * 60 * 1000,
    });
}
export function useTemplate(id) {
    return useQuery({
        queryKey: ['template', id],
        queryFn: () => apiFetch(`/api/templates/${id}`).then((r) => r.template),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}
