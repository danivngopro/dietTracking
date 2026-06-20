'use client';
import type { PublicUser } from '@diet/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) => apiFetch<PublicUser>('/auth/me', {
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
    }),
    retry: false,
  });
}
