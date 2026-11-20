"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export function WorkspaceNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href as "/dashboard"}
            aria-current={active ? "page" : undefined}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-slate-800 font-semibold text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
            )}
          >
            {item.label}
            <span className="block text-xs font-normal text-slate-400">
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
