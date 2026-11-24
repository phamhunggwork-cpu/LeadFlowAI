import {
  Check,
  Clock,
  DollarSign,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LeadIntakeForm } from '@/components/LeadIntakeForm';
import { VeloceLogo } from '@/components/VeloceLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const CORE_CAPABILITIES = [
  'Custom Web Applications & SaaS MVPs (React, Next.js, Node.js)',
  'High-Converting B2B Marketing & Corporate Websites',
  'Web App Redesign & Core Web Vitals Optimization',
  'Third-Party API, CRM & Database Integrations',
];

export function LeadIntakePage() {
  useEffect(() => {
    document.title = 'Veloce Digital — Start a Project | LeadFlow AI';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Crisp Light Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <VeloceLogo />
          </Link>

          <div className="flex shrink-0 items-center gap-2.5">
            <Badge
              variant="neutral"
              className="hidden rounded-full px-3 py-1 font-medium sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Powered by LeadFlow AI
            </Badge>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/dashboard">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                Review Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Studio Context Column */}
          <section className="space-y-6 lg:col-span-5">
            <div className="space-y-3">
              <Badge variant="info" className="rounded-full px-3 py-1">
                <Sparkles className="h-3 w-3" strokeWidth={2} />
                Start a Project
              </Badge>
              <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl">
                Ship your next web product with a senior{' '}
                <span className="whitespace-nowrap">12-person</span> studio.
              </h1>
              <p className="text-sm leading-relaxed text-secondary-foreground">
                We partner with Seed to Series A startups and growing B2B teams to
                architect production SaaS MVPs, refined marketing sites, and
                reliable workflow integrations.
              </p>
            </div>

            {/* Brand Visual Accent + Key Studio Metrics */}
            <Card className="overflow-hidden">
              <div className="relative h-36 w-full overflow-hidden border-b border-border bg-muted">
                <img
                  src="/assets/veloce-hero-backdrop.jpg"
                  alt="Veloce Digital architectural studio backdrop"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs">
                    Senior Engineering Pods
                  </span>
                  <span className="rounded-md border border-success-border bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-success shadow-xs">
                    &lt; 24h Response
                  </span>
                </div>
              </div>

              <CardContent className="grid grid-cols-2 divide-x divide-border p-0">
                <div className="p-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                    Typical Budget
                  </span>
                  <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-foreground">
                    $5k – $25k
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Engagements start at $3k
                  </p>
                </div>

                <div className="p-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                    Typical Timeline
                  </span>
                  <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-foreground">
                    4 – 16 wks
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Weekly milestone demos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Core Studio Services */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  Core Studio Services
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ul className="space-y-2.5">
                  {CORE_CAPABILITIES.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-secondary-foreground"
                    >
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-info-soft text-primary">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Right Form Column */}
          <section className="lg:col-span-7">
            <LeadIntakeForm />
          </section>
        </div>
      </main>
    </div>
  );
}
