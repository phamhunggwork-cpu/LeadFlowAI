---
name: leadflow-frontend-ui
description: >-
  Use when designing, building, redesigning, or visually auditing LeadFlow AI
  frontend screens (Lead Intake, Login, Human Approval Dashboard) using
  docs/DESIGN.md, shadcn/ui + Radix UI + Recharts, Mobbin/Stitch references,
  and the Chrome DevTools / Browser Visual Critique Loop.
---

# Skill: LeadFlow Frontend UI & Visual Critique Loop

Follow this structured workflow for every frontend screen creation, redesign, or visual polish task in `frontend/`.

## Step 1 — Reference & Design Alignment (Before Writing Code)
1. Read `docs/DESIGN.md` to anchor the **Crisp Light SaaS** palette, typography (`Plus Jakarta Sans` + `Inter` + `JetBrains Mono`), spacing, and Anti-AI-Slop rules.
2. When redesigning a major screen (Dashboard, Lead Intake, Login), optionally gather grounded UI references first:
   - **Mobbin MCP (`search_screens` / `redesign-screen` skill):** Inspect 3–5 real-world B2B SaaS / CRM inbox / approval flows and extract up to 3 concrete layout improvements.
   - **Stitch MCP (`create_design_system_from_design_md` / `generate_screen_from_text`):** Explore layout variants synchronized with `docs/DESIGN.md`.
3. Confirm all domain invariants remain intact:
   - `frontend/` uses `VITE_SUPABASE_ANON_KEY` only.
   - Status enums strictly match `database/schema/LeadFlowAI.sql`.
   - Operational email editing targets `email_messages`; `lead_analyses.draft_email` remains read-only audit snapshot.

## Step 2 — Implement with Approved UI Materials
1. Assemble layouts exclusively from `@/components/ui/*` primitives (`button`, `card`, `badge`, `input`, `textarea`, `select`, `tabs`, `dialog`, `tooltip`, `separator`, `skeleton`, `chart`, `sonner`) and semantic Tailwind v4 tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`).
2. Use `lucide-react` with consistent stroke (`strokeWidth={1.75}`, `h-4 w-4` default) and `Recharts` wrapped in `@/components/ui/chart` for score breakdowns and pipeline KPI visuals.
3. For custom brand graphics or empty-state illustrations, generate cohesive light-mode assets with `image-generator` and store them under `frontend/public/assets/`.
4. Keep changes scoped cleanly to 1 screen or component group per pass so Before/After visual verification is unambiguous.

## Step 3 — Technical Gate (Before Visual Audit)
Run inside `frontend/`:
```powershell
npm run typecheck
npm run build
```
Also verify zero leaked backend secrets in `frontend/src/`:
```powershell
Select-String -Path frontend/src/**/* -Pattern "SERVICE_ROLE|WEBHOOK_SECRET|N8N_API_KEY"
```

## Step 4 — Visual Critique Loop (Live Browser Audit — Max 2–3 Passes)
With `backend` (port `4000`) and `frontend` (port `5173`) running locally, inspect the live rendered app using **Chrome DevTools MCP** (plus `a11y-debugging` skill) or the **Browser Subagent** (`/browser`):

1. **Capture Both Viewports:** Inspect target routes (`/`, `/login`, `/dashboard`, `/inquiries/:id`) at:
   - Desktop: `1440×900`
   - Mobile: `390×844`
2. **Audit Against the 6-Point Rubric:**
   - **Visual Hierarchy:** Primary focal point (Lead Name → Score → Approve/Reject CTA) is scannable in < 2 seconds.
   - **Spacing & Alignment:** Consistent `4px/8px` grid rhythm; icons, labels, and badges sit on clean baselines; max 2 nested card borders.
   - **Typography & Data Density:** `Plus Jakarta Sans` headings, `Inter` body, `JetBrains Mono tabular-nums` on all scores/KPIs/IDs; long strings truncate cleanly.
   - **Contrast & Accessibility (`a11y-debugging`):** Text contrast `>= 4.5:1` (WCAG AA), visible focus rings on keyboard `Tab`, `aria-label` on icon-only controls, semantic landmarks.
   - **Responsive Integrity:** `document.documentElement.scrollWidth <= window.innerWidth` (zero horizontal overflow) at both `1440px` and `390px`.
   - **States & Runtime Hygiene:** Proper Skeleton loading, helpful empty states, clear error feedback, and **0 browser console errors / unexpected 4xx–5xx responses**.
3. **Prioritize Top 5 Issues Only:** List at most 5 highest-impact issues per pass (`P0` broken layout/contrast/runtime, `P1` visual imbalance/hierarchy, `P2` micro-polish) with exact file/CSS root causes.
4. **Fix & Re-Verify:** Apply targeted fixes, re-capture the same viewport(s), and confirm every listed issue is resolved. Stop once `0` P0/P1 issues remain (cap at 3 passes per screen).
