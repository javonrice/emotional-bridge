import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { setLastStep } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingLayout,
});

function OnboardingLayout() {
  const loc = useLocation();
  useEffect(() => {
    setLastStep(loc.pathname);
  }, [loc.pathname]);
  return <Outlet />;
}
