'use client';
import type { MealPlan } from '@diet/shared';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, jsonRequest } from '@/lib/api/client';
import { EmptyState, ErrorState, Loading } from '@/components/ui';
export default function PlansPage(){const qc=useQueryClient();const plans=useQuery({queryKey:['plans'],queryFn:()=>apiFetch<MealPlan[]>('/plans')});const remove=useMutation({mutationFn:(id:string)=>apiFetch(`/plans/${id}`,jsonRequest('DELETE')),onSuccess:()=>qc.invalidateQueries({queryKey:['plans']})});return <><header className="mb-6 flex items-end justify-between"><div><h1 className="page-title">Plans</h1><p className="muted mt-2">One plan per calendar date.</p></div><Link className="btn btn-primary" href="/plans/new"><Plus size={18}/>New plan</Link></header>{remove.error&&<div className="mb-4"><ErrorState error={remove.error}/></div>}{plans.isLoading?<Loading/>:plans.error?<ErrorState error={plans.error}/>:plans.data?.length?<div className="grid gap-3">{plans.data.map(plan=><article className="card flex items-center gap-4 p-4" key={plan.id}><div className="min-w-0 flex-1"><strong>{plan.name}</strong><p className="muted mt-1 text-sm">{plan.date} · {plan.items.length} items · {plan.calories} kcal</p></div><Link className="btn btn-secondary" href={`/plans/${plan.id}/edit`}><Pencil size={16}/>Edit</Link><button className="btn btn-danger" onClick={()=>remove.mutate(plan.id)}><Trash2 size={16}/></button></article>)}</div>:<EmptyState title="No plans yet" body="Create a plan for a specific date."/>}</>}

