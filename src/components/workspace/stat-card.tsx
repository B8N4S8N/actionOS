import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const tones = {
    neutral: "border-slate-200",
    warning: "border-amber-300",
    danger: "border-rose-300",
    success: "border-emerald-300",
  } as const;

  const valueTones = {
    neutral: "text-slate-900",
    warning: "text-amber-700",
    danger: "text-rose-700",
    success: "text-emerald-700",
  } as const;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white px-4 py-3.5 shadow-sm",
        tones[tone],
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-bold tracking-tight", valueTones[tone])}>
        {value}
      </p>
      {detail ? <p className="mt-0.5 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}
