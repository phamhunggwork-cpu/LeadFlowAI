import { Check, Clock, Layers, Sparkles } from 'lucide-react';
import { LeadIntakeForm } from '../components/LeadIntakeForm';

const CORE_CAPABILITIES = [
  'Custom Web Applications & SaaS MVPs (React, Next.js, Node.js)',
  'B2B Marketing & Corporate Websites',
  'Web App Redesign & Performance Optimization',
  'Third-party API & Database Integrations',
];

export function LeadIntakePage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-white">
                Veloce Digital
              </span>
              <span className="block text-xs text-slate-400">
                Boutique Web &amp; Software Studio
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Powered by LeadFlow AI
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <section className="space-y-8 lg:col-span-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Start a Project
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Build your next web product with a senior 12-person studio.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                We partner with Seed to Series A startups and growing SMBs to ship production
                SaaS MVPs, high-converting B2B sites, and reliable backend integrations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-sky-400" />
                Core Studio Services
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {CORE_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs font-medium text-slate-400">Typical Budget</span>
                <p className="mt-1 text-lg font-semibold text-white">$5k – $25k</p>
                <p className="mt-0.5 text-xs text-slate-500">Engagements start at $3k</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Typical Timeline
                </span>
                <p className="mt-1 text-lg font-semibold text-white">4 – 16 weeks</p>
                <p className="mt-0.5 text-xs text-slate-500">Weekly demos &amp; milestones</p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7">
            <LeadIntakeForm />
          </section>
        </div>
      </main>
    </div>
  );
}
