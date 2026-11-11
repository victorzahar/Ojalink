import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin, PackageCheck, Search, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryTicker, FaqItem, FeatureCard, Section, StepCard } from "@/components/landing/landing-components";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { benefits, faqs, landingCategories, landingSteps, trustPoints } from "@/lib/landing/content";

export const instant = false;

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-10 px-4 py-6 sm:gap-16 sm:px-8 sm:py-10 lg:px-12">
      <ScrollReveal as="section" className="grid items-center gap-7 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div className="space-y-5 py-2 sm:py-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><MapPin aria-hidden="true" className="size-4" /> Benin City, Edo State</p>
          <h1 className="font-heading text-5xl font-bold italic leading-tight tracking-tight text-primary sm:text-6xl">OjaLink</h1>
          <h2 className="font-sans text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">Benin City Online, Market</h2>
          <p className="max-w-xl text-sm font-light italic leading-relaxed text-muted-foreground">Order fresh food, fabrics, electronics, and daily provisions from trusted local market vendors and have them delivered to your door.</p>
          <form action="/marketplace" method="GET" className="space-y-3 pt-1">
            <label htmlFor="landing-search" className="sr-only">Search marketplace products</label>
            <div className="flex min-h-14 items-center gap-2 rounded-2xl border border-border bg-background p-1.5 shadow-sm">
              <Search aria-hidden="true" className="ml-2 size-5 shrink-0 text-muted-foreground" />
              <Input id="landing-search" type="search" name="q" placeholder="Search yam, rice, fabrics, phones…" className="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" />
              <Button type="submit" size="icon" aria-label="Search products" className="size-11 shrink-0 rounded-xl"><Search aria-hidden="true" className="size-5" /></Button>
            </div>
          </form>
          <div className="flex flex-col gap-3 pt-1 min-[420px]:flex-row">
            <Button asChild className="min-h-12 rounded-xl px-5 font-semibold"><Link href="/marketplace">Browse marketplace <ArrowRight aria-hidden="true" className="ml-1 size-4" /></Link></Button>
            <Button asChild variant="outline" className="min-h-12 rounded-xl border-primary/40 px-5 font-semibold text-primary"><Link href="#become-vendor">Become a vendor</Link></Button>
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-2xl bg-muted sm:min-h-80 lg:min-h-[25rem]">
          <Image src="/images/landing/benin-city-new-benin-market.jpg" alt="A market day view of New Benin Market in Benin City" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-5 pt-20 text-white sm:p-6 sm:pt-24">
            <p className="font-heading text-lg font-bold">Shop the markets you know</p>
            <p className="mt-1 text-sm text-white/90">Find fresh and everyday good from benin city vendors</p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" labelledBy="landing-categories-heading" className="space-y-5 rounded-3xl border border-border bg-muted/60 p-5 shadow-sm sm:p-8">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-sm font-bold uppercase tracking-wider text-primary">Shop local</p><h2 id="landing-categories-heading" className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Browse by category</h2></div>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">All products <ChevronRight aria-hidden="true" className="size-4" /></Link>
        </div>
        <CategoryTicker categories={landingCategories} />
      </ScrollReveal>

      <ScrollReveal as="section" id="how-it-works" className="scroll-mt-24 rounded-3xl border border-primary/10 bg-primary/5 p-5 sm:p-9">
        <Section title="From market to your door" className="space-y-6 sm:space-y-8">
          <ol className="mx-auto grid w-full max-w-5xl gap-4 sm:gap-5">
            {landingSteps.map(({ Icon, ...step }, index) => (
              <ScrollReveal as="li" key={step.number} delay={index * 90}>
                <StepCard {...step} icon={<Icon aria-hidden="true" className="size-7" />} />
              </ScrollReveal>
            ))}
          </ol>
        </Section>
      </ScrollReveal>

      <ScrollReveal as="section" id="about" className="scroll-mt-24 rounded-3xl bg-muted/70 p-5 sm:p-9">
      <Section eyebrow="About OjaLink" title="Bringing Benin City markets online" description="OjaLink connects shoppers with local vendors so familiar market goods are easier to discover and order.">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {trustPoints.map((point, index) => {
            return <ScrollReveal key={point.title} delay={index * 100} className="h-full"><FeatureCard {...point} /></ScrollReveal>;
          })}
        </div>
      </Section>
      </ScrollReveal>

      <ScrollReveal as="section" className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-9">
      <Section eyebrow="Why OjaLink" title="A more convenient way to shop local" description="Discover everyday goods from local businesses, with clear product information along the way.">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {benefits.map((benefit, index) => {
            const icons = [<Store key="store" className="size-6" />, <MapPin key="market" className="size-6" />, <PackageCheck key="price" className="size-6" />];
            return <ScrollReveal key={benefit.title} delay={index * 100} className="h-full"><FeatureCard icon={icons[index]} {...benefit} /></ScrollReveal>;
          })}
        </div>
      </Section>

      </ScrollReveal>

      <ScrollReveal as="section" id="become-vendor" className="scroll-mt-24 rounded-3xl border border-primary/15 bg-primary/5 p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Store aria-hidden="true" className="size-7" /></span>
        <h2 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">Bring your shop to OjaLink</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Create an account to get started, then contact the OjaLink team to request vendor access. Vendor shops require approval before selling.</p>
        <Button asChild className="mt-5 min-h-12 rounded-xl px-5 font-semibold"><Link href="/signup">Create an account <ArrowRight aria-hidden="true" className="ml-1 size-4" /></Link></Button>
      </ScrollReveal>

      <ScrollReveal as="section" className="rounded-3xl bg-muted/60 p-5 sm:p-9">
        <Section eyebrow="Need to know" title="Frequently asked questions" description="Helpful information about shopping on OjaLink.">
          <div className="mx-auto grid max-w-4xl gap-3">{faqs.map((faq, index) => <ScrollReveal key={faq.question} delay={Math.min(index, 4) * 70}><FaqItem {...faq} /></ScrollReveal>)}</div>
        </Section>
      </ScrollReveal>
    </main>
  );
}
