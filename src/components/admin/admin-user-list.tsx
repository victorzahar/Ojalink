import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { users } from "@/lib/db/schema";

type AdminUser = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "email" | "role" | "createdAt"
>;

type AdminUserListProps = {
  users: AdminUser[];
};

export function AdminUserList({ users: accounts }: AdminUserListProps) {
  const accountLabel = accounts.length === 1 ? "account" : "accounts";

  return (
    <Card>
      <CardHeader>
        <CardTitle>User accounts</CardTitle>
        <CardDescription>
          {accounts.length} {accountLabel} in OjaLink. This list is read-only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p
            className="rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground"
            role="status"
          >
            No user accounts to show yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <li
                className="min-w-0 rounded-lg border border-border bg-background p-4"
                key={account.id}
              >
                <div className="min-w-0">
                  <h3 className="break-words font-medium text-foreground">
                    {account.name}
                  </h3>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="mt-1 font-medium capitalize text-foreground">
                      {account.role}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      <time dateTime={account.createdAt.toISOString()}>
                        {new Intl.DateTimeFormat("en-NG", {
                          dateStyle: "medium",
                          timeZone: "Africa/Lagos",
                        }).format(account.createdAt)}
                      </time>
                    </dd>
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
