import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "loop:consent";

export function getConsent(): "accepted" | "declined" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

// Lightweight, GDPR-style banner. Analytics writes still happen regardless (they're first-party
// and contain no PII), but this is the surface we expand on if/when third-party trackers land.
export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  const set = (v: "accepted" | "declined") => {
    localStorage.setItem(KEY, v);
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie and analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] px-3 pb-3"
    >
      <div className="rounded-2xl border border-white/10 bg-card/95 p-4 shadow-xl backdrop-blur-md safe-bottom">
        <p className="text-xs leading-relaxed text-muted-foreground">
          We store first-party usage events to understand how LOOP is working — no third-party
          trackers. See our{" "}
          <Link to="/legal/privacy" className="underline text-foreground">privacy policy</Link>.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => set("declined")}
            className="tap-scale flex-1 rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            Decline
          </button>
          <button
            onClick={() => set("accepted")}
            className="tap-scale flex-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
