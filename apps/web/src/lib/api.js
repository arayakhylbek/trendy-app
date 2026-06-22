import { auth } from './firebase';
export class ApiError extends Error {
    code;
    status;
    constructor(code, message, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'ApiError';
    }
}
async function getIdToken() {
    const user = auth.currentUser;
    if (!user)
        return null;
    return user.getIdToken();
}
export async function apiFetch(path, init) {
    const token = await getIdToken();
    const headers = {
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
    return res.json();
}
