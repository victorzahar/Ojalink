"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userRoles, type UserRole } from "@/lib/auth/role-home";
import type { users } from "@/lib/db/schema";

type AdminUser = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "email" | "phone" | "role" | "createdAt"
>;

type RoleFilter = "all" | UserRole;

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminUserList({ users: accounts }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const searchTerm = search.trim().toLowerCase();

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      searchTerm.length === 0 ||
      `${account.name} ${account.email} ${account.phone ?? ""}`
        .toLowerCase()
        .includes(searchTerm);
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const countLabel = filteredAccounts.length === 1 ? "user" : "users";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>User accounts</CardTitle>
          <CardDescription>
            {filteredAccounts.length} {countLabel} shown. This list is read-only.
          </CardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="user-search" className="text-sm font-medium text-foreground">
              Search users
            </label>
            <input
              id="user-search"
              type="search"
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder="Name, email or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="user-role-filter" className="text-sm font-medium text-foreground">
              Filter by role
            </label>
            <select
              id="user-role-filter"
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="all">All roles</option>
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {role[0].toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAccounts.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            {accounts.length === 0
              ? "No user accounts to show yet."
              : "No users match this search and role filter."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAccounts.map((account) => (
              <li
                className="min-w-0 rounded-lg border border-border bg-background p-4"
                key={account.id}
              >
                <div className="min-w-0">
                  <h3 className="break-words font-medium text-foreground">
                    {account.name}
                  </h3>
                  <p className="mt-1 break-all text-base text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-border pt-3 text-base">
                  <div className="min-w-0">
                    <dt className="text-sm text-muted-foreground">Phone</dt>
                    <dd className="mt-1 break-all font-medium text-foreground">
                      {account.phone || "Not provided"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-muted-foreground">Role</dt>
                      <dd className="mt-1 font-medium capitalize text-foreground">
                        {account.role}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        <time dateTime={account.createdAt.toISOString()}>
                          {formatCreatedDate(account.createdAt)}
                        </time>
                      </dd>
                    </div>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
