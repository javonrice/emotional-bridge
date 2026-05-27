import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";
import { Mic } from "lucide-react";

export const Route = createFileRoute("/onboarding/story")({
  component: Story,
});

function Story() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  const [text, setText] = useState(answers.story ?? "");

  return (
    <ScreenShell progress={{ step: 8, total: 9 }}>
      <H1>Tell me about the last time you felt the pull.</H1>
      <Sub>Where you were, what you'd been doing, who you were avoiding. Don't filter it. This stays private.</Sub>
      <div className="mt-6 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="It was around 11pm. I'd been..."
          rows={10}
          className="w-full resize-none rounded-2xl border border-white/8 bg-card p-4 text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          className="tap-scale mt-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-medium text-muted-foreground"
        >
          <Mic size={14} /> Speak instead
        </button>
      </div>
      <PrimaryButton
        onClick={() => {
          setAnswer("story", text || "I don't know. It just happened again.");
          nav({ to: "/onboarding/analyzing" });
        }}
        disabled={text.trim().length < 10}
      >
        Read my pattern
      </PrimaryButton>
    </ScreenShell>
  );
}
