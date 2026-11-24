# DESIGN.md — LeadFlow AI (Veloce Digital) Design System

> **Visual Direction:** **Crisp Light SaaS** (inspired by Attio, Stripe, and Linear Light)
> **Brand:** **Veloce Digital** — Boutique 12-person Web & Software Engineering Studio
> **Purpose:** Single Source of Truth for visual design tokens, typography, component hierarchy, data visualization, and UI polish across `frontend/` (compatible with Google Stitch MCP and Mobbin redesign workflows).

---

## 1. Brand Personality & Design Principles

1. **Precision Over Decoration:** Every element earns its pixels. Favor razor-sharp `1px` hairlines, generous whitespace, and clear typographic hierarchy over heavy drop shadows or ornamental gradients.
2. **High-Trust Editorial Light:** Pure white elevated workspaces (`#FFFFFF`) resting on a subtle cool-alabaster canvas (`#F8FAFC`) project engineering rigor and executive clarity for B2B buyers and sales reviewers.
3. **Deterministic Clarity:** Because LeadFlow AI separates AI semantic extraction from deterministic JS scoring (`0–100`), numeric scores, status enums, and audit metadata MUST look unmistakably factual using `JetBrains Mono` + `tabular-nums`.
4. **Action-First HITL Ergonomics:** In the Human Approval Dashboard, reviewers must immediately scan *Lead Identity → Deterministic Score → AI Recommendation → Email Draft → Approve / Reject* within 2 seconds without visual clutter.

---

## 2. Color System (Crisp Light SaaS Semantic Tokens)

All colors MUST be consumed via Tailwind CSS v4 `@theme inline` tokens defined in `frontend/src/index.css` — never scatter arbitrary hex codes inside components.

### Surfaces & Neutrals
| Token | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| Canvas Background | `--background` | `#F8FAFC` | App shell background (`slate-50`) |
| Elevated Surface | `--card` | `#FFFFFF` | Primary cards, detail panes, modals, form containers |
| Subtle Surface | `--muted` | `#F1F5F9` | Inset panels, table headers, skeleton loaders, secondary chips |
| Hover Surface | `--accent` | `#F1F5F9` | List item hover, subtle toolbar button hover |
| Hairline Border | `--border` | `#E2E8F0` | Card borders, dividers, panel splits (`1px solid`) |
| Input Border | `--input` | `#CBD5E1` | Form input borders (focus switches to `--ring`) |

### Ink & Typography
| Token | CSS Variable | Hex / Value | Contrast on `#FFFFFF` | Usage |
| :--- | :--- | :--- | :---: | :--- |
| Primary Ink | `--foreground` | `#0F172A` | `17.8:1` (AAA) | Headings, primary values, strong labels |
| Secondary Ink | `--secondary-foreground` | `#334155` | `10.7:1` (AAA) | Body copy, form labels, email draft text |
| Muted Ink | `--muted-foreground` | `#64748B` | `4.8:1` (AA) | Metadata, helper text, timestamps, axis captions |

### Brand & Interactive Accents
| Token | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| Brand Primary | `--primary` | `#2563EB` | Primary CTAs (*Submit Project*, *Approve & Send*), active nav indicators, chart primary series |
| Brand Primary Hover | `--primary-hover` | `#1D4ED8` | Hover state for primary buttons |
| Primary Ink | `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| Focus Ring | `--ring` | `#2563EB` | Accessible `2px` focus-visible ring with `2px` offset |
| Destructive | `--destructive` | `#DC2626` | Reject actions, deal-breaker alerts, workflow failures |

### Semantic Status Palette (Strictly Aligned to `LeadFlowAI.sql` Enums)
Use soft tinted pill surfaces with crisp `1px` borders and high-contrast `700`-weight ink (never neon glowing dark-mode badges):

| Domain State | Background | Border | Text Ink |
| :--- | :--- | :--- | :--- |
| `qualified` / `approved` / `sent` / `won` | `#ECFDF5` (`emerald-50`) | `#A7F3D0` (`emerald-200`) | `#047857` (`emerald-700`) |
| `needs_review` / `pending` / `pending_approval` / `medium` | `#FFFBEB` (`amber-50`) | `#FDE68A` (`amber-200`) | `#B45309` (`amber-700`) |
| `not_qualified` / `rejected` / `failed` / `high` (alert) | `#FEF2F2` (`rose-50`) | `#FECDD3` (`rose-200`) | `#BE123C` (`rose-700`) |
| `contacted` / `replied` / `queued` / `scheduled` / `processing` | `#EFF6FF` (`blue-50`) | `#BFDBFE` (`blue-200`) | `#1D4ED8` (`blue-700`) |
| `new` / `draft` / `not_required` / `closed` / `cancelled` / `low` | `#F8FAFC` (`slate-50`) | `#E2E8F0` (`slate-200`) | `#475569` (`slate-600`) |

---

## 3. Typography System

Loaded via Google Fonts in `frontend/index.html` and mapped via `@theme inline`:

