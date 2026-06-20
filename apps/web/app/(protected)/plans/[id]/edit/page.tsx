'use client';
import type { MealPlan } from '@diet/shared';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { PlanForm } from '@/components/plan-form';
import { ErrorState, Loading } from '@/components/ui';
export default function EditPlanPage(){const {id}=useParams<{id:string}>();const query=useQuery({queryKey:['plan',id],queryFn:()=>apiFetch<MealPlan>(`/plans/${id}`)});if(query.isLoading)return <Loading/>;if(query.error)return <ErrorState error={query.error}/>;return <><header className="mb-6"><h1 className="page-title">Edit plan</h1></header><PlanForm plan={query.data}/></>}
