import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

// Surfaced inline whenever risk keywords are detected. Non-dismissive, non-blocking.
export function CrisisBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <LifeBuoy size={16} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">
            If you're in crisis, please reach a human.
          </div>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              LOOP is a pattern-awareness tool, not a substitute for professional help. If you're thinking about hurting yourself, talk to someone right now.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="tel:988"
              className="tap-scale rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
            >
              Call 988 (US)
            </a>
            <a
              href="sms:741741?body=HOME"
              className="tap-scale rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
            >
              Text HOME to 741741
            </a>
            <Link
              to="/crisis"
              className="tap-scale rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              More resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
