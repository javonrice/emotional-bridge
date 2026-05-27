import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LOOP" },
      { name: "description", content: "How LOOP handles your data." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="safe-top safe-bottom px-6 pb-10">
      <div className="pt-2">
        <Link to="/app/profile" aria-label="Back" className="tap-scale inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <ArrowLeft size={16} />
        </Link>
      </div>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: May 2026 · Placeholder pending legal review.</p>

      <Section title="What we collect">
        Account info (email, display name), your onboarding answers, check-ins, debrief inputs, AI
        outputs, AI quality ratings, and first-party usage events (page views, button taps). No
        third-party trackers.
      </Section>
      <Section title="How we use it">
        To generate your personalized loop and debrief reflections, to compute streaks and insights,
        and to improve our prompts based on aggregate quality signal. We don't sell your data.
      </Section>
      <Section title="Who we share with">
        Our AI provider receives the text of your prompt inputs to generate a response. They don't
        train on your data. Our hosting and database providers process data on our behalf.
      </Section>
      <Section title="Your rights">
        You can export all your data or delete your account at any time from your profile. Deletion is
        permanent and removes your data from our active systems.
      </Section>
      <Section title="Retention">
        We keep your data for as long as your account exists. Deleted accounts are removed within 30
        days from backups.
      </Section>
      <Section title="Contact">
        Privacy questions: privacy@example.com.
      </Section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground/60">
        <Link to="/legal/terms" className="underline">Terms</Link> · <Link to="/legal/eula" className="underline">EULA</Link>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
