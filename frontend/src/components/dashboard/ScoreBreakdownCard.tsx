import { AlertTriangle, CheckCircle2, Gauge, ShieldAlert } from 'lucide-react';
import type { LeadAnalysisRecord } from '../../types/dashboard';

interface Props {
  analysis: LeadAnalysisRecord;
}

export function ScoreBreakdownCard({ analysis }: Props) {
  const breakdown = analysis.score_breakdown ?? {};
  const score = analysis.qualification_score ?? breakdown.final_score ?? 0;

  const axes = [
    {
      key: 'service_fit',
      label: 'Service Fit',
      points: breakdown.service_fit?.points ?? 0,
      max: breakdown.service_fit?.max ?? 30,
      reason: breakdown.service_fit?.reason,
    },
    {
      key: 'budget_fit',
      label: 'Budget Fit',
      points: breakdown.budget_fit?.points ?? 0,
      max: breakdown.budget_fit?.max ?? 30,
      reason: breakdown.budget_fit?.reason,
    },
    {
      key: 'timeline_fit',
      label: 'Timeline Fit',
      points: breakdown.timeline_fit?.points ?? 0,
      max: breakdown.timeline_fit?.max ?? 20,
      reason: breakdown.timeline_fit?.reason,
    },
    {
      key: 'project_clarity',
      label: 'Project Clarity',
      points: breakdown.project_clarity?.points ?? 0,
      max: breakdown.project_clarity?.max ?? 20,
      reason: breakdown.project_clarity?.reason,
    },
  ];

  const dealBreakers = Array.isArray(breakdown.deal_breakers)
    ? breakdown.deal_breakers
    : [];
  const overrides = Array.isArray(breakdown.overrides) ? breakdown.overrides : [];

  const scoreRingColor =
    score >= 75
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
      : score >= 45
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
        : 'border-rose-500/40 bg-rose-500/15 text-rose-300';

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Gauge className="h-4 w-4 text-sky-400" />
            Deterministic Score Breakdown
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Computed by JS scoring rules (LLM never scores leads)
          </p>
        </div>

        <div
          className={`flex items-baseline gap-1 rounded-xl border px-3.5 py-2 ${scoreRingColor}`}
        >
          <span className="text-2xl font-bold tabular-nums">{score}</span>
          <span className="text-xs opacity-75">/ 100</span>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {axes.map((axis) => {
          const pct = axis.max > 0 ? Math.min(100, Math.round((axis.points / axis.max) * 100)) : 0;
          const barColor =
            pct >= 75
              ? 'bg-emerald-400'
              : pct >= 45
                ? 'bg-amber-400'
                : 'bg-rose-400';

          return (
            <div key={axis.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{axis.label}</span>
                <span className="font-semibold tabular-nums text-slate-300">
                  {axis.points} / {axis.max}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {axis.reason && (
                <p className="text-xs text-slate-400">{axis.reason}</p>
              )}
            </div>
          );
        })}
      </div>

      {dealBreakers.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Deal-Breaker Overrides Triggered
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {dealBreakers.map((item) => (
              <span
                key={item}
                className="rounded-md border border-rose-500/30 bg-rose-950/60 px-2 py-0.5 font-mono text-[11px] text-rose-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {overrides.length > 0 && dealBreakers.length === 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Routing Overrides Applied
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {overrides.map((item) => (
              <span
                key={item}
                className="rounded-md border border-amber-500/30 bg-amber-950/60 px-2 py-0.5 font-mono text-[11px] text-amber-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {dealBreakers.length === 0 && overrides.length === 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          No deal-breaker or floor overrides triggered.
        </div>
      )}
    </section>
  );
}
