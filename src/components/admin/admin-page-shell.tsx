import type { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AdminPageShell({
  title,
  description,
  children,
  action,
}: AdminPageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">OjaLink admin</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </main>
  );
}
