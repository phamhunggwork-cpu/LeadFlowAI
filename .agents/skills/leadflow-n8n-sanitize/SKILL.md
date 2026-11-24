---
name: leadflow-n8n-sanitize
description: >-
  Use before committing or exporting any n8n workflow JSON under n8n/workflows/
  to verify canonical naming, valid JSON structure, and zero leaked secrets,
  credentials, or personal endpoints.
---

# Skill: LeadFlow n8n Workflow Sanitizer & Pre-Commit Check

Follow these steps whenever an `n8n/workflows/*.json` file is created, exported, or updated before running `git add`.

## Steps

1. **Verify Canonical Filenames** (per `docs/setup/git-workflow.md`):
   - `n8n/workflows/wf01-lead-intake-qualification.json`
   - `n8n/workflows/wf02-human-approval-email.json`
   - `n8n/workflows/wf03-automated-followup.json`
   - `n8n/workflows/wf04-error-handling.json`

2. **Validate JSON Syntax & Required Top-Level Keys:**
   Run:
   ```powershell
   node -e "const fs=require('fs'),p=require('path'); for (const f of fs.readdirSync('n8n/workflows').filter(x=>x.endsWith('.json'))) { const d=JSON.parse(fs.readFileSync(p.join('n8n/workflows',f),'utf8')); for (const k of ['name','nodes','connections']) if (!(k in d)) throw new Error(f+': missing '+k); console.log('OK:', f, '('+d.nodes.length+' nodes)'); }"
   ```

3. **Scan for Secret & PII Leaks:**
   Search all `n8n/workflows/*.json` for forbidden patterns and verify zero matches:
   - API keys / tokens: `sk-`, `re_`, `pat-`, `xoxb-`, `xoxp-`, `eyJ` (JWT), `n8n_api_`
   - Live private webhooks / hosts: `hooks.slack.com/services/`, real `.supabase.co` project URLs, hardcoded `x-webhook-secret` literal values
   - Personal email addresses (only synthetic `@velocedigital.test` / `@example.com` / mock leads allowed)

4. **Sanitize Sensitive Fields:**
   - Replace hardcoded credential IDs or secrets with descriptive credential names/placeholders (e.g. `Supabase LeadFlow`, `DeepSeek LeadFlow`, `HubSpot Service Key account`, `Slack LeadFlow`, `Resend LeadFlow`) and use n8n expressions (`={{ $env.N8N_WEBHOOK_SECRET }}`) where appropriate.
   - Remove `pinData` containing real user/customer payloads or tokens before committing.

5. **Confirm Clean Diff:**
   Run `git diff n8n/workflows/` and visually verify no secret string or raw token appears in added lines.
