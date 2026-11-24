import {
  AlertTriangle,
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { InquiryDetailPanel } from '../components/dashboard/InquiryDetailPanel';
import {
  ApprovalBadge,
  LeadStatusBadge,
  PriorityBadge,
  formatBudgetRange,
  formatDateTime,
} from '../components/dashboard/StatusBadges';
import { useAuth } from '../context/AuthContext';
import {
  approveInquiry,
  fetchInquiries,
  fetchInquiryDetail,
  fetchWorkflowErrors,
  rejectInquiry,
  updateInquiryStatus,
} from '../services/api';
import type {
  ApprovalStatus,
  InquiryDetailResponse,
  InquiryFilters,
  InquiryListItem,
  InquirySummaryCounts,
  LeadStatus,
  ManualLeadStatus,
  Priority,
  WorkflowErrorRecord,
} from '../types/dashboard';

type ActiveTab = 'inquiries' | 'errors';

const EMPTY_SUMMARY: InquirySummaryCounts = {
  total: 0,
  pending_approval: 0,
  qualified: 0,
  needs_review: 0,
  not_qualified: 0,
  contacted: 0,
  replied: 0,
  closed: 0,
  won: 0,
  open_workflow_errors: 0,
};

export function DashboardPage() {
  const { id: routeInquiryId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, accessToken, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('inquiries');
  const [filters, setFilters] = useState<InquiryFilters>({
    status: '',
    priority: '',
    approval_status: '',
    search: '',
  });

  const [inquiries, setInquiries] = useState<InquiryListItem[]>([]);
  const [summary, setSummary] = useState<InquirySummaryCounts>(EMPTY_SUMMARY);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] =
    useState<InquiryDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [workflowErrors, setWorkflowErrors] = useState<WorkflowErrorRecord[]>([]);
  const [errorFilterStatus, setErrorFilterStatus] = useState<
    'open' | 'resolved' | ''
  >('open');
  const [errorsLoading, setErrorsLoading] = useState(false);

  const loadInquiries = useCallback(async () => {
    if (!accessToken) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await fetchInquiries(accessToken, filters);
      setInquiries(data.items);
      setSummary(data.summary);

      // Auto-select the first inquiry on /dashboard if none is selected
      if (!routeInquiryId && data.items.length > 0 && activeTab === 'inquiries') {
        navigate(`/inquiries/${data.items[0].id}`, { replace: true });
      }
    } catch (err: unknown) {
      setListError(
        err instanceof Error ? err.message : 'Failed to load inquiries.',
      );
    } finally {
      setListLoading(false);
    }
  }, [accessToken, filters, routeInquiryId, activeTab, navigate]);

  const loadDetail = useCallback(
    async (inquiryId: string) => {
      if (!accessToken) return;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await fetchInquiryDetail(accessToken, inquiryId);
        setSelectedDetail(data);
      } catch (err: unknown) {
        setSelectedDetail(null);
        setDetailError(
          err instanceof Error ? err.message : 'Failed to load inquiry detail.',
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken],
  );

  const loadErrors = useCallback(async () => {
    if (!accessToken) return;
    setErrorsLoading(true);
    try {
      const data = await fetchWorkflowErrors(accessToken, errorFilterStatus);
      setWorkflowErrors(data.items);
    } catch {
      setWorkflowErrors([]);
    } finally {
      setErrorsLoading(false);
    }
  }, [accessToken, errorFilterStatus]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    if (routeInquiryId) {
      loadDetail(routeInquiryId);
    } else {
      setSelectedDetail(null);
      setDetailError(null);
    }
  }, [routeInquiryId, loadDetail]);

  useEffect(() => {
    if (activeTab === 'errors') {
      loadErrors();
    }
  }, [activeTab, loadErrors]);

  async function handleRefresh() {
    await loadInquiries();
    if (routeInquiryId) {
      await loadDetail(routeInquiryId);
    }
    if (activeTab === 'errors') {
      await loadErrors();
    }
  }

  async function handleApprove(payload: {
    email_message_id: string;
    subject: string;
    body: string;
  }) {
    if (!accessToken || !routeInquiryId) return;
    await approveInquiry(accessToken, routeInquiryId, payload);
    await Promise.all([loadInquiries(), loadDetail(routeInquiryId)]);
  }

  async function handleReject(payload: {
    email_message_id: string;
    reason?: string;
  }) {
    if (!accessToken || !routeInquiryId) return;
    await rejectInquiry(accessToken, routeInquiryId, payload);
    await Promise.all([loadInquiries(), loadDetail(routeInquiryId)]);
  }

  async function handleUpdateStatus(payload: {
    lead_status?: ManualLeadStatus;
    unsubscribed?: boolean;
  }) {
    if (!accessToken || !routeInquiryId) return;
    await updateInquiryStatus(accessToken, routeInquiryId, payload);
    await Promise.all([loadInquiries(), loadDetail(routeInquiryId)]);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-semibold tracking-tight text-white">
                  LeadFlow AI
                </span>
                <span className="block text-xs text-slate-400">
                  Veloce Digital · Approval Console
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('inquiries')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'inquiries'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                Lead Queue
                {summary.pending_approval > 0 && (
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                    {summary.pending_approval}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('errors')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'errors'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Workflow Errors
                {summary.open_workflow_errors > 0 && (
                  <span className="rounded-full bg-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-200">
                    {summary.open_workflow_errors}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white sm:inline-flex"
            >
              Intake Form
              <ExternalLink className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${listLoading || detailLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>

            <span className="hidden rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-400 md:inline">
              {user?.email ?? 'Reviewer'}
            </span>

            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:text-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Total Leads', value: summary.total, accent: 'text-white' },
            {
              label: 'Pending Approval',
              value: summary.pending_approval,
              accent: 'text-amber-300',
            },
            {
              label: 'Qualified',
              value: summary.qualified,
              accent: 'text-emerald-300',
            },
            {
              label: 'Needs Review',
              value: summary.needs_review,
              accent: 'text-sky-300',
            },
            {
              label: 'Open Errors',
              value: summary.open_workflow_errors,
              accent:
                summary.open_workflow_errors > 0
                  ? 'text-rose-300'
                  : 'text-slate-300',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5"
            >
              <span className="text-xs font-medium text-slate-400">
                {stat.label}
              </span>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.accent}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {activeTab === 'errors' ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Workflow Execution Errors
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Recorded by WF01–WF04 into{' '}
                  <span className="font-mono text-slate-300">workflow_errors</span>.
                </p>
              </div>
              <select
                value={errorFilterStatus}
                onChange={(e) =>
                  setErrorFilterStatus(
                    e.target.value as 'open' | 'resolved' | '',
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="open">Open Only</option>
                <option value="resolved">Resolved Only</option>
              </select>
            </div>

            {errorsLoading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                Loading workflow errors...
              </div>
            ) : workflowErrors.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No workflow errors found for the selected filter.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2.5 pr-4">Created</th>
                      <th className="py-2.5 pr-4">Workflow / Node</th>
                      <th className="py-2.5 pr-4">Error Message</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5">Inquiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {workflowErrors.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-3 pr-4 text-slate-400">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-medium text-white">
                            {item.workflow_name}
                          </span>
                          {item.node_name && (
                            <span className="block font-mono text-[11px] text-slate-400">
                              {item.node_name}
                            </span>
                          )}
                        </td>
                        <td className="max-w-md py-3 pr-4 text-slate-300">
                          {item.error_message}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              item.status === 'open'
                                ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                                : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {item.inquiry_id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('inquiries');
                                navigate(`/inquiries/${item.inquiry_id}`);
                              }}
                              className="font-medium text-sky-400 hover:underline"
                            >
                              Inspect Lead
                            </button>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Sidebar: Filters + Queue */}
            <aside className="space-y-4 lg:col-span-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={filters.search ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                    placeholder="Search name, email, company..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <select
                    aria-label="Filter by status"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value as LeadStatus | '',
                      }))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="qualified">Qualified</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="not_qualified">Not Qualified</option>
                    <option value="contacted">Contacted</option>
                    <option value="replied">Replied</option>
                    <option value="won">Won</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    aria-label="Filter by priority"
                    value={filters.priority ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priority: e.target.value as Priority | '',
                      }))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    aria-label="Filter by approval status"
                    value={filters.approval_status ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        approval_status: e.target.value as ApprovalStatus | '',
                      }))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">All Approval</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>
              </div>

              {listError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {listError}
                </div>
              )}

              <div className="space-y-2.5 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto lg:pr-1">
                {listLoading && inquiries.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    Loading inquiries...
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                    No inquiries match your current filters.
                  </div>
                ) : (
                  inquiries.map((item) => {
                    const isSelected = item.id === routeInquiryId;
                    const score = item.latest_analysis?.qualification_score;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/inquiries/${item.id}`)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-950/30'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.contact?.full_name ?? 'Unknown Contact'}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {item.contact?.company_name
                                ? `${item.contact.company_name} · `
                                : ''}
                              {item.contact?.email ?? '—'}
                            </p>
                          </div>

                          {typeof score === 'number' && (
                            <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-bold tabular-nums text-sky-300">
                              {score}
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <LeadStatusBadge status={item.lead_status} />
                          <PriorityBadge priority={item.priority} />
                          {item.approval_status === 'pending' && (
                            <ApprovalBadge status="pending" />
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {formatBudgetRange(
                              item.budget_min,
                              item.budget_max,
                              item.budget_currency,
                            )}
                          </span>
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Pane: Inquiry Detail & HITL Review */}
            <section className="lg:col-span-8">
              {detailLoading ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-sm text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-400" />
                  Loading lead qualification &amp; email draft...
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
                  {detailError}
                </div>
              ) : selectedDetail ? (
                <InquiryDetailPanel
                  detail={selectedDetail}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                  <Inbox className="h-8 w-8 text-slate-600" />
                  <h2 className="mt-3 text-base font-semibold text-white">
                    Select a Lead to Review
                  </h2>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">
                    Choose an inquiry from the queue on the left to inspect its AI
                    summary, deterministic score breakdown, and approve or reject its
                    draft response.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
