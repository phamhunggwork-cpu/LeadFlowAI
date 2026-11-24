import { cn } from '@/lib/utils';

interface VeloceLogoProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function VeloceLogo({
  title = 'Veloce Digital',
  subtitle = 'Boutique Web & Software Studio',
  className,
}: VeloceLogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5.5 7.5L12 18L18.5 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <span className="block truncate font-display text-sm font-bold tracking-tight text-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="hidden truncate text-xs text-muted-foreground sm:block">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
