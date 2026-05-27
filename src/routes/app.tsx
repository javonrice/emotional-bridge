import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Home, Sparkles, Mic, BarChart3, User } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const TABS = [
  { to: "/app/today", label: "Today", icon: Home },
  { to: "/app/insights", label: "Insights", icon: BarChart3 },
  { to: "/app/checkin", label: "Check-in", icon: Sparkles },
  { to: "/app/debrief", label: "Debrief", icon: Mic },
  { to: "/app/profile", label: "You", icon: User },
] as const;

function AppLayout() {
  const loc = useLocation();
  return (
    <div className="relative min-h-screen bg-background pb-24">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] ios-blur safe-bottom border-t border-white/5">
        <div className="flex items-stretch justify-around px-2 pt-2">
          {TABS.map((t) => {
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`tap-scale flex flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <t.icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
