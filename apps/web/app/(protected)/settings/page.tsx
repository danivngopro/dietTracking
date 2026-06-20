'use client';

import type { MacroTarget, PublicUser } from '@diet/shared';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, jsonRequest } from '@/lib/api/client';
import { useSession } from '@/lib/auth/use-session';
import { ErrorState, Field, Loading } from '@/components/ui';

function SettingsForm({ target, user }: { target: MacroTarget | null; user: PublicUser }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    calories: target?.calories ?? '2200', protein: target?.protein ?? '160', carbs: target?.carbs ?? '220', fat: target?.fat ?? '70',
    currentWeight: target?.currentWeight ?? '', goalWeight: target?.goalWeight ?? '', notes: target?.notes ?? '',
  });
  const [timezone, setTimezone] = useState(user.timezone);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: async () => {
      await apiFetch('/targets', jsonRequest('PUT', { ...form, currentWeight: form.currentWeight || undefined, goalWeight: form.goalWeight || undefined, notes: form.notes || undefined }));
      await apiFetch('/me', jsonRequest('PATCH', { timezone }));
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['targets'] }), qc.invalidateQueries({ queryKey: ['session'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
  return <section className="card grid max-w-3xl gap-4 p-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => <Field key={key} label={key[0].toUpperCase() + key.slice(1)}><input className="input" inputMode="decimal" value={form[key]} onChange={(event) => update(key, event.target.value)} /></Field>)}</div>
    <div className="grid gap-3 md:grid-cols-2"><Field label="Current weight (optional)"><input className="input" value={form.currentWeight} onChange={(event) => update('currentWeight', event.target.value)} /></Field><Field label="Goal weight (optional)"><input className="input" value={form.goalWeight} onChange={(event) => update('goalWeight', event.target.value)} /></Field></div>
    <Field label="Timezone"><input className="input" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Jerusalem" /></Field>
    <Field label="Notes"><textarea className="input min-h-24" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></Field>
    {save.error && <ErrorState error={save.error} />}{save.isSuccess && <p className="text-sm font-bold text-green-700">Settings saved.</p>}
    <button className="btn btn-primary w-fit" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save settings'}</button>
  </section>;
}

export default function SettingsPage() {
  const session = useSession();
  const target = useQuery({ queryKey: ['targets'], queryFn: () => apiFetch<MacroTarget | null>('/targets'), enabled: Boolean(session.data) });
  if (session.isLoading || target.isLoading) return <Loading />;
  if (session.error || target.error) return <ErrorState error={session.error ?? target.error} />;
  return <><header className="mb-6"><h1 className="page-title">Settings</h1><p className="muted mt-2">Daily targets and timezone.</p></header><SettingsForm key={`${session.data!.timezone}-${target.data?.calories ?? 'new'}`} target={target.data ?? null} user={session.data!} /></>;
}
