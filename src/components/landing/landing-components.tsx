import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type LandingCategory = {
  label: string;
  href: string;
  image: string;
  imageAlt: string;
};

export function CategoryTicker({ categories }: { categories: LandingCategory[] }) {
  const copies = [0, 1, 2, 3];

  return (
    <div className="ojalink-category-ticker overflow-hidden" role="region" aria-label="Marketplace categories">
      <div className="ojalink-category-ticker-viewport overflow-x-hidden">
        <div className="ojalink-category-ticker-track flex w-max">
          {copies.map((copyIndex) => {
            const isDuplicate = copyIndex > 0;
            return (
            <div
              key={copyIndex}
              aria-hidden={isDuplicate || undefined}
              className={`flex shrink-0 ${isDuplicate ? "ojalink-category-ticker-duplicate" : ""}`}
            >
              {categories.map((category) => (
                <Link
                  key={category.label}
                  href={category.href}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="group flex min-h-24 w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center outline-none transition hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44"
                >
                  <span className="relative size-14 overflow-hidden rounded-full border-2 border-white bg-muted shadow-sm ring-1 ring-border transition group-hover:ring-primary sm:size-16">
                    <Image
                      src={category.image}
                      alt={isDuplicate ? "" : category.imageAlt}
                      fill
                      sizes="64px"
                      loading="lazy"
                      className="object-cover"
                    />
                  </span>
                  <span className="max-w-full text-xs font-semibold leading-tight text-foreground sm:text-sm">{category.label}</span>
                </Link>
              ))}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 space-y-6 sm:space-y-8 ${className}`}>
      <div className="mx-auto max-w-3xl space-y-2 text-center">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-wider text-primary">{eyebrow}</p>}
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="text-base leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function FeatureCard({ icon, title, description, image, imageAlt }: { icon?: ReactNode; title: string; description: string; image?: string; imageAlt?: string }) {
  return (
    <article className="h-full min-h-48 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-b from-card to-primary/[0.04] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-h-56">
      {image ? (
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image src={image} alt={imageAlt ?? ""} fill sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" className="object-cover" />
        </div>
      ) : icon ? (
        <div className="p-6 pb-0 sm:p-8 sm:pb-0">
          <span aria-hidden="true" className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        </div>
      ) : null}
      <div className="p-6 sm:p-8">
        <h3 className="font-heading text-xl font-bold sm:text-2xl">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

export function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: ReactNode }) {
  return (
    <article className="relative grid min-h-36 grid-cols-[auto_1fr] items-center gap-5 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-md transition-shadow hover:shadow-lg sm:min-h-40 sm:grid-cols-[5rem_auto_1fr] sm:gap-7 sm:px-8 sm:py-7">
      <span aria-hidden="true" className="hidden font-heading text-5xl font-bold leading-none text-primary/20 sm:block">{number}</span>
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:size-20 sm:rounded-3xl">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Step {number}</p>
        <h3 className="mt-1 font-heading text-xl font-bold sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
      </div>
    </article>
  );
}

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-5 shadow-sm open:border-primary/30">
      <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-4 font-semibold outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-ring/50">
        {question}<span aria-hidden="true" className="text-xl text-primary transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="pt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}
