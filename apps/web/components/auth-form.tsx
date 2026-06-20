'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, jsonRequest } from '@/lib/api/client';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/auth/${mode}`, jsonRequest('POST', { email, password }));
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      router.replace('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const signup = mode === 'signup';

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card w-full max-w-md p-7">
        <div className="mb-7">
          <div className="text-xl font-black text-green-700">NourishTrack</div>
          <h1 className="page-title mt-5">{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted mt-2 text-sm">
            {signup ? 'Start tracking your nutrition with less friction.' : 'Log in to continue your daily tracking.'}
          </p>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="label">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={signup ? 10 : 1}
              autoComplete={signup ? 'new-password' : 'current-password'}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="muted mt-5 text-center text-sm">
          {signup ? 'Already have an account? ' : 'New here? '}
          <Link className="font-bold text-green-700" href={signup ? '/login' : '/signup'}>
            {signup ? 'Log in' : 'Create account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
