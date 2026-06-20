"use client";
import type { Food } from "@diet/shared";
import { ServingUnit } from "@diet/shared";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, jsonRequest } from "@/lib/api/client";
import { ErrorState, Field } from "./ui";
export function FoodForm({ food }: { food?: Food }) {
  const router = useRouter();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: food?.name ?? "",
    brand: food?.brand ?? "",
    servingSize: food?.servingSize ?? "100",
    servingUnit: food?.servingUnit ?? ServingUnit.GRAM,
    calories: food?.calories ?? "",
    protein: food?.protein ?? "",
    carbs: food?.carbs ?? "",
    fat: food?.fat ?? "",
    notes: food?.notes ?? "",
  });
  const update = (key: string, value: string) =>
    setForm((x) => ({ ...x, [key]: value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await apiFetch(
        food ? `/foods/${food.id}` : "/foods",
        jsonRequest(food ? "PATCH" : "POST", form),
      );
      router.push("/foods");
      router.refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card grid gap-4 p-5" onSubmit={submit}>
      <Field label="Name">
        <input
          className="input"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </Field>
      <Field label="Brand (optional)">
        <input
          className="input"
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Serving size">
          <input
            className="input"
            inputMode="decimal"
            value={form.servingSize}
            onChange={(e) => update("servingSize", e.target.value)}
            required
          />
        </Field>
        <Field label="Unit">
          <select
            className="input"
            value={form.servingUnit}
            onChange={(e) => update("servingUnit", e.target.value)}
          >
            {Object.values(ServingUnit).map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
          <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
            <input
              className="input"
              inputMode="decimal"
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              required
            />
          </Field>
        ))}
      </div>
      <Field label="Notes (optional)">
        <textarea
          className="input min-h-24"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>
      {Boolean(error) && <ErrorState error={error} />}
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save food"}
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
