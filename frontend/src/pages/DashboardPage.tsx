import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { VeloceLogo } from '@/components/VeloceLogo';
import { InquiryDetailPanel } from '@/components/dashboard/InquiryDetailPanel';
import { PipelineAnalyticsChart } from '@/components/dashboard/PipelineAnalyticsChart';
import {
  ApprovalBadge,
  LeadStatusBadge,
  PriorityBadge,
  formatBudgetRange,
  formatDateTime,
} from '@/components/dashboard/StatusBadges';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import {
  approveInquiry,
  fetchInquiries,
  fetchInquiryDetail,
  fetchWorkflowErrors,
  rejectInquiry,
  updateInquiryStatus,
} from '@/services/api';
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
} from '@/types/dashboard';

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

function getScorePillClass(score: number): string {
  if (score >= 75) {
    return 'border-success-border bg-success-soft text-success';
  }
  if (score >= 45) {
    return 'border-warning-border bg-warning-soft text-warning';
  }
  return 'border-danger-border bg-danger-soft text-danger';
}

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

  const [workflowErrors, setWorkflowErrors] = useState<WorkflowErrorRecord[]>(
    [],
  );
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
      if (
        !routeInquiryId &&
        data.items.length > 0 &&
        activeTab === 'inquiries'
      ) {
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
          err instanceof Error
            ? err.message
            : 'Failed to load inquiry detail.',
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
    document.title = 'Approval Dashboard — Veloce Digital | LeadFlow AI';
  }, []);

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

  const kpiCards = [
    {
      label: 'Total Leads',
      value: summary.total,
      icon: Users,
      accent: 'text-foreground',
      iconColor: 'text-muted-foreground',
    },
    {
      label: 'Pending Approval',
      value: summary.pending_approval,
      icon: Clock,
      accent: 'text-warning',
      iconColor: 'text-warning',
    },
    {
      label: 'Qualified',
      value: summary.qualified,
      icon: CheckCircle2,
      accent: 'text-success',
      iconColor: 'text-success',
    },
    {
      label: 'Needs Review',
      value: summary.needs_review,
      icon: Sparkles,
      accent: 'text-primary',
      iconColor: 'text-primary',
    },
    {
      label: 'Open Errors',
      value: summary.open_workflow_errors,
      icon: AlertTriangle,
      accent:
        summary.open_workflow_errors > 0
          ? 'text-danger'
          : 'text-muted-foreground',
      iconColor:
        summary.open_workflow_errors > 0
          ? 'text-danger'
          : 'text-muted-foreground',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Crisp Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <VeloceLogo
                title="LeadFlow AI"
                subtitle="Veloce Digital · Approval Console"
              />
            </Link>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as ActiveTab)}
            >
              <TabsList>
                <TabsTrigger value="inquiries">
                  <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Lead Queue
                  {summary.pending_approval > 0 && (
                    <span className="ml-0.5 rounded-full bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-warning">
                      {summary.pending_approval}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="errors">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Workflow Errors
                  {summary.open_workflow_errors > 0 && (
                    <span className="ml-0.5 rounded-full bg-danger-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-danger">
                      {summary.open_workflow_errors}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/">
                Intake Form
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  listLoading || detailLoading ? 'animate-spin' : ''
                }`}
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <span className="hidden max-w-[180px] truncate rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground md:inline">
              {user?.email ?? 'Reviewer'}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6">
        {/* Top Row: KPI Strip + Recharts Pipeline Analytics */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:col-span-7 xl:grid-cols-5">
            {kpiCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="flex flex-col justify-between">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </span>
                      <Icon
                        className={`h-4 w-4 shrink-0 ${stat.iconColor}`}
                        strokeWidth={1.75}
                      />
                    </div>
                    <p
                      className={`mt-3 font-mono text-2xl font-bold tabular-nums ${stat.accent}`}
                    >
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="xl:col-span-5">
            <PipelineAnalyticsChart summary={summary} />
          </div>
        </section>

        {activeTab === 'errors' ? (
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4">
              <div>
                <CardTitle className="text-base">
                  Workflow Execution Errors
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Recorded by WF01–WF04 into{' '}
                  <span className="font-mono text-foreground">
                    workflow_errors
                  </span>
                  .
                </CardDescription>
              </div>
              <div className="w-44">
                <Select
                  value={errorFilterStatus || '__all__'}
                  onValueChange={(value) =>
                    setErrorFilterStatus(
                      value === '__all__'
                        ? ''
                        : (value as 'open' | 'resolved'),
                    )
                  }
                >
                  <SelectTrigger aria-label="Filter workflow errors by status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Statuses</SelectItem>
                    <SelectItem value="open">Open Only</SelectItem>
                    <SelectItem value="resolved">Resolved Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
              {errorsLoading ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : workflowErrors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <img
                    src="/assets/empty-queue.jpg"
                    alt="No workflow errors"
                    className="h-32 w-auto rounded-lg object-contain"
                  />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    All workflows running smoothly
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No workflow errors found for the selected filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Created</th>
                        <th className="px-3 py-2.5 font-medium">
                          Workflow / Node
                        </th>
                        <th className="px-3 py-2.5 font-medium">
                          Error Message
                        </th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium">Inquiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {workflowErrors.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums text-muted-foreground">
                            {formatDateTime(item.created_at)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-foreground">
                              {item.workflow_name}
                            </span>
                            {item.node_name && (
                              <span className="block font-mono text-[11px] text-muted-foreground">
                                {item.node_name}
                              </span>
                            )}
                          </td>
                          <td className="max-w-md px-3 py-3 text-secondary-foreground">
                            {item.error_message}
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              variant={
                                item.status === 'open' ? 'danger' : 'success'
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            {item.inquiry_id ? (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  setActiveTab('inquiries');
                                  navigate(`/inquiries/${item.inquiry_id}`);
                                }}
                              >
                                Inspect Lead
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Sidebar: Filters + Queue */}
            <aside className="space-y-4 lg:col-span-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={filters.search ?? ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      placeholder="Search name, email, company..."
                      className="pl-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={filters.status || '__all__'}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status:
                            value === '__all__' ? '' : (value as LeadStatus),
                        }))
                      }
                    >
                      <SelectTrigger
                        aria-label="Filter by status"
                        className="h-8 px-2.5 text-xs"
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="needs_review">
                          Needs Review
                        </SelectItem>
                        <SelectItem value="not_qualified">
                          Not Qualified
                        </SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.priority || '__all__'}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          priority:
                            value === '__all__' ? '' : (value as Priority),
                        }))
                      }
                    >
                      <SelectTrigger
                        aria-label="Filter by priority"
                        className="h-8 px-2.5 text-xs"
                      >
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.approval_status || '__all__'}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          approval_status:
                            value === '__all__'
                              ? ''
                              : (value as ApprovalStatus),
                        }))
                      }
                    >
                      <SelectTrigger
                        aria-label="Filter by approval status"
                        className="h-8 px-2.5 text-xs"
                      >
                        <SelectValue placeholder="Approval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Approval</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="not_required">
                          Not Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {listError && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger-border bg-danger-soft p-3 text-xs text-danger"
                >
                  {listError}
                </div>
              )}

              <div className="space-y-2.5 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto lg:pr-1">
                {listLoading && inquiries.length === 0 ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((n) => (
                      <Card key={n}>
                        <CardContent className="space-y-2.5 p-4">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-4/5" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-14" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : inquiries.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <img
                        src="/assets/empty-queue.jpg"
                        alt="No matching leads"
                        className="h-28 w-auto rounded-lg object-contain"
                      />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        Queue is clear
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No inquiries match your current search or filter
                        criteria.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  inquiries.map((item) => {
                    const isSelected = item.id === routeInquiryId;
                    const score = item.latest_analysis?.qualification_score;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/inquiries/${item.id}`)}
                        className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? 'border-primary/60 bg-info-soft/50 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.18)]'
                            : 'border-border bg-card hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold text-foreground">
                              {item.contact?.full_name ?? 'Unknown Contact'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.contact?.company_name
                                ? `${item.contact.company_name} · `
                                : ''}
                              {item.contact?.email ?? '—'}
                            </p>
                          </div>

                          {typeof score === 'number' && (
                            <span
                              className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${getScorePillClass(score)}`}
                            >
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

                        <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
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
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-7 w-48" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-56 w-full" />
                  </CardContent>
                </Card>
              ) : detailError ? (
                <Card className="border-danger-border bg-danger-soft">
                  <CardContent className="p-6 text-sm text-danger">
                    {detailError}
                  </CardContent>
                </Card>
              ) : selectedDetail ? (
                <InquiryDetailPanel
                  detail={selectedDetail}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ) : (
                <Card>
                  <CardContent className="flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
                    <img
                      src="/assets/empty-queue.jpg"
                      alt="Select a lead to review"
                      className="h-36 w-auto rounded-lg object-contain"
                    />
                    <h2 className="mt-4 font-display text-base font-semibold text-foreground">
                      Select a Lead to Review
                    </h2>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      Choose an inquiry from the queue on the left to inspect
                      its AI summary, 4-axis deterministic score breakdown, and
                      approve or reject its email draft.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
