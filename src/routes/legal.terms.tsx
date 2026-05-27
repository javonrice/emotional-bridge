import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — LOOP" },
      { name: "description", content: "LOOP terms of service." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <main className="safe-top safe-bottom px-6 pb-10">
      <div className="pt-2">
        <Link to="/app/profile" aria-label="Back" className="tap-scale inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <ArrowLeft size={16} />
        </Link>
      </div>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: May 2026 · Placeholder pending legal review.</p>

      <Section title="1. What LOOP is">
        LOOP is a self-report emotional pattern awareness tool. It is not a medical device, not therapy,
        and not a crisis service. By using LOOP you agree that nothing in the product constitutes
        professional advice.
      </Section>
      <Section title="2. Your account">
        You're responsible for the security of your account credentials and for any activity under your
        account. You must be 16 or older to use LOOP.
      </Section>
      <Section title="3. Subscriptions and trials">
        Paid plans renew automatically until canceled. You can cancel anytime from your profile, and
        cancellation takes effect at the end of the current billing period. Free trials convert to paid
        plans at the published price unless canceled before the trial ends.
      </Section>
      <Section title="4. Acceptable use">
        Don't use LOOP to harm yourself or others, attempt to break the service, or violate any law.
      </Section>
      <Section title="5. Content and data">
        You own your inputs. We use them to generate your AI reflections and to improve the product.
        See the <Link to="/legal/privacy" className="underline">Privacy Policy</Link> for details.
      </Section>
      <Section title="6. Disclaimers">
        LOOP is provided "as is." We make no warranty that AI outputs are accurate, complete, or fit
        for any particular purpose.
      </Section>
      <Section title="7. Changes">
        We may update these terms; material changes will be surfaced in-app.
      </Section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground/60">
        <Link to="/legal/privacy" className="underline">Privacy</Link> · <Link to="/legal/eula" className="underline">EULA</Link>
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
