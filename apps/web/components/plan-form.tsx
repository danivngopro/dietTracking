"use client";
import type { Food, Meal, MealPlan } from "@diet/shared";
import { MealLabel } from "@diet/shared";
import { DateTime } from "luxon";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, jsonRequest } from "@/lib/api/client";
import { ErrorState, Field, Loading } from "./ui";
type Row = {
  source: string;
  quantity: string;
  plannedTime: string;
  mealLabel: string;
  notes: string;
};
export function PlanForm({ plan }: { plan?: MealPlan }) {
  const router = useRouter();
  const foods = useQuery({
    queryKey: ["foods", "all"],
    queryFn: () => apiFetch<Food[]>("/foods"),
  });
  const meals = useQuery({
    queryKey: ["meals"],
    queryFn: () => apiFetch<Meal[]>("/meals"),
  });
  const [name, setName] = useState(plan?.name ?? "Daily plan");
  const [date, setDate] = useState(plan?.date ?? DateTime.local().toISODate()!);
  const [rows, setRows] = useState<Row[]>(
    plan?.items.map((i) => ({
      source: `${i.foodId ? "food" : "meal"}:${i.foodId ?? i.mealId}`,
      quantity: i.quantity,
      plannedTime: i.plannedTime ?? "",
      mealLabel: i.mealLabel ?? "",
      notes: i.notes ?? "",
    })) ?? [
      { source: "", quantity: "1", plannedTime: "", mealLabel: "", notes: "" },
    ],
  );
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  if (foods.isLoading || meals.isLoading) return <Loading />;
  const options = [
    ...(foods.data ?? []).map((x) => ({
      source: `food:${x.id}`,
      label: `Food · ${x.name}`,
      calories: x.calories,
    })),
    ...(meals.data ?? []).map((x) => ({
      source: `meal:${x.id}`,
      label: `Meal · ${x.name}`,
      calories: x.calories,
    })),
  ];
  const total = rows.reduce(
    (sum, row) =>
      sum +
      Number(options.find((x) => x.source === row.source)?.calories ?? 0) *
        Number(row.quantity),
    0,
  );
  const change = (i: number, key: keyof Row, value: string) =>
    setRows((x) =>
      x.map((row, index) => (index === i ? { ...row, [key]: value } : row)),
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const items = rows.map(({ source, ...row }) => {
        const [kind, id] = source.split(":");
        return {
          ...row,
          plannedTime: row.plannedTime || undefined,
          mealLabel: row.mealLabel || undefined,
          notes: row.notes || undefined,
          [kind === "food" ? "foodId" : "mealId"]: id,
        };
      });
      await apiFetch(
        plan ? `/plans/${plan.id}` : "/plans",
        jsonRequest(plan ? "PATCH" : "POST", { name, date, items }),
      );
      router.push("/plans");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <Field label="Plan name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Date">
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>
      </section>
      <section className="card p-5">
        <div className="flex justify-between">
          <div>
            <h2 className="font-black">Planned items</h2>
            <p className="muted text-sm">
              Preview: {Math.round(total * 10) / 10} kcal
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setRows((x) => [
                ...x,
                {
                  source: "",
                  quantity: "1",
                  plannedTime: "",
                  mealLabel: "",
                  notes: "",
                },
              ])
            }
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <div className="mt-4 grid gap-4">
          {rows.map((row, i) => (
            <div className="rounded-xl border border-slate-200 p-3" key={i}>
              <div className="grid gap-2 md:grid-cols-[1fr_100px_130px_150px_44px]">
                <select
                  aria-label={`Source ${i + 1}`}
                  className="input"
                  value={row.source}
                  onChange={(e) => change(i, "source", e.target.value)}
                  required
                >
                  <option value="">Select food or meal</option>
                  {options.map((o) => (
                    <option key={o.source} value={o.source}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Quantity ${i + 1}`}
                  className="input"
                  value={row.quantity}
                  onChange={(e) => change(i, "quantity", e.target.value)}
                  required
                />
                <input
                  aria-label={`Time ${i + 1}`}
                  className="input"
                  type="time"
                  value={row.plannedTime}
                  onChange={(e) => change(i, "plannedTime", e.target.value)}
                />
                <select
                  aria-label={`Label ${i + 1}`}
                  className="input"
                  value={row.mealLabel}
                  onChange={(e) => change(i, "mealLabel", e.target.value)}
                >
                  <option value="">No label</option>
                  {Object.values(MealLabel).map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((x) => x.filter((_, index) => index !== i))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input
                aria-label={`Notes ${i + 1}`}
                className="input mt-2"
                placeholder="Notes (optional)"
                value={row.notes}
                onChange={(e) => change(i, "notes", e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>
      {Boolean(error) && <ErrorState error={error} />}
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save plan"}
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
