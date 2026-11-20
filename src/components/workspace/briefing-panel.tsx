"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import type { Briefing } from "@/lib/briefing";
import type { LocationSummary } from "@/lib/actor";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/cn";

interface BriefingResponse {
  locationName: string;
  shift: string;
  briefing: Briefing;
  error?: string;
}

/**
 * The shift briefing is generated on demand rather than on page load: it can
 * call an LLM, and a dashboard should not wait on a provider to render.
 */
export function BriefingPanel({ locations }: { locations: LocationSummary[] }) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BriefingResponse | null>(null);

  async function load() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/briefing?locationId=${encodeURIComponent(locationId)}`,
      );
      const payload = (await response.json()) as BriefingResponse;

      if (!response.ok) {
        setError(payload.error ?? "Could not build a briefing.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        {locations.length > 1 ? (
          <label className="min-w-48">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Site
            </span>
            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              className={cn(inputClass, "py-1.5")}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          type="button"
          onClick={load}
          disabled={busy || !locationId}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {data ? "Rebuild briefing" : "Build last shift briefing"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {data.briefing.headline}
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.briefing.bullets.map((bullet, index) => (
              <li key={index} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                {bullet}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            {data.briefing.source === "llm"
              ? `Written by ${data.briefing.model ?? "an LLM"} from the ${data.shift} shift data.`
              : `Rolled up from the ${data.shift} shift data (no LLM key configured).`}
            {data.briefing.fallbackReason
              ? ` LLM unavailable: ${data.briefing.fallbackReason}.`
              : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
