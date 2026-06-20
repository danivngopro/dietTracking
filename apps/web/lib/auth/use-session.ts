'use client';
import type { PublicUser } from '@diet/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
export function useSession() { return useQuery({ queryKey: ['session'], queryFn: () => apiFetch<PublicUser>('/auth/me'), retry: false }); }

