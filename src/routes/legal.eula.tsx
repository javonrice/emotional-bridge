import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/eula")({
  head: () => ({
    meta: [
      { title: "End User License Agreement — LOOP" },
      { name: "description", content: "LOOP EULA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Eula,
});

function Eula() {
  return (
    <main className="safe-top safe-bottom px-6 pb-10">
      <div className="pt-2">
        <Link to="/app/profile" aria-label="Back" className="tap-scale inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <ArrowLeft size={16} />
        </Link>
      </div>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">End User License Agreement</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: May 2026 · Placeholder pending legal review.</p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Subject to the <Link to="/legal/terms" className="underline">Terms of Service</Link>, LOOP grants
        you a personal, non-transferable, non-exclusive, revocable license to use the LOOP app on
        devices you own or control, for your personal, non-commercial use.
      </p>

      <Section title="Restrictions">
        You may not copy, modify, reverse engineer, sublicense, sell, or distribute the app or its
        outputs except as expressly permitted.
      </Section>
      <Section title="AI outputs">
        AI-generated content is provided for personal reflection only. It may be inaccurate or
        inappropriate; use your own judgment.
      </Section>
      <Section title="Termination">
        This license terminates automatically if you violate it or delete your account.
      </Section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground/60">
        <Link to="/legal/terms" className="underline">Terms</Link> · <Link to="/legal/privacy" className="underline">Privacy</Link>
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
