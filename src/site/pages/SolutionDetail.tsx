import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { Cards, CTABand, Faq, PageHero, Section, SectionHeading, Stats, Steps } from "../components/Sections";
import { SOLUTIONS, solutionBySlug } from "../content/solutions";
import NotFound from "./NotFound";

export default function SolutionDetail() {
  const { slug = "" } = useParams();
  const solution = solutionBySlug(slug);

  if (!solution) return <NotFound />;

  const related = solution.related
    .map((s) => SOLUTIONS.find((x) => x.slug === s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const crumbs = [
    { name: "Solutions", path: "/solutions" },
    { name: solution.name, path: `/solutions/${solution.slug}` },
  ];

  return (
    <SiteLayout>
      <Seo
        path={`/solutions/${solution.slug}`}
        crumbs={crumbs}
        extra={[
          {
            "@type": "Service",
            name: `${solution.name} revenue operations`,
            serviceType: solution.kind,
            description: solution.intro,
            provider: { "@id": "https://gtmsaas.sajidafridi.com/#organization" },
            areaServed: { "@type": "Country", name: "Pakistan" },
          },
          {
            "@type": "FAQPage",
            mainEntity: solution.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <PageHero
        eyebrow={solution.eyebrow}
        title={solution.title}
        intro={solution.intro}
        primary={{ label: "Run this flow in the demo", href: "/demo" }}
        secondary={{ label: "All solutions", href: "/solutions" }}
        aside={<Stats items={solution.stats} />}
        crumbs={crumbs}
      />

      <Section>
        <SectionHeading
          eyebrow="What breaks today"
          title={`Where ${solution.name} loses revenue`}
          intro="These are the patterns we see before a group moves to a single revenue model. Each one costs time, margin or both."
        />
        <Cards items={solution.challenges} columns={2} />
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="What RevFlow ships"
          title="Working capability, not a roadmap slide"
          intro="Every item below is live in the demo workspace and writes to the same database your team would use in production."
        />
        <Cards items={solution.capabilities} columns={3} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="End to end"
          title="How the flow runs"
          intro="Four steps, one workspace, and a record at every stage."
        />
        <Steps items={solution.steps} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open the live demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Request a tailored walkthrough
          </Link>
        </div>
      </Section>

      <Section tone="panel">
        <SectionHeading eyebrow="Questions" title="What buyers ask first" />
        <Faq items={solution.faq} />
      </Section>

      {related.length ? (
        <Section>
          <SectionHeading eyebrow="Related" title="Adjacent reference architectures" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                to={`/solutions/${item.slug}`}
                className="group rounded-2xl border border-white/5 bg-slate-900/40 p-6 transition hover:border-violet-500/30 hover:bg-slate-900/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{item.name}</h3>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
                    {item.kind}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.intro.split(". ")[0]}.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 group-hover:text-white">
                  Read the architecture
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="darker" className="!py-12">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">Built for a group, not a single brand</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                The same account graph and asset registry can carry an appliance brand, an industrial zone and a
                distribution arm at once.
              </p>
            </div>
          </div>
          <ul className="grid gap-1.5 text-xs text-slate-400 sm:grid-cols-2">
            {["Multi-entity rollups", "Role-based visibility", "Shared audit log", "14-day demo retention"].map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <CTABand />
    </SiteLayout>
  );
}
