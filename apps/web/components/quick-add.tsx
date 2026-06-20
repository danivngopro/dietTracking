"use client";
import type { Food, Meal } from "@diet/shared";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, jsonRequest } from "@/lib/api/client";
import { useSession } from "@/lib/auth/use-session";
import { ErrorState, Field, Loading } from "./ui";
export function QuickAdd({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const session = useSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    kind: "food" | "meal";
    id: string;
    name: string;
    macros: { calories: string; protein: string; carbs: string; fat: string };
  }>();
  const [quantity, setQuantity] = useState("1");
  const [time, setTime] = useState(() =>
    DateTime.local().toFormat("yyyy-LL-dd'T'HH:mm"),
  );
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const foods = useQuery({
    queryKey: ["foods", search],
    queryFn: () =>
      apiFetch<Food[]>(`/foods?search=${encodeURIComponent(search)}`),
  });
  const meals = useQuery({
    queryKey: ["meals"],
    queryFn: () => apiFetch<Meal[]>("/meals"),
  });
  const options = useMemo(
    () => [
      ...(foods.data ?? []).map((x) => ({
        kind: "food" as const,
        id: x.id,
        name: x.name,
        subtitle: `${x.servingSize} ${x.servingUnit.toLowerCase()} · ${x.calories} kcal`,
        macros: x,
      })),
      ...(meals.data ?? [])
        .filter((x) => x.name.toLowerCase().includes(search.toLowerCase()))
        .map((x) => ({
          kind: "meal" as const,
          id: x.id,
          name: x.name,
          subtitle: `Meal · ${x.calories} kcal`,
          macros: x,
        })),
    ],
    [foods.data, meals.data, search],
  );
  const preview = selected
    ? Math.round(Number(selected.macros.calories) * Number(quantity) * 10) / 10
    : 0;
  const save = async () => {
    if (!selected || !session.data) return;
    setBusy(true);
    setError(undefined);
    try {
      const eatenAt = DateTime.fromISO(time, { zone: session.data.timezone })
        .toUTC()
        .toISO();
      await apiFetch(
        "/logs",
        jsonRequest("POST", {
          [selected.kind === "food" ? "foodId" : "mealId"]: selected.id,
          quantity,
          eatenAt,
        }),
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["dashboard", date] }),
        qc.invalidateQueries({ queryKey: ["logs", date] }),
      ]);
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-0 md:place-items-center md:p-4"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Add food or meal"
        className="card max-h-[92vh] w-full overflow-auto rounded-b-none p-5 md:max-w-xl md:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Add food or meal</h2>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {!selected ? (
          <div className="mt-5">
            <Field label="Search">
              <input
                autoFocus
                className="input"
                placeholder="Search foods and meals"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
            {foods.isLoading || meals.isLoading ? (
              <Loading />
            ) : (
              <div role="listbox" className="mt-3 grid gap-2">
                {options.map((option) => (
                  <button
                    role="option"
                    aria-selected="false"
                    key={`${option.kind}-${option.id}`}
                    className="rounded-xl border border-slate-200 p-3 text-left hover:border-green-500"
                    onClick={() => setSelected(option)}
                  >
                    <div className="flex justify-between gap-3">
                      <strong>{option.name}</strong>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold capitalize">
                        {option.kind}
                      </span>
                    </div>
                    <div className="muted mt-1 text-sm">{option.subtitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <button
              className="text-left text-sm font-bold text-green-700"
              onClick={() => setSelected(undefined)}
            >
              ← Change selection
            </button>
            <div className="card bg-green-50 p-4">
              <strong>{selected.name}</strong>
              <p className="muted text-sm capitalize">
                {selected.kind} · preview {preview} kcal
              </p>
            </div>
            <Field label="Quantity">
              <input
                className="input"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Time eaten">
              <input
                className="input"
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
          {Boolean(error) && <ErrorState error={error} />}
            <button
              className="btn btn-primary"
              disabled={busy || Number(quantity) <= 0}
              onClick={save}
            >
              {busy ? "Saving…" : "Save log"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
