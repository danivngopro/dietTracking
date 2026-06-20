'use client';
import { type ReactNode, useEffect } from 'react';
import { BarChart3, CalendarDays, CookingPot, LayoutDashboard, ListPlus, LogOut, Settings, Utensils } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, jsonRequest } from '@/lib/api/client';
import { useSession } from '@/lib/auth/use-session';
import { Loading } from './ui';
const links = [
  ['/dashboard','Dashboard',LayoutDashboard], ['/log','Log',ListPlus], ['/foods','Foods',Utensils], ['/meals','Meals',CookingPot], ['/plans','Plans',CalendarDays], ['/settings','Settings',Settings],
] as const;
export function AppShell({ children }: { children:ReactNode }) {
  const session=useSession(); const path=usePathname(); const router=useRouter(); const query=useQueryClient();
  useEffect(()=>{ if(session.isError) router.replace('/login'); },[session.isError,router]);
  if(session.isLoading) return <main className="mx-auto max-w-lg p-8"><Loading label="Loading your account"/></main>;
  if(session.isError||!session.data) return <main className="grid min-h-screen place-items-center p-4"><section className="card max-w-md p-6 text-center"><h1 className="text-xl font-black">Your session could not be loaded</h1><p className="muted mt-2 text-sm">The app is returning you to login. If it does not redirect, use the link below.</p><Link className="btn btn-primary mt-5" href="/login">Go to login</Link></section></main>;
  const logout=async()=>{await apiFetch('/auth/logout',jsonRequest('POST'));query.clear();router.replace('/login');};
  const nav=<>{links.map(([href,label,Icon])=><Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${path.startsWith(href)?'bg-green-100 text-green-800':'text-slate-600 hover:bg-slate-100'}`}><Icon size={19}/><span className="md:inline">{label}</span></Link>)}</>;
  return <div className="min-h-screen md:grid md:grid-cols-[228px_1fr]"><aside className="hidden border-r border-slate-200 bg-white p-4 md:flex md:flex-col"><Link href="/dashboard" className="mb-7 flex items-center gap-2 px-2 text-xl font-black text-green-700"><BarChart3/>NourishTrack</Link><nav className="grid gap-1">{nav}</nav><button className="btn btn-secondary mt-auto" onClick={logout}><LogOut size={17}/>Log out</button></aside><main className="min-w-0 p-4 md:p-8"><div className="mx-auto max-w-6xl">{children}</div></main><nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-slate-200 bg-white p-1 md:hidden">{links.map(([href,label,Icon])=><Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold ${path.startsWith(href)?'text-green-700':'text-slate-500'}`}><Icon size={19}/>{label}</Link>)}</nav></div>;
}
