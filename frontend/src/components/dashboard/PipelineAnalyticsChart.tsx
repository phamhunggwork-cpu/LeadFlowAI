import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
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
import type { InquirySummaryCounts } from '@/types/dashboard';

interface Props {
  summary: InquirySummaryCounts;
}

const PIPELINE_CHART_CONFIG: ChartConfig = {
  count: { label: 'Leads', color: '#2563eb' },
};

export function PipelineAnalyticsChart({ summary }: Props) {
  const data = [
    { stage: 'Pending', count: summary.pending_approval, fill: '#f59e0b' },
    { stage: 'Qualified', count: summary.qualified, fill: '#10b981' },
    { stage: 'Review', count: summary.needs_review, fill: '#2563eb' },
    {
      stage: 'Contacted',
      count: summary.contacted + summary.replied,
      fill: '#0ea5e9',
    },
    { stage: 'Won', count: summary.won, fill: '#047857' },
    { stage: 'Not Qual.', count: summary.not_qualified, fill: '#f43f5e' },
  ];

  const total = summary.total || 0;
  const qualifiedRate =
    total > 0
      ? Math.round(
          ((summary.qualified + summary.contacted + summary.replied + summary.won) /
            total) *
            100,
        )
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Lead Pipeline Distribution
          </CardTitle>
          <CardDescription className="mt-1">
            Live breakdown across deterministic qualification &amp; HITL stages
          </CardDescription>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            {qualifiedRate}%
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">
            Qualified + Active
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={PIPELINE_CHART_CONFIG} className="h-[150px]">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            barCategoryGap="24%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) => `${value} leads`}
                />
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {data.map((entry) => (
                <Cell key={entry.stage} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
