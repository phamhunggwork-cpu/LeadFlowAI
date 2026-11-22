---
trigger: model_decision
description: Apply when creating, editing, syncing, or sanitizing n8n workflows, Code nodes, prompts, or n8n REST API scripts under n8n/.
---

# Rule: n8n Workflow & REST API Sync (`LeadFlow AI`)

1. **Load Official n8n Skills First:** Before designing or editing any n8n workflow/node, follow the installed `using-n8n-skills-official` routing protocol (`n8n-node-configuration-official`, `n8n-code-nodes-official`, `n8n-expressions-official`, `n8n-error-handling-official`).
2. **Modular Source Layout:**
   - Workflow definitions: `n8n/workflows/wf01-lead-intake-qualification.json` .. `wf04-error-handling.json`.
   - Reusable JS logic: `n8n/code-nodes/*.js` (pure, testable deterministic functions — especially validation/normalization and 0–100 scoring).
   - LLM prompts: `n8n/prompts/*.md` (versioned to match `lead_analyses.prompt_version`).
3. **AI vs. Deterministic Split:** Never let an LLM node calculate `qualification_score`, `qualification_status`, or `priority`. Enforce strict JSON output and validate before any Supabase write.
4. **Full Replacement Warning (`PUT`):** n8n Public REST API `PUT /api/v1/workflows/{id}` replaces the entire workflow. Always push complete definitions via `node --env-file=.env n8n/scripts/sync-workflows.ts --push` (and inspect `--dry-run` first).
5. **Webhook & Idempotency Safety:**
   - Every webhook trigger must validate the shared `x-webhook-secret` header.
   - WF01 must deduplicate on `inquiries.submission_id`; WF02/WF03 must enforce `email_messages.idempotency_key` and Resend `Idempotency-Key`.
6. **Mandatory Pre-Commit Sanitization:** Before staging any `n8n/workflows/*.json`, activate skill `leadflow-n8n-sanitize` to confirm zero leaked secrets, tokens, personal emails, or live private URLs.
