import type { ApiFailure, ApiSuccess } from '@diet/shared';

export class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Default to a same-origin path so the Next.js rewrite proxy handles it (first-party cookies, no CORS).
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, credentials: 'include', headers });
  } catch (error) {
    throw new ApiError(
      'NETWORK_ERROR',
      error instanceof Error ? `Could not reach the API: ${error.message}` : 'Could not reach the API',
    );
  }

  const text = await response.text();
  let payload: ApiSuccess<T> | ApiFailure | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiSuccess<T> | ApiFailure;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = payload && 'error' in payload ? payload.error : undefined;
    throw new ApiError(
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details,
      response.status,
    );
  }

  if (!payload || !('data' in payload)) {
    throw new ApiError('INVALID_RESPONSE', 'The API returned an invalid response');
  }

  return payload.data;
}

export function jsonRequest(method: string, body?: unknown): RequestInit {
  return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
}
