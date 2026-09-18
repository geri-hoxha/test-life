import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { Loader, PageLoader } from "@/components/Loader";
import { ProductCombobox } from "@/components/ProductCombobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreateAgentCommissionRule,
  useCreateAgentProductAuthorization,
  useDeleteAgentCommissionRule,
  useDeleteAgentProductAuthorization,
  useGetAgent,
  useListAgentCommissionRules,
  useListAgentProductAuthorizations,
  useUpdateAgent,
  useUpdateAgentCommissionRule,
  useUpdateAgentProductAuthorization,
} from "@/api/agents";
import { mapApiProduct, useListProducts } from "@/api/products";
import type {
  AgentsAgentCommissionRuleResponse,
  AgentsAgentProductAuthorizationResponse,
  DomainCommissionsBasis,
  DomainCommissionsBusinessType,
} from "@/api/types";
import { toastApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  COMMISSION_BASES,
  COMMISSION_BUSINESS_TYPES,
  basisLabel,
  businessTypeLabel,
  formatCommissionRate,
} from "@/pages/agent-commissions/commission-ui";

const toDate = (isoDay?: string | null) => {
  if (!isoDay?.trim()) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const formatDay = (iso?: string | null, empty = "—") => {
  if (!iso?.trim()) return empty;
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso;
  }
};

const toIsoDay = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "");

