import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
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
  useCreateAgentProductConfiguration,
  useDeleteAgentProductConfiguration,
  useGetAgent,
  useListAgentProductConfigurations,
  useUpdateAgent,
  useUpdateAgentProductConfiguration,
} from "@/api/agents";
import { mapApiProduct, useListProducts } from "@/api/products";
import type {
  AgentsAgentProductConfigurationResponse,
  DomainCommissionsBasis,
} from "@/api/types";
import AccessDeniedNotice from "@/components/AccessDeniedNotice";
import { isApiForbidden, toastApiError } from "@/lib/api-error";
import { compactQuery } from "@/lib/list-query";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  COMMISSION_BASES,
  basisLabel,
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

const rateToPercent = (rate?: number | null) =>
  rate != null && Number.isFinite(rate) ? String(rate * 100) : "";

type AgentForm = {
  displayName: string;
  isActive: boolean;
};

type ConfigForm = {
  productId: string;
  newBusinessCommissionBasis: DomainCommissionsBasis;
  newBusinessRatePercent: string;
  renewalCommissionBasis: DomainCommissionsBasis;
  renewalRatePercent: string;
  effectiveFrom: string;
  effectiveToExclusive: string;
};

const emptyConfigForm = (): ConfigForm => ({
  productId: "",
  newBusinessCommissionBasis: "premium",
  newBusinessRatePercent: "",
  renewalCommissionBasis: "premium",
  renewalRatePercent: "",
  effectiveFrom: format(new Date(), "yyyy-MM-dd"),
  effectiveToExclusive: "",
});

