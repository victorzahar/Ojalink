import type { Metadata } from "next";

import { ActiveJobCard, AvailableJobCard } from "@/components/rider/job-cards";
import { RiderNav } from "@/components/rider/rider-nav";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { riderPageCopy } from "@/lib/rider/page-copy";
import { getActiveJobs, getAvailableJobs } from "@/lib/rider/queries";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Rider area · OjaLink",
  description: "Your OjaLink rider area: delivery jobs and history.",
};

export default async function RiderPage() {
  const user = await requireRole("rider");
  const [activeJobs, availableJobs] = await Promise.all([
    getActiveJobs(user.id),
    getAvailableJobs(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{riderPageCopy.areaLabel}</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          {riderPageCopy.jobsTitle}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Hello {user.name}. {riderPageCopy.jobsSubtitle}
        </p>
      </header>

      <RiderNav current="jobs" />

      <section aria-labelledby="active-heading" className="flex flex-col gap-4">
        <h2 id="active-heading" className="font-heading text-[22px] font-bold text-foreground">
          {riderPageCopy.activeHeading}
        </h2>
        {activeJobs.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-base text-foreground">{riderPageCopy.activeEmpty}</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {activeJobs.map((job) => (
              <li key={job.deliveryId}>
                <ActiveJobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="available-heading" className="flex flex-col gap-4">
        <h2 id="available-heading" className="font-heading text-[22px] font-bold text-foreground">
          {riderPageCopy.availableHeading}
        </h2>
        {availableJobs.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-base text-foreground">{riderPageCopy.availableEmpty}</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {availableJobs.map((job) => (
              <li key={job.deliveryId}>
                <AvailableJobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
