'use client';
import type { Meal } from '@diet/shared';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { MealForm } from '@/components/meal-form';
import { ErrorState, Loading } from '@/components/ui';
export default function EditMealPage(){const {id}=useParams<{id:string}>();const query=useQuery({queryKey:['meal',id],queryFn:()=>apiFetch<Meal>(`/meals/${id}`)});if(query.isLoading)return <Loading/>;if(query.error)return <ErrorState error={query.error}/>;return <><header className="mb-6"><h1 className="page-title">Edit meal</h1></header><MealForm meal={query.data}/></>}
