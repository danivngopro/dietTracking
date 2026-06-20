import { LoaderCircle } from 'lucide-react';
export function Loading({ label='Loading' }: { label?: string }) { return <div className="muted flex items-center gap-2 py-8"><LoaderCircle className="animate-spin" size={18}/>{label}</div>; }
export function ErrorState({ error }: { error: unknown }) { return <div role="alert" className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error instanceof Error ? error.message : 'Something went wrong'}</div>; }
export function EmptyState({ title, body }: { title:string; body:string }) { return <div className="card p-8 text-center"><h3 className="font-bold">{title}</h3><p className="muted mt-2 text-sm">{body}</p></div>; }
export function Field({ label, children }: { label:string; children:React.ReactNode }) { return <label className="label"><span>{label}</span>{children}</label>; }

