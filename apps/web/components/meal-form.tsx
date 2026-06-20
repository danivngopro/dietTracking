"use client";
import type { Food, Meal } from "@diet/shared";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, jsonRequest } from "@/lib/api/client";
import { ErrorState, Field, Loading } from "./ui";
export function MealForm({ meal }: { meal?: Meal }) {
  const router = useRouter();
  const foods = useQuery({
    queryKey: ["foods", "all"],
    queryFn: () => apiFetch<Food[]>("/foods"),
  });
  const [name, setName] = useState(meal?.name ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [items, setItems] = useState(
    meal?.items.map((i) => ({ foodId: i.food.id, quantity: i.quantity })) ?? [
      { foodId: "", quantity: "1" },
    ],
  );
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  if (foods.isLoading) return <Loading />;
  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(foods.data?.find((f) => f.id === item.foodId)?.calories ?? 0) *
        Number(item.quantity),
    0,
  );
  const change = (index: number, key: "foodId" | "quantity", value: string) =>
    setItems((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await apiFetch(
        meal ? `/meals/${meal.id}` : "/meals",
        jsonRequest(meal ? "PATCH" : "POST", { name, description, items }),
      );
      router.push("/meals");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <section className="card grid gap-4 p-5">
        <Field label="Meal name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </section>
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black">Foods</h2>
            <p className="muted text-sm">
              Preview: {Math.round(total * 10) / 10} kcal
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setItems((x) => [...x, { foodId: "", quantity: "1" }])
            }
          >
            <Plus size={16} />
            Add row
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <div className="grid grid-cols-[1fr_110px_44px] gap-2" key={index}>
              <select
                aria-label={`Food ${index + 1}`}
                className="input"
                value={item.foodId}
                onChange={(e) => change(index, "foodId", e.target.value)}
                required
              >
                <option value="">Select food</option>
                {foods.data?.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} · {food.calories} kcal
                  </option>
                ))}
              </select>
              <input
                aria-label={`Quantity ${index + 1}`}
                className="input"
                inputMode="decimal"
                value={item.quantity}
                onChange={(e) => change(index, "quantity", e.target.value)}
                required
              />
              <button
                type="button"
                aria-label="Remove row"
                className="btn btn-danger"
                disabled={items.length === 1}
                onClick={() => setItems((x) => x.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
      {Boolean(error) && <ErrorState error={error} />}
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save meal"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
