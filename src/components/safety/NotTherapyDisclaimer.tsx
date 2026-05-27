import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

const KEY = "loop:not-therapy-ack";

// Shown once, on the user's first AI-generated card. Persists ack to localStorage.
export function NotTherapyDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-card/80 p-4 text-xs text-muted-foreground">
      <div className="flex items-start gap-3">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1 leading-relaxed">
          <span className="font-semibold text-foreground">LOOP is not therapy.</span>{" "}
          It's a self-report awareness tool. If you're in distress, please reach a human —{" "}
          <Link to="/crisis" className="underline text-foreground">see crisis resources</Link>.
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss disclaimer"
          className="tap-scale flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-muted-foreground"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
