---
trigger: model_decision
description: Apply whenever creating, editing, styling, or auditing React components, pages, CSS, typography, charts, or visual assets under frontend/.
---

# Rule: Frontend UI & Crisp Light SaaS Design System (`LeadFlow AI`)

1. **Read Design SSOT First:** Before writing or refactoring UI in `frontend/`, read `docs/DESIGN.md` and follow the **Crisp Light SaaS** design tokens (`--background`, `--card`, `--muted`, `--border`, `--primary`, semantic status tokens). Never introduce off-palette dark-neon gradients or arbitrary inline hex colors.
2. **Use Shared UI Primitives (`@/components/ui/*`):** Build every interactive element (buttons, inputs, selects, tabs, dialogs, badges, skeletons, tooltips, toasts, charts) from `frontend/src/components/ui/` (shadcn/ui + Radix UI + `lucide-react` + `recharts`) rather than re-inventing raw styled controls.
3. **Typography & Data Precision:**
   - Headings use `font-display` (`Plus Jakarta Sans`), UI copy uses `font-sans` (`Inter`), and all scores, KPI metrics, timestamps, and IDs (`submission_id`, `hubspot_contact_id`) MUST use `font-mono tabular-nums` (`JetBrains Mono`).
4. **Strict DB Enum & Security Fidelity:**
   - Status badges MUST map only to valid `LeadFlowAI.sql` enums (`lead_status`, `priority`, `approval_status`, `followup_status`, `email_messages.status`).
   - NEVER import, log, or reference `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_SECRET`, or `X-N8N-API-KEY` anywhere in `frontend/`.
5. **Responsive, Accessible & Complete States:**
   - Every view MUST handle `loading` (Skeleton), `empty`, and `error` states cleanly.
   - Verify zero horizontal overflow at both Desktop (`1440px`) and Mobile (`390px`), `>= 4.5:1` WCAG AA text contrast, visible keyboard focus rings, and `aria-label` on icon-only buttons.
6. **Mandatory Build & Visual Verification:**
   - Run `npm run typecheck` and `npm run build` inside `frontend/` after UI edits.
   - For layout or visual upgrades, run at least one **Visual Critique Loop** using `.agents/skills/leadflow-frontend-ui/SKILL.md` (Chrome DevTools MCP / Browser Subagent + `a11y-debugging`).
