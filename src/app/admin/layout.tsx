import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";

const adminSections = [
  { href: "/admin/vendors", label: "Vendor approvals" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/stats", label: "Stats" },
];

export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link
            className="inline-flex min-h-11 items-center rounded-md text-lg font-bold text-primary focus-visible:outline"
            href="/admin"
          >
            OjaLink Admin
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <nav aria-label="Admin sections">
              <ul className="flex flex-wrap gap-2">
                {adminSections.map((section) => (
                  <li key={section.href}>
                    <Link
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline"
                      href={section.href}
                    >
                      {section.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <LogoutButton className="w-full sm:w-auto" />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
