import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChartConfig() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) {
    throw new Error('useChartConfig must be used inside a <ChartContainer>');
  }
  return ctx.config;
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

export function ChartContainer({
  config,
  className,
  children,
  style,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      vars[`--color-${key}`] = value.color;
    }
    return vars;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          'w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-polar-grid_line]:stroke-border [&_.recharts-surface]:outline-none',
          className,
        )}
        style={{ ...cssVars, ...style }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueFormatter?: (value: number | string, item: TooltipPayloadItem) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
}: ChartTooltipContentProps) {
  const config = useChartConfig();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[0_8px_24px_-6px_rgba(15,23,42,0.14)]">
      {label && (
        <div className="mb-1.5 font-display text-xs font-semibold text-foreground">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const key = String(item.dataKey ?? item.name ?? idx);
          const itemConfig = config[key];
          const displayLabel = itemConfig?.label ?? item.name ?? key;
          const dotColor = itemConfig?.color ?? item.color ?? 'var(--primary)';
          const formattedValue =
            valueFormatter && item.value !== undefined
              ? valueFormatter(item.value, item)
              : String(item.value ?? '');

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                {displayLabel}
              </span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
