const KEY = 'laze_token';
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && path !== 'login') {
        setToken(null);
        window.location.reload();
    }
    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok) {
        const first = data.errors ? (Object.values(data.errors)[0] as string[])[0] : data.message;
        throw new Error(first ?? 'Request failed');
    }
    return data as T;
}

export const peso = (n: number) =>
    '₱' + Number(n ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });
