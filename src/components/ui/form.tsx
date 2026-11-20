"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/cn";
import type { FormState } from "@/server/actions/shared";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-slate-100";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const variants = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
    secondary:
      "bg-white text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  } as const;

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" && !state.message) return null;

  const tone =
    state.status === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : state.status === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <p
      role="status"
      className={cn("rounded-lg border px-3 py-2 text-sm", tone)}
    >
      {state.message}
    </p>
  );
}
