import { LogOut } from "lucide-react";

import { signOutAction } from "@/server/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </form>
  );
}
