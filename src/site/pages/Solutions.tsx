import { Link } from "react-router-dom";
import { ArrowRight, Building2, Boxes, Store, Truck } from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { CTABand, PageHero, Section, SectionHeading, Stats } from "../components/Sections";
import { SOLUTIONS } from "../content/solutions";

const icons = [Boxes, Building2, Truck, Store];

export default function Solutions() {
  return (
    <SiteLayout>
      <Seo path="/solutions" crumbs={[{ name: "Solutions", path: "/solutions" }]} />
      <PageHero
        eyebrow="Solutions"
        title="Four businesses, one revenue model"
        intro="The same eight entities describe an appliance brand, an industrial zone, a commercial vehicle business and a distribution arm. What changes is the workflow on top, and that is what these reference architectures show."
        primary={{ label: "Explore the live demo", href: "/demo" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
        aside={
          <Stats
            items={[
              { value: "4", label: "reference models" },
              { value: "8", label: "shared entities" },
              { value: "3", label: "cities seeded" },
              { value: "PKR", label: "native currency" },
            ]}
          />
        }
      />

      <Section>
        <SectionHeading
          eyebrow="By industry"
          title="Pick the business closest to yours"
          intro="Each page walks through the problems we hear most often, what the platform actually ships, and the end-to-end flow you can click through in the demo."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {SOLUTIONS.map((solution, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Link
                key={solution.slug}
                to={`/solutions/${solution.slug}`}
                className="group rounded-2xl border border-white/5 bg-slate-900/40 p-6 transition hover:border-violet-500/30 hover:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                    {solution.kind}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{solution.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{solution.intro.split(". ")[0]}.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 group-hover:text-white">
                  Read the architecture
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="Why one model works"
          title="The shared spine behind every vertical"
          intro="Industries differ in vocabulary, not in structure. A dealer, a tenant and a fleet buyer are all accounts. An AC, a truck and a plot are all catalog items with a price and a warranty term. Keeping that spine shared is what makes cross-entity reporting possible."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "One account graph", body: "Dealers, tenants and fleet buyers share contacts, credit and activity history." },
            { title: "One asset registry", body: "Serial numbers, warranty dates and service history apply to any physical product." },
            { title: "One order ledger", body: "Primary, secondary and institutional deals differ by type, not by database." },
            { title: "One service queue", body: "Warranty tickets route to technicians regardless of which entity sold the unit." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-slate-950/50 p-5">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTABand
        title="See all four models in one demo account"
        body="Switch personas, run the warranty dispatch flow, place a dealer order, request a cross-sell bundle and sync an ERP — all against seeded Pakistani data."
      />
    </SiteLayout>
  );
}
