import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/control")({
  component: Control,
});

function Control() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  const [val, setVal] = useState<number>(answers.control ?? 7);

  return (
    <ScreenShell progress={{ step: 3, total: 9 }}>
      <H1>How often do you feel out of control?</H1>
      <Sub>1 means almost never. 10 means it runs the show.</Sub>
      <div className="mt-12 text-center">
        <div className="text-[96px] font-bold leading-none tracking-tight text-primary text-glow">{val}</div>
        <div className="mt-2 text-sm text-muted-foreground">out of 10</div>
      </div>
      <div className="mt-10 px-1">
        <input
          type="range"
          min={1}
          max={10}
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value, 10))}
          className="w-full accent-[#6C63FF]"
          style={{ height: 6 }}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>rarely</span>
          <span>always</span>
        </div>
      </div>
      <div className="flex-1" />
      <PrimaryButton
        onClick={() => {
          setAnswer("control", val);
          nav({ to: "/onboarding/apps" });
        }}
      >
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
