import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requireRole } from "@/lib/auth/guard";

const adminSections = [
  {
    href: "/admin/vendors",
    label: "Vendor approvals",
    description: "Review vendors waiting for approval.",
  },
  {
    href: "/admin/disputes",
    label: "Disputes",
    description: "Review reports about OjaLink orders.",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Find and inspect user accounts.",
  },
  {
    href: "/admin/stats",
    label: "Stats",
    description: "Review OjaLink platform activity.",
  },
];

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Admin area · OjaLink",
  description: "Your OjaLink admin area: vendors, disputes and stats.",
};

export default async function AdminPage() {
  await requireRole("admin");

  return (
    <AdminPageShell
      title="Admin area"
      description="Manage OjaLink vendors, disputes, users and platform activity."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {adminSections.map((section) => (
          <li key={section.href}>
            <Link
              className="block h-full rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline"
              href={section.href}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {section.label}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {section.description}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">
                Open section
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminPageShell>
  );
}
