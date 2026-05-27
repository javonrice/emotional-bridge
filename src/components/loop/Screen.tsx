import { ReactNode } from "react";
import { motion } from "motion/react";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function ScreenShell({
  children,
  showBack = true,
  progress,
  onBack,
}: {
  children: ReactNode;
  showBack?: boolean;
  progress?: { step: number; total: number };
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground safe-x">
      <div className="safe-top flex h-12 items-center justify-between px-4">
        {showBack ? (
          <button
            aria-label="Back"
            onClick={() => (onBack ? onBack() : router.history.back())}
            className="tap-scale -ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronLeft size={26} />
          </button>
        ) : (
          <span className="w-9" />
        )}
        {progress && (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.step / progress.total) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
              />
            </div>
          </div>
        )}
        <span className="w-9" />
      </div>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-1 flex-col px-6 pb-6"
      >
        {children}
      </motion.main>
    </div>
  );
}

export function PrimaryButton({
  children,
  to,
  onClick,
  disabled,
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls =
    "ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_rgba(108,99,255,0.6)] disabled:opacity-40";
  if (to && !disabled)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function GhostButton({ children, to, onClick }: { children: ReactNode; to?: string; onClick?: () => void }) {
  const cls = "ios-pill tap-scale flex h-12 w-full items-center justify-center text-sm font-medium text-muted-foreground";
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-[34px] font-bold leading-[1.08] tracking-tight text-foreground">{children}</h1>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{children}</p>;
}
