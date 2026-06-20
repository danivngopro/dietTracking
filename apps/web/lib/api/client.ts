import type { ApiFailure, ApiSuccess } from '@diet/shared';
export class ApiError extends Error { constructor(public code: string, message: string, public details?: unknown, public status?: number) { super(message); } }
// Default to a same-origin path so the Next.js rewrite proxy handles it (first-party cookies, no CORS).
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api';
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: 'include', headers });
  const payload = await response.json().catch(() => null) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok) { const error = payload && 'error' in payload ? payload.error : { code: 'NETWORK_ERROR', message: 'Request failed' }; throw new ApiError(error.code, error.message, error.details, response.status); }
  return (payload as ApiSuccess<T>).data;
}
export const jsonRequest = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