const parseRatePercent = (raw: string): number | null => {
  const value = Number(raw.trim().replace("%", "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return value / 100;
};

type AgentForm = {
  displayName: string;
  internalOfficeId: string;
  isActive: boolean;
};

type AuthForm = {
  productId: string;
  effectiveFrom: string;
  effectiveToExclusive: string;
};

type RuleForm = {
  businessType: DomainCommissionsBusinessType;
  basis: DomainCommissionsBasis;
  ratePercent: string;
  effectiveFrom: string;
  effectiveToExclusive: string;
};

const emptyAuthForm = (): AuthForm => ({
  productId: "",
  effectiveFrom: format(new Date(), "yyyy-MM-dd"),
  effectiveToExclusive: "",
});

const emptyRuleForm = (): RuleForm => ({
  businessType: "newBusiness",
  basis: "premium",
  ratePercent: "",
  effectiveFrom: format(new Date(), "yyyy-MM-dd"),
  effectiveToExclusive: "",
});

type AuthorizationRulesPanelProps = {
  agentId: string;
  authorizationId: string;
  onAddRule: () => void;
  onEditRule: (row: AgentsAgentCommissionRuleResponse) => void;
  onDeleteRule: (row: AgentsAgentCommissionRuleResponse) => void;
};

const AuthorizationRulesPanel = ({
  agentId,
  authorizationId,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: AuthorizationRulesPanelProps) => {
  const { data: rules, isLoading } = useListAgentCommissionRules(agentId, authorizationId);
  const items = rules ?? [];

  return (
    <div className="ml-11 mr-3 mb-3 border-l-2 border-accent/30 pl-4 py-1">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Commission rules
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={onAddRule}>
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </Button>
      </div>

      {isLoading ? (
        <Loader size="sm" label="Loading commission rules…" className="py-4" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No commission rules for this authorization.</p>
      ) : (
        <div className="space-y-0.5">
          {items.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[8.75rem_6rem_4.25rem_minmax(0,1fr)_auto] items-center gap-x-4 py-1.5"
            >
              <span className="text-sm truncate">{businessTypeLabel(row.businessType)}</span>
              <span className="text-sm text-muted-foreground truncate">{basisLabel(row.basis)}</span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCommissionRate(row.rate)}
              </span>
              <span className="font-mono text-xs text-foreground/70 truncate">
                {formatDay(row.effectiveFrom)} to {formatDay(row.effectiveToExclusive, "Open")}
              </span>
              <div className="flex items-center shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!row.id}
                  onClick={() => onEditRule(row)}
                  title="Edit commission rule"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  disabled={!row.id}
                  onClick={() => onDeleteRule(row)}
                  title="Delete commission rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const agentId = id?.trim() ?? "";

  const { data: agent, isLoading, isError } = useGetAgent(agentId, { enabled: Boolean(agentId) });
  const { data: authorizations, isLoading: authsLoading } = useListAgentProductAuthorizations(
    agentId,
    undefined,
    { enabled: Boolean(agentId) },
  );
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });
  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct).filter((p) => p.id),
    [productsPage?.items],
  );
  const productNameById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );

  const updateAgent = useUpdateAgent();
  const createAuth = useCreateAgentProductAuthorization();
  const updateAuth = useUpdateAgentProductAuthorization();
  const deleteAuth = useDeleteAgentProductAuthorization();
  const createRule = useCreateAgentCommissionRule();
  const updateRule = useUpdateAgentCommissionRule();
  const deleteRule = useDeleteAgentCommissionRule();

  const [expandedAuthIds, setExpandedAuthIds] = useState<Set<string>>(new Set());
  const didAutoExpand = useRef(false);
  const [ruleAuthId, setRuleAuthId] = useState("");
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>({
    displayName: "",
    internalOfficeId: "",
    isActive: true,
  });

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<AgentsAgentProductAuthorizationResponse | null>(null);
  const [authForm, setAuthForm] = useState<AuthForm>(emptyAuthForm);
  const [deleteAuthTarget, setDeleteAuthTarget] = useState<AgentsAgentProductAuthorizationResponse | null>(null);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AgentsAgentCommissionRuleResponse | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm>(emptyRuleForm);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<{
    authorizationId: string;
    rule: AgentsAgentCommissionRuleResponse;
  } | null>(null);

  const authItems = authorizations ?? [];
  useEffect(() => {
    const items = authorizations ?? [];
    const validIds = new Set(items.map((a) => a.id).filter((id): id is string => Boolean(id)));
    setExpandedAuthIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      if (!didAutoExpand.current && items[0]?.id) {
        didAutoExpand.current = true;
        next.add(items[0].id);
      }
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [authorizations]);

  const toggleAuthExpanded = (authorizationId: string) => {
    setExpandedAuthIds((prev) => {
      const next = new Set(prev);
      if (next.has(authorizationId)) next.delete(authorizationId);
      else next.add(authorizationId);
      return next;
    });
  };

  const openEditAgent = () => {
    setAgentForm({
      displayName: agent?.displayName ?? "",
      internalOfficeId: agent?.internalOfficeId ?? "",
      isActive: agent?.isActive ?? true,
    });
    setAgentDialogOpen(true);
  };

  const handleSaveAgent = () => {
    const displayName = agentForm.displayName.trim();
    if (!displayName || !agentId) {
      toast.error("Display name is required");
      return;
    }
    updateAgent.mutate(
      {
        agentId,
        body: {
          displayName,
          internalOfficeId: agentForm.internalOfficeId.trim() || undefined,
          isActive: agentForm.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Agent updated");
          setAgentDialogOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to update agent"),
      },
    );
  };

  const openCreateAuth = () => {
    setEditingAuth(null);
    setAuthForm(emptyAuthForm());
    setAuthDialogOpen(true);
  };

  const openEditAuth = (row: AgentsAgentProductAuthorizationResponse) => {
    setEditingAuth(row);
    setAuthForm({
      productId: row.productId ?? "",
      effectiveFrom: row.effectiveFrom ?? "",
      effectiveToExclusive: row.effectiveToExclusive ?? "",
    });
    setAuthDialogOpen(true);
  };

  const handleSaveAuth = () => {
    if (!agentId) return;
    const effectiveFrom = authForm.effectiveFrom.trim();
    if (!effectiveFrom) {
      toast.error("Effective from is required");
      return;
    }
    const effectiveToExclusive = authForm.effectiveToExclusive.trim() || null;

    if (editingAuth?.id) {
      updateAuth.mutate(
        {
          agentId,
          authorizationId: editingAuth.id,
          body: { effectiveFrom, effectiveToExclusive },
        },
        {
          onSuccess: () => {
            toast.success("Authorization updated");
            setAuthDialogOpen(false);
          },
          onError: (err) => toastApiError(err, "Failed to update authorization"),
        },
      );
      return;
    }

    const productId = authForm.productId.trim();
    if (!productId) {
      toast.error("Product is required");
      return;
    }
    createAuth.mutate(
      {
        agentId,
        body: { productId, effectiveFrom, effectiveToExclusive },
      },
      {
        onSuccess: (created) => {
          toast.success("Authorization created");
          if (created.id) {
            setExpandedAuthIds((prev) => new Set(prev).add(created.id!));
          }
          setAuthDialogOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to create authorization"),
      },
    );
  };

  const handleDeleteAuth = () => {
    if (!agentId || !deleteAuthTarget?.id) return;
    deleteAuth.mutate(
      { agentId, authorizationId: deleteAuthTarget.id },
      {
        onSuccess: () => {
          toast.success("Authorization deleted");
          setDeleteAuthTarget(null);
        },
        onError: (err) => toastApiError(err, "Failed to delete authorization"),
      },
    );
  };

  const openCreateRule = (authorizationId: string) => {
    setRuleAuthId(authorizationId);
    setEditingRule(null);
    setRuleForm(emptyRuleForm());
    setRuleDialogOpen(true);
  };

  const openEditRule = (authorizationId: string, row: AgentsAgentCommissionRuleResponse) => {
    setRuleAuthId(authorizationId);
    setEditingRule(row);
    setRuleForm({
      businessType: row.businessType ?? "newBusiness",
      basis: row.basis ?? "premium",
      ratePercent: row.rate != null ? String(row.rate * 100) : "",
      effectiveFrom: row.effectiveFrom ?? "",
      effectiveToExclusive: row.effectiveToExclusive ?? "",
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!agentId || !ruleAuthId) return;
    const effectiveFrom = ruleForm.effectiveFrom.trim();
    if (!effectiveFrom) {
      toast.error("Effective from is required");
      return;
    }
    const effectiveToExclusive = ruleForm.effectiveToExclusive.trim() || null;

    if (editingRule?.id) {
      updateRule.mutate(
        {
          agentId,
          authorizationId: ruleAuthId,
          ruleId: editingRule.id,
          body: { effectiveFrom, effectiveToExclusive },
        },
        {
          onSuccess: () => {
            toast.success("Commission rule updated");
            setRuleDialogOpen(false);
          },
          onError: (err) => toastApiError(err, "Failed to update commission rule"),
        },
      );
      return;
    }

    const rate = parseRatePercent(ruleForm.ratePercent);
    if (rate == null) {
      toast.error("Rate is required");
      return;
    }
    createRule.mutate(
      {
        agentId,
        authorizationId: ruleAuthId,
        body: {
          businessType: ruleForm.businessType,
          basis: ruleForm.basis,
          rate,
          effectiveFrom,
          effectiveToExclusive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Commission rule created");
          setRuleDialogOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to create commission rule"),
      },
    );
  };

  const handleDeleteRule = () => {
    if (!agentId || !deleteRuleTarget?.authorizationId || !deleteRuleTarget.rule.id) return;
    deleteRule.mutate(
      { agentId, authorizationId: deleteRuleTarget.authorizationId, ruleId: deleteRuleTarget.rule.id },
      {
        onSuccess: () => {
          toast.success("Commission rule deleted");
          setDeleteRuleTarget(null);
        },
        onError: (err) => toastApiError(err, "Failed to delete commission rule"),
      },
    );
  };

  if (isLoading) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agents")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Button>
        <PageLoader label="Loading agent…" />
      </AppShell>
    );
  }

  if (isError || !agent) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agents")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Button>
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This agent could not be loaded.</p>
          <Button asChild className="mt-4">
            <Link to="/agents">Back to agents</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const authSaving = createAuth.isPending || updateAuth.isPending;
  const ruleSaving = createRule.isPending || updateRule.isPending;
  const ruleProductLabel = (() => {
    const auth = authItems.find((a) => a.id === ruleAuthId);
    if (!auth?.productId) return "this product";
    return productNameById[auth.productId] || auth.productId;
  })();

  return (
    <AppShell>
      <Button variant="ghost" size="sm" onClick={() => navigate("/agents")} className="gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Agent
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.displayName?.trim() || agent.id}
            </h1>
            <Badge
              variant="outline"
              className={
                agent.isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
              }
            >
              {agent.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {agent.id}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={openEditAgent}>
          <Pencil className="h-4 w-4" />
          Edit agent
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Auth user</div>
          <div className="text-sm font-medium mt-1 font-mono">
            {agent.authUserId != null ? String(agent.authUserId) : "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Office ID</div>
          <div className="text-sm font-medium mt-1 font-mono truncate" title={agent.internalOfficeId}>
            {agent.internalOfficeId?.trim() || "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fiscal TCR</div>
          <div className="text-sm font-medium mt-1 font-mono">{agent.fiscTcr?.trim() || "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fiscal operator</div>
          <div className="text-sm font-medium mt-1 font-mono">{agent.fiscOperatorCode?.trim() || "—"}</div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Product authorizations</CardTitle>
              <CardDescription>
                Products this agent is allowed to sell. Expand a row to manage its commission rules.
              </CardDescription>
            </div>
            <Button className="gap-2" onClick={openCreateAuth}>
              <Plus className="h-4 w-4" />
              Add authorization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">
                    <span className="sr-only">Expand</span>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Effective to</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                      Loading authorizations…
                    </TableCell>
                  </TableRow>
                ) : authItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                      No product authorizations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  authItems.map((row) => {
                    const authId = row.id ?? "";
                    const isExpanded = Boolean(authId) && expandedAuthIds.has(authId);
                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          className={cn(
                            "cursor-pointer hover:bg-accent-soft/70",
                            isExpanded && "border-b-0 bg-transparent hover:bg-transparent",
                          )}
                          data-state={isExpanded ? "open" : undefined}
                          onClick={() => authId && toggleAuthExpanded(authId)}
                        >
                          <TableCell className="pr-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              disabled={!authId}
                              aria-label={
                                isExpanded
                                  ? `Collapse commission rules for ${productNameById[row.productId ?? ""] || row.productId || "authorization"}`
                                  : `Expand commission rules for ${productNameById[row.productId ?? ""] || row.productId || "authorization"}`
                              }
                              aria-expanded={isExpanded}
                              onClick={(e) => {
                                e.stopPropagation();
                                authId && toggleAuthExpanded(authId);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.productId ? (
                              <Link
                                to={`/products/${row.productId}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {productNameById[row.productId] || row.productId}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{formatDay(row.effectiveFrom)}</TableCell>
                          <TableCell className="font-mono text-xs">{formatDay(row.effectiveToExclusive, "Open")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                disabled={!row.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditAuth(row);
                                }}
                                title="Edit authorization"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                disabled={!row.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteAuthTarget(row);
                                }}
                                title="Delete authorization"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent border-0">
                            <TableCell colSpan={5} className="p-0">
                              <AuthorizationRulesPanel
                                agentId={agentId}
                                authorizationId={authId}
                                onAddRule={() => openCreateRule(authId)}
                                onEditRule={(rule) => openEditRule(authId, rule)}
                                onDeleteRule={(rule) =>
                                  setDeleteRuleTarget({ authorizationId: authId, rule })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit agent</DialogTitle>
            <DialogDescription>Update the agent profile. Login credentials cannot be changed here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-display-name">Display name</Label>
              <Input
                id="edit-display-name"
                value={agentForm.displayName}
                onChange={(e) => setAgentForm((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-office">Internal office ID</Label>
              <Input
                id="edit-office"
                className="font-mono"
                value={agentForm.internalOfficeId}
                onChange={(e) => setAgentForm((prev) => ({ ...prev, internalOfficeId: e.target.value }))}
                placeholder="Optional office ULID"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={agentForm.isActive}
                onCheckedChange={(checked) => setAgentForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentDialogOpen(false)} disabled={updateAgent.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveAgent} disabled={updateAgent.isPending}>
              {updateAgent.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAuth ? "Edit authorization" : "Add authorization"}</DialogTitle>
            <DialogDescription>
              {editingAuth
                ? "Update the effective period. Product cannot be changed after creation."
                : "Authorize this agent to sell a product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <ProductCombobox
                products={products.map((p) => ({ id: p.id, name: p.name }))}
                value={authForm.productId}
                onValueChange={(productId) => setAuthForm((prev) => ({ ...prev, productId }))}
                disabled={Boolean(editingAuth)}
                placeholder="Select product"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Effective from</Label>
                <DatePicker
                  value={toDate(authForm.effectiveFrom)}
                  onChange={(d) => setAuthForm((prev) => ({ ...prev, effectiveFrom: toIsoDay(d) }))}
                  placeholder="From date"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Effective to (exclusive)</Label>
                <DatePicker
                  value={toDate(authForm.effectiveToExclusive)}
                  onChange={(d) => setAuthForm((prev) => ({ ...prev, effectiveToExclusive: toIsoDay(d) }))}
                  placeholder="Open-ended"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAuthDialogOpen(false)} disabled={authSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveAuth} disabled={authSaving}>
              {authSaving ? "Saving…" : editingAuth ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit commission rule" : "Add commission rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Only the effective period can be updated after creation."
                : `Define how this agent is paid for ${ruleProductLabel}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Business type</Label>
              <Select
                value={ruleForm.businessType}
                onValueChange={(v) =>
                  setRuleForm((prev) => ({ ...prev, businessType: v as DomainCommissionsBusinessType }))
                }
                disabled={Boolean(editingRule)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {businessTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Basis</Label>
              <Select
                value={ruleForm.basis}
                onValueChange={(v) => setRuleForm((prev) => ({ ...prev, basis: v as DomainCommissionsBasis }))}
                disabled={Boolean(editingRule)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_BASES.map((basis) => (
                    <SelectItem key={basis} value={basis}>
                      {basisLabel(basis)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-rate">Rate (%)</Label>
              <Input
                id="rule-rate"
                value={ruleForm.ratePercent}
                onChange={(e) => setRuleForm((prev) => ({ ...prev, ratePercent: e.target.value }))}
                placeholder="e.g. 7.5"
                disabled={Boolean(editingRule)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Effective from</Label>
              <DatePicker
                value={toDate(ruleForm.effectiveFrom)}
                onChange={(d) => setRuleForm((prev) => ({ ...prev, effectiveFrom: toIsoDay(d) }))}
                placeholder="From date"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Effective to (exclusive)</Label>
              <DatePicker
                value={toDate(ruleForm.effectiveToExclusive)}
                onChange={(d) => setRuleForm((prev) => ({ ...prev, effectiveToExclusive: toIsoDay(d) }))}
                placeholder="Open-ended"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)} disabled={ruleSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={ruleSaving}>
              {ruleSaving ? "Saving…" : editingRule ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteAuthTarget)} onOpenChange={(open) => !open && setDeleteAuthTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete authorization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product authorization
              {deleteAuthTarget?.productId
                ? ` for ${productNameById[deleteAuthTarget.productId] || deleteAuthTarget.productId}`
                : ""}
              . Commission rules on it will also become inaccessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAuth.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteAuth.isPending} onClick={handleDeleteAuth}>
              {deleteAuth.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteRuleTarget)} onOpenChange={(open) => !open && setDeleteRuleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete commission rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this commission rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRule.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteRule.isPending} onClick={handleDeleteRule}>
              {deleteRule.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default AgentDetail;
