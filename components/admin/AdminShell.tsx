"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/lib/admin/actions";
import { PRODUCT_NAME } from "@/lib/branding";

interface AdminShellProps {
  fdaPending: number;
  communityPending: number;
  children: ReactNode;
}

export function AdminShell({
  fdaPending,
  communityPending,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/admin/fda-reports",
      label: "FDA Reports",
      count: fdaPending,
      active: pathname.startsWith("/admin/fda-reports"),
    },
    {
      href: "/admin/community-requests",
      label: "Community Requests",
      count: communityPending,
      active: pathname.startsWith("/admin/community-requests"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-baseline gap-2">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--ink)] hover:underline"
            >
              {PRODUCT_NAME}
            </Link>
            <span className="text-[var(--border-strong)]">/</span>
            <span className="text-sm font-medium text-[var(--accent)]">
              Admin
            </span>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              Logout
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${
                tab.active
                  ? "border-[var(--accent)] font-medium text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-xs tabular-nums text-[var(--muted)]">
                {tab.count}
              </span>
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
