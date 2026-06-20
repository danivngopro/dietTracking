'use client';
import type { Food } from '@diet/shared';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { FoodForm } from '@/components/food-form';
import { ErrorState, Loading } from '@/components/ui';
export default function EditFoodPage(){const {id}=useParams<{id:string}>();const query=useQuery({queryKey:['foods','all'],queryFn:()=>apiFetch<Food[]>('/foods')});if(query.isLoading)return <Loading/>;if(query.error)return <ErrorState error={query.error}/>;const food=query.data?.find(x=>x.id===id);if(!food)return <ErrorState error={new Error('Food not found')}/>;return <><header className="mb-6"><h1 className="page-title">Edit food</h1></header><FoodForm food={food}/></>}
