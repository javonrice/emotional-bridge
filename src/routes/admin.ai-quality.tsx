import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAIQualityStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/ai-quality")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AIQualityPage,
});

type Summary = {
  surface: string;
  prompt_version: string;
  model: string;
  up: number;
  down: number;
  total: number;
  up_rate: number | null;
  enough_samples: boolean;
};

type BadRow = {
  surface: string;
  source_id: string;
  reason: string | null;
  comment: string | null;
  model: string | null;
  prompt_version: string | null;
  answers_snapshot: any;
  created_at: string;
};

function AIQualityPage() {
  const load = useServerFn(getAIQualityStats);
  const [days, setDays] = useState(30);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [bad, setBad] = useState<BadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    load({ data: { days } })
      .then((res) => {
        if (!res.authorized) {
          setAuthorized(false);
          return;
        }
        setAuthorized(true);
        setSummary(res.summary as Summary[]);
        setBad((res.recentBad ?? []) as BadRow[]);
      })
      .finally(() => setLoading(false));
  }, [days, load]);

  if (authorized === false) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-bold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is for admin users only.</p>
        <Link to="/app/today" className="mt-4 inline-block text-sm text-primary underline">Back to app</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI quality</h1>
        <div className="flex gap-1 rounded-full border border-white/10 p-1 text-xs">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 ${days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

      {!loading && (
        <>
          <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Up/down by surface · prompt · model</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Surface</th>
                    <th className="px-3 py-2">Prompt</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2 text-right">Up</th>
                    <th className="px-3 py-2 text-right">Down</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Up rate</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No feedback in this window yet.</td></tr>
                  )}
                  {summary.map((r, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-2">{r.surface}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.prompt_version}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.model}</td>
                      <td className="px-3 py-2 text-right text-success">{r.up}</td>
                      <td className="px-3 py-2 text-right text-destructive">{r.down}</td>
                      <td className="px-3 py-2 text-right">{r.total}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {r.enough_samples ? `${r.up_rate}%` : <span className="text-muted-foreground/60" title="Need at least 5 ratings">n/a</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Recent thumbs-down</h2>
            <div className="mt-3 space-y-3">
              {bad.length === 0 && <p className="text-sm text-muted-foreground">None — nice.</p>}
              {bad.map((r, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-card p-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{r.surface} · {r.prompt_version ?? "?"} · {r.model ?? "?"}</span>
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">Reason:</span> {r.reason ?? "—"}
                  </div>
                  {r.comment && (
                    <div className="mt-1 text-sm text-foreground/90">"{r.comment}"</div>
                  )}
                  {r.answers_snapshot && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] text-muted-foreground">
{JSON.stringify(r.answers_snapshot, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