const formFromConfig = (row: AgentsAgentProductConfigurationResponse): ConfigForm => ({
  productId: row.productId ?? "",
  newBusinessCommissionBasis: row.newBusinessCommissionBasis ?? "premium",
  newBusinessRatePercent: rateToPercent(row.newBusinessCommissionRate),
  renewalCommissionBasis: row.renewalCommissionBasis ?? "premium",
  renewalRatePercent: rateToPercent(row.renewalCommissionRate),
  effectiveFrom: row.effectiveFrom ?? "",
  effectiveToExclusive: row.effectiveToExclusive ?? "",
});

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const agentId = id?.trim() ?? "";

  const [productFilter, setProductFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const configQuery = useMemo(
    () => compactQuery({ productId: productFilter.trim() || undefined }),
    [productFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [configQuery, pageSize]);

  const { data: agent, isLoading, isError, error } = useGetAgent(agentId, { enabled: Boolean(agentId) });
  const {
    data: configurations,
    isLoading: configsLoading,
    isFetching: configsFetching,
    isError: configsFailed,
  } = useListAgentProductConfigurations(agentId, configQuery, {
    enabled: Boolean(agentId) && !isError,
  });
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
  const createConfig = useCreateAgentProductConfiguration();
  const updateConfig = useUpdateAgentProductConfiguration();
  const deleteConfig = useDeleteAgentProductConfiguration();

  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>({
    displayName: "",
    isActive: true,
  });

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgentsAgentProductConfigurationResponse | null>(null);
  const [configForm, setConfigForm] = useState<ConfigForm>(emptyConfigForm);
  const [deleteTarget, setDeleteTarget] = useState<AgentsAgentProductConfigurationResponse | null>(null);

  const allConfigItems = configurations ?? [];
  const totalCount = allConfigItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const configItems = allConfigItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasProductFilter = Boolean(productFilter.trim());

  const openEditAgent = () => {
    setAgentForm({
      displayName: agent?.displayName ?? "",
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

  const openCreateConfig = () => {
    setEditingConfig(null);
    setConfigForm(emptyConfigForm());
    setConfigDialogOpen(true);
  };

  const openEditConfig = (row: AgentsAgentProductConfigurationResponse) => {
    setEditingConfig(row);
    setConfigForm(formFromConfig(row));
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!agentId) return;
    const effectiveFrom = configForm.effectiveFrom.trim();
    if (!effectiveFrom) {
      toast.error("Effective from is required");
      return;
    }
    const effectiveToExclusive = configForm.effectiveToExclusive.trim() || null;

    if (editingConfig?.id) {
      updateConfig.mutate(
        {
          agentId,
          configurationId: editingConfig.id,
          body: { effectiveFrom, effectiveToExclusive },
        },
        {
          onSuccess: () => {
            toast.success("Product configuration updated");
            setConfigDialogOpen(false);
          },
          onError: (err) => toastApiError(err, "Failed to update product configuration"),
        },
      );
      return;
    }

    const productId = configForm.productId.trim();
    if (!productId) {
      toast.error("Product is required");
      return;
    }
    const newBusinessCommissionRate = parseRatePercent(configForm.newBusinessRatePercent);
    const renewalCommissionRate = parseRatePercent(configForm.renewalRatePercent);
    if (
      newBusinessCommissionRate == null ||
      newBusinessCommissionRate <= 0 ||
      newBusinessCommissionRate > 1
    ) {
      toast.error("New business rate must be greater than 0 and at most 100");
      return;
    }
    if (renewalCommissionRate == null || renewalCommissionRate <= 0 || renewalCommissionRate > 1) {
      toast.error("Renewal rate must be greater than 0 and at most 100");
      return;
    }

    createConfig.mutate(
      {
        agentId,
        body: {
          productId,
          newBusinessCommissionBasis: configForm.newBusinessCommissionBasis,
          newBusinessCommissionRate,
          renewalCommissionBasis: configForm.renewalCommissionBasis,
          renewalCommissionRate,
          effectiveFrom,
          effectiveToExclusive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Product configuration created");
          setConfigDialogOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to create product configuration"),
      },
    );
  };

  const handleDeleteConfig = () => {
    if (!agentId || !deleteTarget?.id) return;
    deleteConfig.mutate(
      { agentId, configurationId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success("Product configuration deleted");
          setDeleteTarget(null);
        },
        onError: (err) => toastApiError(err, "Failed to delete product configuration"),
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
        {isApiForbidden(error) ? (
          <AccessDeniedNotice />
        ) : (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground text-sm">This agent could not be loaded.</p>
            <Button asChild className="mt-4">
              <Link to="/agents">Back to agents</Link>
            </Button>
          </Card>
        )}
      </AppShell>
    );
  }

  const configSaving = createConfig.isPending || updateConfig.isPending;
  const editing = Boolean(editingConfig);

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
          <p className="text-sm text-muted-foreground mt-1 font-mono">{agent.id}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={openEditAgent}>
          <Pencil className="h-4 w-4" />
          Edit agent
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Product configurations</CardTitle>
                <CardDescription>
                  Commission basis and rate for new business and renewals.
                  {configsLoading
                    ? " Loading…"
                    : ` ${totalCount} total${configsFetching && !configsLoading ? " · updating…" : ""}.`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasProductFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground"
                    onClick={() => setProductFilter("")}
                  >
                    Clear filter
                  </Button>
                )}
                <Button className="gap-2" onClick={openCreateConfig}>
                  <Plus className="h-4 w-4" />
                  Add configuration
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <ProductCombobox
                  value={productFilter}
                  onValueChange={setProductFilter}
                  placeholder="All products"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>New business</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Effective to</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      Loading product configurations…
                    </TableCell>
                  </TableRow>
                ) : configsFailed ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      Product configurations could not be loaded.
                    </TableCell>
                  </TableRow>
                ) : configItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      {hasProductFilter
                        ? "No product configurations for this product."
                        : "No product configurations yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  configItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.productId ? (
                          <Link to={`/products/${row.productId}`} className="hover:underline">
                            {productNameById[row.productId] || row.productId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {basisLabel(row.newBusinessCommissionBasis)}
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-mono tabular-nums">
                          {formatCommissionRate(row.newBusinessCommissionRate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {basisLabel(row.renewalCommissionBasis)}
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-mono tabular-nums">
                          {formatCommissionRate(row.renewalCommissionRate)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatDay(row.effectiveFrom)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDay(row.effectiveToExclusive, "Open")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEditConfig(row)}
                            title="Edit configuration"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={!row.id}
                            onClick={() => setDeleteTarget(row)}
                            title="Delete configuration"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disabled={configsLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit agent</DialogTitle>
            <DialogDescription>Update the agent name and status.</DialogDescription>
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

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product configuration" : "Add product configuration"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Only the effective period can be updated. Rates stay as they were created."
                : "Set commission basis and rate for new business and renewals."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <ProductCombobox
                products={products.map((p) => ({ id: p.id, name: p.name }))}
                value={configForm.productId}
                onValueChange={(productId) => setConfigForm((prev) => ({ ...prev, productId }))}
                disabled={editing}
                placeholder="Select product"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New business basis</Label>
                <Select
                  value={configForm.newBusinessCommissionBasis}
                  onValueChange={(v) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      newBusinessCommissionBasis: v as DomainCommissionsBasis,
                    }))
                  }
                  disabled={editing}
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
                <Label htmlFor="nb-rate">New business rate (%)</Label>
                <Input
                  id="nb-rate"
                  value={configForm.newBusinessRatePercent}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, newBusinessRatePercent: e.target.value }))
                  }
                  placeholder="e.g. 10"
                  disabled={editing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Renewal basis</Label>
                <Select
                  value={configForm.renewalCommissionBasis}
                  onValueChange={(v) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      renewalCommissionBasis: v as DomainCommissionsBasis,
                    }))
                  }
                  disabled={editing}
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
                <Label htmlFor="renewal-rate">Renewal rate (%)</Label>
                <Input
                  id="renewal-rate"
                  value={configForm.renewalRatePercent}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, renewalRatePercent: e.target.value }))
                  }
                  placeholder="e.g. 5"
                  disabled={editing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Effective from</Label>
                <DatePicker
                  value={toDate(configForm.effectiveFrom)}
                  onChange={(d) => setConfigForm((prev) => ({ ...prev, effectiveFrom: toIsoDay(d) }))}
                  placeholder="From date"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Effective to (exclusive)</Label>
                <DatePicker
                  value={toDate(configForm.effectiveToExclusive)}
                  onChange={(d) =>
                    setConfigForm((prev) => ({ ...prev, effectiveToExclusive: toIsoDay(d) }))
                  }
                  placeholder="Open-ended"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)} disabled={configSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={configSaving}>
              {configSaving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the configuration
              {deleteTarget?.productId
                ? ` for ${productNameById[deleteTarget.productId] || deleteTarget.productId}`
                : ""}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConfig.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteConfig.isPending} onClick={handleDeleteConfig}>
              {deleteConfig.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default AgentDetail;
