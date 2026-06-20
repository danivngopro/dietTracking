import type { ApiFailure, ApiSuccess } from '@diet/shared';
export class ApiError extends Error { constructor(public code: string, message: string, public details?: unknown, public status?: number) { super(message); } }
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init.headers } });
  const payload = await response.json().catch(() => null) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok) { const error = payload && 'error' in payload ? payload.error : { code: 'NETWORK_ERROR', message: 'Request failed' }; throw new ApiError(error.code, error.message, error.details, response.status); }
  return (payload as ApiSuccess<T>).data;
}
export const jsonRequest = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

