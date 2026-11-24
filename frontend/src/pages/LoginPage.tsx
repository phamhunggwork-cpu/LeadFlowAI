import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { VeloceLogo } from '@/components/VeloceLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

const SECURITY_GUARANTEES = [
  'Supabase Auth JWT verified server-side on every API route',
  'Deterministic JS scoring separates AI extraction from routing',
  'Zero outbound customer emails without explicit reviewer approval',
];

export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Reviewer Sign In — Veloce Digital | LeadFlow AI';
  }, []);

  if (session) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <VeloceLogo
              title="Veloce Digital"
              subtitle="LeadFlow AI · Internal Review Console"
            />
          </Link>

          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              Lead Intake Form
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-12">
        {/* Left Editorial Brand Panel */}
        <section className="hidden lg:col-span-6 lg:block">
          <Card className="overflow-hidden">
            <div className="relative h-64 w-full overflow-hidden border-b border-border bg-muted">
              <img
                src="/assets/veloce-hero-backdrop.jpg"
                alt="Veloce Digital light geometric visual"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6">
                <Badge variant="info" className="rounded-full px-3 py-1">
                  <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                  Human-in-the-Loop Approval Console
                </Badge>
                <h2 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-foreground">
                  Review AI qualifications with deterministic confidence.
                </h2>
              </div>
            </div>

            <CardContent className="space-y-3 p-6">
              <p className="text-sm leading-relaxed text-secondary-foreground">
                Inspect structured project extractions, verify 4-axis JS scoring
                rules, edit operational email drafts, and dispatch approved
                outreach safely.
              </p>
              <ul className="space-y-2.5 pt-1">
                {SECURITY_GUARANTEES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-xs font-medium text-secondary-foreground"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      strokeWidth={1.75}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Right Reviewer Sign-In Card */}
        <section className="mx-auto w-full max-w-md lg:col-span-6">
          <Card className="shadow-[0_8px_28px_-10px_rgba(15,23,42,0.08)]">
            <CardHeader className="p-6 pb-4 sm:p-7 sm:pb-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-info-border bg-info-soft text-primary">
                <Lock className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <CardTitle className="text-2xl">Sales Reviewer Sign In</CardTitle>
              <CardDescription className="text-sm">
                Sign in with your Supabase Auth reviewer account to inspect
                qualified leads and approve outbound emails.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-2 sm:p-7 sm:pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Work Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reviewer@velocedigital.io"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft p-3 text-xs text-danger"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      strokeWidth={1.75}
                    />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Signing in...' : 'Sign In to Dashboard'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
