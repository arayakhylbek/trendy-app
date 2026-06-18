import { auth } from './firebase';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText } }));
    const err = body.error ?? body;
    throw new ApiError(err.code ?? 'API_ERROR', err.message ?? 'Request failed', res.status);
  }

  return res.json() as Promise<T>;
}
