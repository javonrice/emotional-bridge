import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Phone } from "lucide-react";
import { CRISIS_RESOURCES } from "@/lib/safety";

export const Route = createFileRoute("/crisis")({
  head: () => ({
    meta: [
      { title: "Crisis resources — LOOP" },
      { name: "description", content: "If you're in crisis, please reach a human. International helplines and text lines." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Crisis,
});

function Crisis() {
  return (
    <main className="safe-top safe-bottom px-6 pb-10">
      <div className="pt-2">
        <Link to="/app/today" aria-label="Back" className="tap-scale inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <ArrowLeft size={16} />
        </Link>
      </div>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">You don't have to do this alone.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        LOOP is a pattern-awareness tool, not a crisis service. If you're thinking about hurting yourself
        or someone else, please talk to a human right now. These services are free, confidential, and
        available 24/7.
      </p>

      <ul className="mt-6 space-y-3">
        {CRISIS_RESOURCES.map((r) => {
          const isTel = r.href.startsWith("tel:") || r.href.startsWith("sms:");
          return (
            <li key={r.label}>
              <a
                href={r.href}
                target={isTel ? undefined : "_blank"}
                rel={isTel ? undefined : "noopener noreferrer"}
                className="tap-scale flex items-center gap-3 rounded-2xl border border-white/10 bg-card p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  {isTel ? <Phone size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-foreground">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.region} · {r.detail}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