| Role | Font Family | Weights | Tracking / Features | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Headings** (`--font-display`) | `Plus Jakarta Sans`, `Inter`, sans-serif | `600`, `700` | `-0.02em` tight tracking | Page titles, hero headlines, section headers, brand wordmark |
| **UI Body** (`--font-sans`) | `Inter`, system-ui, sans-serif | `400`, `500`, `600` | `cv02`, `cv03`, `cv04`, `cv11` | Form fields, descriptions, email copy, list items, buttons |
| **Data / Technical** (`--font-mono`) | `JetBrains Mono`, ui-monospace, monospace | `400`, `500`, `600` | `tabular-nums` | Qualification scores (`87/100`), KPI numbers, `submission_id`, `hubspot_contact_id`, timestamps, error logs |

### Typographic Scale
- **Hero Display (Lead Intake):** `32px–40px` (`text-3xl sm:text-4xl`), `font-display font-bold leading-[1.15]`
- **Page Title (Dashboard / Login):** `20px–24px` (`text-xl sm:text-2xl`), `font-display font-semibold`
- **Card / Section Header:** `14px–15px` (`text-sm`), `font-display font-semibold text-foreground`
- **Body / Controls:** `13px–14px` (`text-sm`), `font-sans text-secondary-foreground`
- **Metadata / Micro Labels:** `11px–12px` (`text-xs`), `font-sans font-medium text-muted-foreground`

---

## 4. Layout, Spacing & Elevation

- **Base Grid:** Strict `4px` spacing scale (`gap-2`, `gap-3`, `gap-4`, `p-4`, `p-5`, `p-6`).
- **Border Radius:**
  - Cards & Panels: `12px` (`rounded-xl`)
  - Inputs, Buttons, Tabs: `8px` (`rounded-lg`)
  - Status Badges & Chips: `6px` (`rounded-md`) or full pill (`rounded-full`) for compact priority/count chips
- **Elevation (Light-Mode Subtlety):**
  - Default cards use `bg-card border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)]`.
  - Popovers / Dialogs / Dropdowns use `shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)]`.
  - Never nest more than **2 bordered card layers** deep — use subtle `bg-muted/60` inset blocks or `Separator` hairlines instead.
- **Dashboard Master-Detail Proportions:**
  - Top bar: `56px` height, sticky white surface with bottom `1px` hairline.
  - KPI + Pipeline Strip: Compact single row on desktop (`grid-cols-2 lg:grid-cols-5` + slim pipeline distribution chart).
  - Workspace split: Left queue column `360px–400px` (`lg:col-span-4`), Right detail workstation fluid (`lg:col-span-8`).

---

## 5. Component Library & Data Visualization Standards

### UI Primitives (`frontend/src/components/ui/`)
Built on **shadcn/ui + Radix UI + `lucide-react` + `sonner`**:
- Always use `@/components/ui/button`, `card`, `badge`, `input`, `textarea`, `label`, `select`, `tabs`, `dialog`, `tooltip`, `separator`, `skeleton`, `chart`, `sonner`.
- Standard Lucide icon stroke: `strokeWidth={1.75}` (`h-4 w-4` inline/buttons, `h-3.5 w-3.5` badges).
- Destructive or irreversible HITL actions (**Approve & Send Email**, **Reject Lead**) SHOULD surface crisp confirmation feedback (`Dialog` or clear loading state + `sonner` toast).

### Data Visualization (`Recharts` + `@/components/ui/chart`)
1. **Deterministic Score Breakdown (`ScoreBreakdownCard`):**
   - **Radial Score Gauge (`0–100`)** using Recharts `RadialBarChart` with centered `JetBrains Mono` score readout and threshold semantic coloring (`>= 75` emerald `#10B981`, `45–74` amber `#F59E0B`, `< 45` rose `#F43F5E`).
   - **4-Axis Normalized Breakdown (`BarChart` / segmented bars)** displaying `Service Fit (/30)`, `Budget Fit (/30)`, `Timeline Fit (/20)`, and `Project Clarity (/20)` with interactive hover tooltip showing exact points, percentage, and JS rule reason.
2. **Pipeline Analytics (`PipelineAnalyticsChart`):**
   - Clean horizontal stacked/grouped Recharts summary bar visualizing lead distribution (`Qualified`, `Needs Review`, `Not Qualified`, `Contacted / Won`) with crisp light-mode tooltip and legend.
3. **Chart Hygiene:** Always wrap charts in `ResponsiveContainer` (via `ChartContainer`), disable noisy chart gridlines or use ultra-light `#E2E8F0` dashed lines, and never allow SVG labels to clip on `390px` viewports.

---

## 6. Anti-AI-Slop Checklist (Mandatory Pre-Ship Rules)

Before marking any UI work complete, verify ALL of the following:
- [ ] **No generic AI purple/cyan dark gradients** or glowing neon shadows — stick strictly to the Crisp Light SaaS palette.
- [ ] **No card-inside-card-inside-card clutter** — max 2 border depths; use `Separator` or `bg-muted/50` for sub-sections.
- [ ] **Real numeric alignment** — every score, counter, and timestamp uses `font-mono tabular-nums`.
- [ ] **Complete states** — every async panel renders `Skeleton` loading, illustrated or helpful empty state, and actionable error banner/toast.
- [ ] **Zero truncation breakage** — long emails, company names, and URLs use `truncate` or `break-words` so horizontal overflow never occurs at `390px` or `1440px`.
- [ ] **WCAG AA Accessibility** — text contrast `>= 4.5:1`, keyboard `Tab` focus rings visible, every icon-only button has `aria-label`.
