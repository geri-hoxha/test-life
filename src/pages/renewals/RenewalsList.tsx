import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { AccessDeniedOr } from "@/components/AccessDeniedNotice";
import { PolicyCombobox } from "@/components/PolicyCombobox";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  isRenewalStatus,
  useListRenewals,
  useStartPolicyRenewal,
} from "@/api/renewals";
import type {
  DomainPoliciesPolicyRenewalStatus,
  PoliciesRenewalListItemResponse,
} from "@/api/types";
import { toastApiError } from "@/lib/api-error";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { toast } from "sonner";
import { Play, RefreshCw } from "lucide-react";
import { StartRenewalBalanceFields } from "./StartRenewalBalanceFields";
import {
  RENEWAL_STATUSES,
  formatRenewalMoney,
  formatRenewalPeriod,
  renewalDetailPath,
  renewalStatusClass,
  renewalStatusLabel,
  shortRenewalId,
} from "./renewal-ui";
import { startRenewalRequestBody } from "./start-renewal-balances";

const COL_COUNT = 12;

type DueFilter = "due" | "notDue" | null;

const dueFromSearch = (value: string | null): DueFilter => {
  if (value === "true") return "due";
  if (value === "false") return "notDue";
  return null;
};

const RenewalsList = () => {
  const navigate = useNavigate();
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();
  const [searchParams] = useSearchParams();
  const [policyId, setPolicyId] = useState(
    () => searchParams.get("policyId")?.trim() ?? "",
  );
  const [status, setStatus] = useState<
    DomainPoliciesPolicyRenewalStatus | "ALL"
  >(() => {
    const fromUrl = searchParams.get("status");
    return isRenewalStatus(fromUrl) ? fromUrl : "ALL";
  });
  const [due, setDue] = useState<DueFilter>(() =>
    dueFromSearch(searchParams.get("due")),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startTarget, setStartTarget] =
    useState<PoliciesRenewalListItemResponse | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [balanceError, setBalanceError] = useState(false);
  const startRenewal = useStartPolicyRenewal();

  const resetStartBalances = () => {
    setOpeningBalance("");
    setClosingBalance("");
    setBalanceError(false);
  };

  const filters = useMemo(
    () =>
      compactQuery({
        policyId: policyId.trim() || undefined,
        ...(status !== "ALL" ? { status } : {}),
        ...(due === null ? {} : { due: due === "due" }),
      }),
    [policyId, status, due],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = {
    ...debouncedFilters,
    pageNumber: page,
    pageSize,
  };
  const {
    data: pageData,
    isLoading,
    isFetching,
    error,
  } = useListRenewals(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? items.length;
  const totalPages = Math.max(
    1,
    pageData?.totalPages ?? pageData?.pageCount ?? 1,
  );

  const hasFilters =
    Boolean(policyId.trim()) || status !== "ALL" || due !== null;

  const clearFilters = () => {
    setPolicyId("");
    setStatus("ALL");
    setDue(null);
  };

  const openRow = (row: PoliciesRenewalListItemResponse) => {
    if (row.policyId && row.id)
      navigate(renewalDetailPath(row.policyId, row.id));
  };

  const confirmStart = () => {
    if (!startTarget?.policyId || !startTarget.id) return;
    const balances = startRenewalRequestBody(openingBalance, closingBalance);
    if (!balances.ok) {
      setBalanceError(true);
      return;
    }
    startRenewal.mutate(
      {
        policyId: startTarget.policyId,
        renewalId: startTarget.id,
        body: balances.body,
      },
      {
        onSuccess: () => {
          toast.success("Renewal started");
          setStartTarget(null);
          resetStartBalances();
        },
        onError: (err) => toastApiError(err, "Failed to start renewal"),
      },
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Business
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Renewals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Policy coverage-period renewals: start, price, underwrite, and
            apply.
          </p>
        </div>
      </div>

      <AccessDeniedOr error={error}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Policy renewals
                  </CardTitle>
                  <CardDescription>
                    {isLoading
                      ? "Loading…"
                      : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
                  </CardDescription>
                </div>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Policy
                  </Label>
                  <PolicyCombobox
                    value={policyId}
                    onValueChange={setPolicyId}
                    placeholder="All policies"
                    allowClear
                    triggerClassName="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(v) =>
                      setStatus(v as DomainPoliciesPolicyRenewalStatus | "ALL")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      {RENEWAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {renewalStatusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Due</Label>
                  <Select
                    value={due ?? "ALL"}
                    onValueChange={(v) =>
                      setDue(v === "ALL" ? null : (v as DueFilter))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="notDue">Not due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Insured</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      Opening
                    </TableHead>
                    <TableHead className="text-right font-semibold text-yellow-600 dark:text-yellow-400">
                      Closing
                    </TableHead>
                    <TableHead className="text-right">Charge premium</TableHead>
                    <TableHead className="text-right">Docs</TableHead>
                    <TableHead className="w-[110px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableLoadingRow colSpan={COL_COUNT} />
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={COL_COUNT}
                        className="text-center py-10 text-sm text-muted-foreground"
                      >
                        No renewals match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow
                        key={
                          row.id ??
                          `${row.policyId}-${row.targetPeriodSequence}`
                        }
                        className={
                          row.id && row.policyId
                            ? "hover:bg-muted/40 cursor-pointer"
                            : "hover:bg-muted/40"
                        }
                        onClick={() => openRow(row)}
                      >
                        <TableCell className="font-mono text-xs">
                          {row.policySerial != null
                            ? row.policySerial
                            : row.policyId
                              ? shortRenewalId(row.policyId)
                              : "—"}
                        </TableCell>
                        <TableCell
                          className="text-sm max-w-[180px] truncate"
                          title={row.insuredName ?? ""}
                        >
                          {row.insuredName?.trim() || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          <div
                            className="truncate"
                            title={row.productName ?? row.productId}
                          >
                            {row.productName?.trim() || row.productId || "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {policyPlanTypeLabel(row.policyPlan)}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-48 font-mono text-xs text-muted-foreground">
                          <div>{formatRenewalPeriod(row.targetPeriod)}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${renewalStatusClass(row.status)}`}
                          >
                            {renewalStatusLabel(row.status)}
                          </span>
                        </TableCell>
                        <TableCell
                          className={
                            row.requiresLoanBalances
                              ? "text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                              : "text-right font-mono text-sm font-semibold text-muted-foreground"
                          }
                        >
                          {row.requiresLoanBalances
                            ? formatRenewalMoney(row.openingBalance)
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={
                            row.requiresLoanBalances
                              ? "text-right font-mono text-sm font-semibold text-yellow-600 dark:text-yellow-400"
                              : "text-right font-mono text-sm font-semibold text-muted-foreground"
                          }
                        >
                          {row.requiresLoanBalances
                            ? formatRenewalMoney(row.closingBalance)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatRenewalMoney(row.chargePremium)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.outstandingDocumentCount ?? 0}
                        </TableCell>

                        <TableCell className="text-right">
                          {row.status === "planned" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                              disabled={!row.id || !row.policyId}
                              onClick={(e) => {
                                e.stopPropagation();
                                resetStartBalances();
                                setStartTarget(row);
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </AccessDeniedOr>
      <AlertDialog
        open={startTarget != null}
        onOpenChange={(open) => {
          if (!open && !startRenewal.isPending) {
            setStartTarget(null);
            resetStartBalances();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start this renewal?</AlertDialogTitle>
            <AlertDialogDescription>
              {startTarget?.policySerial != null
                ? `Start underwriting for policy ${startTarget.policySerial}.`
                : "Start underwriting for this renewal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <StartRenewalBalanceFields
            openingBalance={openingBalance}
            closingBalance={closingBalance}
            onOpeningBalanceChange={setOpeningBalance}
            onClosingBalanceChange={setClosingBalance}
            disabled={startRenewal.isPending}
            showError={balanceError}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={startRenewal.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={startRenewal.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmStart();
              }}
            >
              <Play className="h-3.5 w-3.5" />
              {startRenewal.isPending ? "Starting…" : "Start"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default RenewalsList;
