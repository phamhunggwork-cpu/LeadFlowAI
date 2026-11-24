import { AlertTriangle, CheckCircle2, Gauge, ShieldAlert } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import type { LeadAnalysisRecord } from '@/types/dashboard';

interface Props {
  analysis: LeadAnalysisRecord;
}

const SCORE_CHART_CONFIG: ChartConfig = {
  score: { label: 'Qualification Score', color: '#2563eb' },
  pct: { label: 'Axis Attainment', color: '#2563eb' },
};

function getScoreColor(pct: number): string {
  if (pct >= 75) return '#10b981';
  if (pct >= 45) return '#f59e0b';
  return '#f43f5e';
}

function getScoreBadgeVariant(
  score: number,
): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success';
  if (score >= 45) return 'warning';
  return 'danger';
}

function getScoreTierLabel(score: number): string {
  if (score >= 75) return 'Qualified Band';
  if (score >= 45) return 'Needs Review Band';
  return 'Not Qualified Band';
}

export function ScoreBreakdownCard({ analysis }: Props) {
  const breakdown = analysis.score_breakdown ?? {};
  const score = Math.max(
    0,
    Math.min(100, analysis.qualification_score ?? breakdown.final_score ?? 0),
  );

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
  ].map((axis) => {
    const pct =
      axis.max > 0 ? Math.min(100, Math.round((axis.points / axis.max) * 100)) : 0;
    return {
      ...axis,
      pct,
      fill: getScoreColor(pct),
    };
  });

  const dealBreakers = Array.isArray(breakdown.deal_breakers)
    ? breakdown.deal_breakers
    : [];
  const overrides = Array.isArray(breakdown.overrides) ? breakdown.overrides : [];

  const gaugeColor = getScoreColor(score);
  const gaugeData = [{ name: 'Score', score, fill: gaugeColor }];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Deterministic Score Breakdown
          </CardTitle>
          <CardDescription className="mt-1">
            Computed strictly by JS scoring rules — LLM never scores leads
          </CardDescription>
        </div>
        <Badge variant={getScoreBadgeVariant(score)} className="font-mono">
          {getScoreTierLabel(score)}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-12 md:items-center">
          {/* Radial Score Gauge */}
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-3 md:col-span-4">
            <ChartContainer
              config={SCORE_CHART_CONFIG}
              className="h-[144px] w-[144px]"
            >
              <RadialBarChart
                data={gaugeData}
                startAngle={215}
                endAngle={-35}
                innerRadius="72%"
                outerRadius="100%"
                barSize={12}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="score"
                  cornerRadius={8}
                  background={{ fill: '#e2e8f0' }}
                />
              </RadialBarChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {score}
              </span>
              <span className="font-mono text-[11px] font-medium text-muted-foreground">
                / 100 pts
              </span>
            </div>
          </div>

          {/* 4-Axis Normalized Recharts Bar Chart */}
          <div className="md:col-span-8">
            <ChartContainer config={SCORE_CHART_CONFIG} className="h-[156px]">
              <BarChart
                data={axes}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                barCategoryGap={10}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                  content={
                    <ChartTooltipContent
                      valueFormatter={(value, item) => {
                        const row = item.payload as
                          | { points?: number; max?: number }
                          | undefined;
                        if (row?.points !== undefined && row?.max !== undefined) {
                          return `${row.points}/${row.max} pts (${value}%)`;
                        }
                        return `${value}%`;
                      }}
                    />
                  }
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={16}>
                  {axes.map((axis) => (
                    <Cell key={axis.key} fill={axis.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Axis Rationale List */}
        <Separator />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="rounded-lg border border-border/80 bg-muted/35 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">{axis.label}</span>
                <span className="font-mono font-semibold tabular-nums text-secondary-foreground">
                  {axis.points} / {axis.max}
                </span>
              </div>
              {axis.reason && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {axis.reason}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Deal-Breaker & Routing Override Notices */}
        {dealBreakers.length > 0 && (
          <div className="rounded-lg border border-danger-border bg-danger-soft p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-danger">
              <ShieldAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Deal-Breaker Overrides Triggered
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dealBreakers.map((item) => (
                <Badge key={item} variant="danger" className="font-mono text-[11px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {overrides.length > 0 && dealBreakers.length === 0 && (
          <div className="rounded-lg border border-warning-border bg-warning-soft p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Routing Overrides Applied
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {overrides.map((item) => (
                <Badge key={item} variant="warning" className="font-mono text-[11px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {dealBreakers.length === 0 && overrides.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2
              className="h-3.5 w-3.5 text-emerald-600"
              strokeWidth={1.75}
            />
            No deal-breaker or floor overrides triggered.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
