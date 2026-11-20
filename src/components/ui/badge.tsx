import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: string): BadgeTone {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "low":
      return "neutral";
    default:
      return "brand";
  }
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case "urgent":
      return "danger";
    case "attention":
      return "warning";
    default:
      return "neutral";
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "blocked":
      return "danger";
    case "in_progress":
    case "acknowledged":
      return "brand";
    default:
      return "warning";
  }
}
