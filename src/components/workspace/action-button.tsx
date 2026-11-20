"use client";

import {
  Boxes,
  Check,
  Loader2,
  ScrollText,
  Sparkles,
  UserCog,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import {
  PROPOSAL_LABELS,
  type ActionProposal,
  type ActionProposalKind,
  type ClassifyResponse,
  type ConfirmResponse,
  type InventoryItemOption,
} from "@/lib/action/types";
import type { LocationSummary } from "@/lib/actor";

const ICONS: Record<ActionProposalKind, typeof Wrench> = {
  maintenance_ticket: Wrench,
  inventory_adjustment: Boxes,
  shift_log_note: ScrollText,
  case_manager_follow_up: UserCog,
};

interface DraftProposal {
  proposal: ActionProposal;
  allowed: boolean;
  requiredPermission: string;
  selected: boolean;
}

type Phase = "input" | "review" | "done";

const EXAMPLES = [
  "Heater in Dorm B is making a grinding noise and it's cold in there",
  "Down to 2 cases of body wash",
  "Bed 14 asked to see a case manager about replacing their state ID",
];

export function ActionButton({ locations }: { locations: LocationSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [drafts, setDrafts] = useState<DraftProposal[]>([]);
  const [applied, setApplied] = useState<ConfirmResponse["applied"]>([]);

  function reset() {
    setPhase("input");
    setText("");
    setError(null);
    setResult(null);
    setDrafts([]);
    setApplied([]);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function classify() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/action/classify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, locationId }),
      });
      const payload = (await response.json()) as ClassifyResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not read that. Try rewording it.");
        return;
      }

      setResult(payload);
      setDrafts(
        payload.proposals.map((item) => ({
          proposal: item.proposal,
          allowed: item.allowed,
          requiredPermission: item.requiredPermission,
          selected: item.allowed,
        })),
      );
      setPhase("review");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(keep: boolean) {
    if (!result) return;
    setBusy(true);
    setError(null);

    const proposals = keep
      ? drafts.filter((draft) => draft.selected && draft.allowed).map((d) => d.proposal)
      : [];

    try {
      const response = await fetch("/api/action/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId: result.submissionId, proposals }),
      });
      const payload = (await response.json()) as ConfirmResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not save those actions.");
        return;
      }

      setApplied(payload.applied);
      setPhase("done");
      router.refresh();
    } catch {
      setError("Network error. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  function updateProposal(index: number, patch: Partial<ActionProposal>) {
    setDrafts((current) =>
      current.map((draft, position) =>
        position === index
          ? {
              ...draft,
              proposal: { ...draft.proposal, ...patch } as ActionProposal,
              selected: true,
            }
          : draft,
      ),
    );
  }

  const selectedCount = drafts.filter((d) => d.selected && d.allowed).length;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700"
      >
        <Sparkles className="size-4" />
        Action Button
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close the Action Button"
        onClick={close}
        className="absolute inset-0 bg-slate-900/20"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="size-4 text-brand-600" />
              Action Button
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {phase === "input"
                ? "Describe what you saw. Nothing is saved until you confirm."
                : phase === "review"
                  ? "Review what this would write."
                  : "Saved."}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {phase === "input" ? (
            <div className="space-y-4">
              {locations.length > 1 ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Site
                  </span>
                  <select
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    className={inputClass}
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  What happened?
                </span>
                <textarea
                  autoFocus
                  rows={4}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Heater in Dorm B is making a grinding noise…"
                  className={cn(inputClass, "resize-y")}
                />
              </label>

              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Try one of these
                </p>
                <ul className="mt-2 space-y-1.5">
                  {EXAMPLES.map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        onClick={() => setText(example)}
                        className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 ring-1 ring-slate-200 ring-inset transition hover:bg-slate-100"
                      >
                        {example}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200 ring-inset">
                Do not type a resident&apos;s full name. Use a room, bed or
                initials — ActionOS does not store resident records yet.
              </p>
            </div>
          ) : null}

          {phase === "review" && result ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-slate-700 ring-1 ring-slate-200 ring-inset">
                <p>{result.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {result.classifier === "llm"
                    ? `Classified by ${result.model ?? "an LLM"}.`
                    : "Classified by the built-in keyword classifier (no LLM key configured)."}
                  {result.fallbackReason
                    ? ` LLM unavailable: ${result.fallbackReason}.`
                    : null}
                </p>
              </div>

              <ul className="space-y-3">
                {drafts.map((draft, index) => {
                  const Icon = ICONS[draft.proposal.kind];
                  return (
                    <li
                      key={`${draft.proposal.kind}-${index}`}
                      className={cn(
                        "rounded-xl border p-3.5",
                        draft.allowed
                          ? draft.selected
                            ? "border-brand-300 bg-brand-50/40"
                            : "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={draft.selected && draft.allowed}
                          disabled={!draft.allowed}
                          onChange={(event) =>
                            setDrafts((current) =>
                              current.map((item, position) =>
                                position === index
                                  ? { ...item, selected: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                          className="mt-1 size-4 rounded border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Icon className="size-4 text-slate-500" />
                            {PROPOSAL_LABELS[draft.proposal.kind]}
                          </p>

                          {!draft.allowed ? (
                            <p className="mt-1 text-xs text-rose-700">
                              Your role cannot save this ({draft.requiredPermission}).
                              A manager can.
                            </p>
                          ) : null}

                          {draft.proposal.rationale ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {draft.proposal.rationale}
                            </p>
                          ) : null}

                          <ProposalFields
                            proposal={draft.proposal}
                            disabled={!draft.allowed}
                            inventoryItems={result.inventoryItems}
                            onChange={(patch) => updateProposal(index, patch)}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {phase === "done" ? (
            <div className="space-y-3">
              {applied.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-slate-600 ring-1 ring-slate-200 ring-inset">
                  Discarded. Nothing was written, but the submission is in the
                  audit log.
                </p>
              ) : (
                <ul className="space-y-2">
                  {applied.map((record) => (
                    <li
                      key={`${record.kind}-${record.id}`}
                      className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900"
                    >
                      <Check className="mt-0.5 size-4 shrink-0" />
                      <span>
                        <strong className="font-semibold">{record.label}</strong>{" "}
                        — {record.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
          {phase === "input" ? (
            <>
              <p className="text-xs text-slate-500">
                {locations.length === 0
                  ? "You are not assigned to a site yet."
                  : "Step 1 of 2"}
              </p>
              <button
                type="button"
                disabled={busy || text.trim().length < 5 || !locationId}
                onClick={classify}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-brand-300"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                See what this would do
              </button>
            </>
          ) : null}

          {phase === "review" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => confirm(false)}
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
              >
                Discard all
              </button>
              <button
                type="button"
                disabled={busy || selectedCount === 0}
                onClick={() => confirm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-brand-300"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirm {selectedCount} action{selectedCount === 1 ? "" : "s"}
              </button>
            </>
          ) : null}

          {phase === "done" ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
              >
                Log something else
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function ProposalFields({
  proposal,
  disabled,
  inventoryItems,
  onChange,
}: {
  proposal: ActionProposal;
  disabled: boolean;
  inventoryItems: InventoryItemOption[];
  onChange: (patch: Partial<ActionProposal>) => void;
}) {
  const field = cn(inputClass, "mt-1 text-sm");

  switch (proposal.kind) {
    case "maintenance_ticket":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs text-slate-500">Title</span>
            <input
              value={proposal.title}
              disabled={disabled}
              onChange={(event) => onChange({ title: event.target.value })}
              className={field}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Area</span>
            <input
              value={proposal.area ?? ""}
              disabled={disabled}
              placeholder="Dorm B"
              onChange={(event) => onChange({ area: event.target.value })}
              className={field}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Priority</span>
            <select
              value={proposal.priority}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  priority: event.target.value as typeof proposal.priority,
                })
              }
              className={field}
            >
              {["low", "medium", "high", "urgent"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      );

    case "inventory_adjustment":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="text-xs text-slate-500">Item</span>
            <select
              value={proposal.itemName}
              disabled={disabled}
              onChange={(event) => onChange({ itemName: event.target.value })}
              className={field}
            >
              {!inventoryItems.some((item) => item.name === proposal.itemName) ? (
                <option value={proposal.itemName}>
                  {proposal.itemName} (not an item at this site)
                </option>
              ) : null}
              {inventoryItems.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} — {item.quantity} {item.unit} on hand
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-slate-500">Change</span>
            <select
              value={proposal.adjustmentType}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  adjustmentType: event.target
                    .value as typeof proposal.adjustmentType,
                })
              }
              className={field}
            >
              <option value="delta">Add / subtract</option>
              <option value="set">Set new count</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-slate-500">Amount</span>
            <input
              type="number"
              value={proposal.amount}
              disabled={disabled}
              onChange={(event) =>
                onChange({ amount: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={field}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Reason</span>
            <input
              value={proposal.reason}
              disabled={disabled}
              onChange={(event) => onChange({ reason: event.target.value })}
              className={field}
            />
          </label>
        </div>
      );

    case "shift_log_note":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs text-slate-500">Note</span>
            <textarea
              rows={2}
              value={proposal.body}
              disabled={disabled}
              onChange={(event) => onChange({ body: event.target.value })}
              className={cn(field, "resize-y")}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Category</span>
            <select
              value={proposal.category}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  category: event.target.value as typeof proposal.category,
                })
              }
              className={field}
            >
              {[
                "general",
                "incident",
                "maintenance",
                "inventory",
                "resident_support",
                "handoff",
              ].map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-slate-500">Severity</span>
            <select
              value={proposal.severity}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  severity: event.target.value as typeof proposal.severity,
                })
              }
              className={field}
            >
              {["info", "attention", "urgent"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      );

    case "case_manager_follow_up":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs text-slate-500">
              Subject (room, bed or initials)
            </span>
            <input
              value={proposal.subject}
              disabled={disabled}
              onChange={(event) => onChange({ subject: event.target.value })}
              className={field}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-slate-500">Details</span>
            <textarea
              rows={2}
              value={proposal.details ?? ""}
              disabled={disabled}
              onChange={(event) => onChange({ details: event.target.value })}
              className={cn(field, "resize-y")}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Urgency</span>
            <select
              value={proposal.urgency}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  urgency: event.target.value as typeof proposal.urgency,
                })
              }
              className={field}
            >
              {["routine", "soon", "urgent"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
  }
}
