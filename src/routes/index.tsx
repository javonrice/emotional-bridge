import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { done } = useOnboarding();
  const nav = useNavigate();
  useEffect(() => {
    nav({ to: done ? "/app/today" : "/onboarding/welcome", replace: true });
  }, [done, nav]);
  return <div className="min-h-screen bg-background" />;
}
