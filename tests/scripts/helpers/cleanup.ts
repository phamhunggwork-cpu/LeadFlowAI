import type { SupabaseClient } from '@supabase/supabase-js';

export interface CleanupSummary {
  workflow_errors: number;
  activity_logs: number;
  email_messages: number;
  lead_analyses: number;
  inquiries: number;
  contacts: number;
}

/**
 * Deletes ONLY records tagged with the current test run prefix in strict FK-safe order:
 * workflow_errors -> activity_logs -> email_messages -> lead_analyses -> inquiries -> contacts
 */
export async function cleanupTestRun(
  sb: SupabaseClient,
  runPrefix: string,
): Promise<CleanupSummary> {
  if (!runPrefix || runPrefix.length < 8) {
    throw new Error(`Refusing cleanup with unsafe runPrefix: "${runPrefix}"`);
  }

  const summary: CleanupSummary = {
    workflow_errors: 0,
    activity_logs: 0,
    email_messages: 0,
    lead_analyses: 0,
    inquiries: 0,
    contacts: 0,
  };

  const { data: inqs, error: inqErr } = await sb
    .from('inquiries')
    .select('id')
    .like('submission_id', `${runPrefix}%`);
  if (inqErr) throw inqErr;

  const inquiryIds = (inqs ?? []).map((row) => row.id as string);

  if (inquiryIds.length > 0) {
    for (const table of [
      'workflow_errors',
      'activity_logs',
      'email_messages',
      'lead_analyses',
    ] as const) {
      const { error, count } = await sb
        .from(table)
        .delete({ count: 'exact' })
        .in('inquiry_id', inquiryIds);
      if (error) throw error;
      summary[table] += count ?? 0;
    }
  }

  // Also catch any workflow_errors linked by submission_id without inquiry_id
  const { error: errSub, count: errSubCount } = await sb
    .from('workflow_errors')
    .delete({ count: 'exact' })
    .like('submission_id', `${runPrefix}%`);
  if (errSub) throw errSub;
  summary.workflow_errors += errSubCount ?? 0;

  if (inquiryIds.length > 0) {
    const { error: delInqErr, count: delInqCount } = await sb
      .from('inquiries')
      .delete({ count: 'exact' })
      .in('id', inquiryIds);
    if (delInqErr) throw delInqErr;
    summary.inquiries = delInqCount ?? 0;
  }

  const { error: delContactErr, count: delContactCount } = await sb
    .from('contacts')
    .delete({ count: 'exact' })
    .ilike('email', `delivered+${runPrefix}%@resend.dev`);
  if (delContactErr) throw delContactErr;
  summary.contacts = delContactCount ?? 0;

  return summary;
}
