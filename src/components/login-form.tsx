"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import { signInAction } from "@/server/actions/auth";
import { idleState } from "@/server/actions/shared";

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState(signInAction, idleState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase"
        >
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={defaultEmail}
          className={inputClass}
          placeholder="you@agency.org"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <FormMessage state={state} />

      <SubmitButton pendingLabel="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
