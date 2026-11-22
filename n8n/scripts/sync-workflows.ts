/**
 * LeadFlow AI — Local n8n Public REST API Workflow Sync Utility
 *
 * Usage (Node 24+ native TS + --env-file):
 *   node --env-file=.env n8n/scripts/sync-workflows.ts --check
 *   node --env-file=.env n8n/scripts/sync-workflows.ts --dry-run [all|<filename>]
 *   node --env-file=.env n8n/scripts/sync-workflows.ts --push [all|<filename>] [--backup]
 *   node --env-file=.env n8n/scripts/sync-workflows.ts --pull <workflowId> <outputPath>
 *
 * Notes:
 * - Uses official n8n Public REST API (`X-N8N-API-KEY`).
 * - PUT /api/v1/workflows/{id} performs a FULL REPLACEMENT — always keep complete
 *   definitions in n8n/workflows/*.json and run --dry-run before --push.
 */

import fs from 'node:fs';
import path from 'node:path';

interface N8nWorkflowPayload {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: unknown;
}

interface RemoteWorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  updatedAt?: string;
}

const WORKFLOWS_DIR = path.resolve(process.cwd(), 'n8n', 'workflows');
const BACKUP_DIR = path.resolve(process.cwd(), 'tmp', 'n8n-backup');

function getConfig() {
  const baseUrl = (process.env.N8N_API_BASE_URL || 'http://localhost:5678/api/v1').replace(/\/+$/, '');
  const apiKey = process.env.N8N_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('replace_with_')) {
    throw new Error('Missing or placeholder N8N_API_KEY in environment (.env).');
  }
  return { baseUrl, apiKey };
}

async function n8nRequest<T>(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`n8n API ${method} ${endpoint} failed (${response.status}): ${text.slice(0, 400)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

async function listRemoteWorkflows(): Promise<RemoteWorkflowSummary[]> {
  const results: RemoteWorkflowSummary[] = [];
  let cursor: string | undefined;

  do {
    const query = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : '?limit=100';
    const page = await n8nRequest<{ data?: RemoteWorkflowSummary[]; nextCursor?: string | null }>(
      'GET',
      `/workflows${query}`,
    );
    if (Array.isArray(page.data)) {
      results.push(...page.data);
    }
    cursor = page.nextCursor || undefined;
  } while (cursor);

  return results;
}

function loadLocalWorkflow(filePath: string): N8nWorkflowPayload {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error(`${path.basename(filePath)}: missing non-empty "name"`);
  }
  if (!Array.isArray(raw.nodes)) {
    throw new Error(`${path.basename(filePath)}: missing "nodes" array`);
  }
  if (!raw.connections || typeof raw.connections !== 'object') {
    throw new Error(`${path.basename(filePath)}: missing "connections" object`);
  }

  return {
    name: raw.name.trim(),
    nodes: raw.nodes,
    connections: raw.connections as Record<string, unknown>,
    settings:
      raw.settings && typeof raw.settings === 'object'
        ? (raw.settings as Record<string, unknown>)
        : { executionOrder: 'v1' },
  };
}

function resolveTargetFiles(targetArg?: string): string[] {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    throw new Error(`Workflows directory not found: ${WORKFLOWS_DIR}`);
  }
  if (!targetArg || targetArg === 'all') {
    return fs
      .readdirSync(WORKFLOWS_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => path.join(WORKFLOWS_DIR, f));
  }
  const direct = path.isAbsolute(targetArg) ? targetArg : path.join(WORKFLOWS_DIR, targetArg);
  const withExt = direct.endsWith('.json') ? direct : `${direct}.json`;
  if (fs.existsSync(withExt)) return [withExt];

  const matched = fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.json') && f.toLowerCase().includes(targetArg.toLowerCase()))
    .map((f) => path.join(WORKFLOWS_DIR, f));
  if (matched.length === 0) {
    throw new Error(`No workflow JSON matching "${targetArg}" in ${WORKFLOWS_DIR}`);
  }
  return matched;
}

async function backupRemoteWorkflow(id: string, name: string): Promise<string> {
  const full = await n8nRequest<Record<string, unknown>>('GET', `/workflows/${encodeURIComponent(id)}`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(BACKUP_DIR, `${safeName}_${id}_${stamp}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(full, null, 2)}\n`, 'utf8');
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--check';

  if (command === '--check') {
    const workflows = await listRemoteWorkflows();
    console.log(`Connected to n8n REST API successfully. Remote workflows: ${workflows.length}`);
    for (const wf of workflows) {
      console.log(`  - [${wf.active ? 'ACTIVE' : 'INACTIVE'}] ${wf.name} (id=${wf.id})`);
    }
    return;
  }

  if (command === '--pull') {
    const wfId = args[1];
    const outPath = args[2];
    if (!wfId || !outPath) {
      throw new Error('Usage: --pull <workflowId> <outputPath>');
    }
    const remote = await n8nRequest<Record<string, unknown>>('GET', `/workflows/${encodeURIComponent(wfId)}`);
    const resolved = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, `${JSON.stringify(remote, null, 2)}\n`, 'utf8');
    console.log(`Pulled workflow id=${wfId} -> ${outPath}`);
    console.log('REMINDER: Run leadflow-n8n-sanitize before committing this JSON.');
    return;
  }

  if (command === '--dry-run' || command === '--push') {
    const isPush = command === '--push';
    const shouldBackup = args.includes('--backup');
    const targetArg = args.slice(1).find((a) => !a.startsWith('--'));
    const files = resolveTargetFiles(targetArg);

    if (files.length === 0) {
      console.log('No workflow JSON files found in n8n/workflows/. Nothing to sync yet.');
      return;
    }

    const remoteList = await listRemoteWorkflows();
    const byName = new Map(remoteList.map((w) => [w.name, w]));

    for (const file of files) {
      const payload = loadLocalWorkflow(file);
      const existing = byName.get(payload.name);
      const action = existing ? `PUT /workflows/${existing.id}` : 'POST /workflows';

      if (!isPush) {
        console.log(`[DRY-RUN] ${path.basename(file)} -> ${action} ("${payload.name}", ${payload.nodes.length} nodes)`);
        continue;
      }

      if (existing && shouldBackup) {
        const backupFile = await backupRemoteWorkflow(existing.id, existing.name);
        console.log(`[BACKUP] Saved previous remote workflow -> ${path.relative(process.cwd(), backupFile)}`);
      }

      const result = existing
        ? await n8nRequest<RemoteWorkflowSummary>('PUT', `/workflows/${encodeURIComponent(existing.id)}`, payload)
        : await n8nRequest<RemoteWorkflowSummary>('POST', '/workflows', payload);

      console.log(`[SYNCED] ${path.basename(file)} -> ${action} => id=${result.id} (active=${result.active})`);
    }
    return;
  }

  throw new Error(`Unknown command "${command}". Use --check, --dry-run, --push, or --pull.`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[sync-workflows] ERROR: ${message}`);
  process.exit(1);
});
