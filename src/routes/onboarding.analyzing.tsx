import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import loopIcon from "@/assets/loop-icon.png";

export const Route = createFileRoute("/onboarding/analyzing")({
  component: Analyzing,
});

const LINES = [
  "Reading your story…",
  "Mapping your trigger chain…",
  "Identifying the gateway…",
  "Naming your loop…",
];

function Analyzing() {
  const nav = useNavigate();
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % LINES.length), 900);
    const done = setTimeout(() => nav({ to: "/onboarding/loop" }), 3800);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [nav]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gradient-hero px-6 text-center safe-top safe-bottom">
      <motion.img
        src={loopIcon}
        alt=""
        width={112}
        height={112}
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="h-28 w-28 rounded-3xl glow"
      />
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-10 text-base text-muted-foreground"
      >
        {LINES[i]}
      </motion.p>
      <p className="mt-2 text-xs text-muted-foreground/60">This takes a few seconds.</p>
    </div>
  );
}
