import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
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
import { isRenewalStatus, useListRenewals } from "@/api/renewals";
import type { DomainPoliciesPolicyRenewalStatus, PoliciesRenewalListItemResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { Eye, RefreshCw } from "lucide-react";
import {
  RENEWAL_STATUSES,
  formatRenewalMoney,
  formatRenewalPeriod,
  renewalDetailPath,
  renewalStatusClass,
  renewalStatusLabel,
  shortRenewalId,
} from "./renewal-ui";

const COL_COUNT = 10;

type DueFilter = "due" | "notDue";

const RenewalsList = () => {
  const navigate = useNavigate();
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();
  const [searchParams] = useSearchParams();
  const [policyId, setPolicyId] = useState(() => searchParams.get("policyId")?.trim() ?? "");
  const [status, setStatus] = useState<DomainPoliciesPolicyRenewalStatus | "ALL">(() => {
    const fromUrl = searchParams.get("status");
    return isRenewalStatus(fromUrl) ? fromUrl : "ALL";
  });
  const [due, setDue] = useState<DueFilter>(() =>
    searchParams.get("due") === "false" ? "notDue" : "due",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () =>
      compactQuery({
        policyId: policyId.trim() || undefined,
        ...(status !== "ALL" ? { status } : {}),
        due: due === "due",
      }),
    [policyId, status, due],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, due: due === "due", pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListRenewals(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? items.length;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters = Boolean(policyId.trim()) || status !== "ALL" || due !== "due";

  const clearFilters = () => {
    setPolicyId("");
    setStatus("ALL");
    setDue("due");
  };

  const openRow = (row: PoliciesRenewalListItemResponse) => {
    if (row.policyId && row.id) navigate(renewalDetailPath(row.policyId, row.id));
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
            Policy coverage-period renewals: start, price, underwrite, and apply.
          </p>
        </div>
      </div>

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
                <Label className="text-xs text-muted-foreground">Status</Label>
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
                <Select value={due} onValueChange={(v) => setDue(v as DueFilter)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  <TableHead>Policy</TableHead>
                  <TableHead>Insured</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Charge premium</TableHead>
                  <TableHead className="text-right">Docs</TableHead>
                  <TableHead className="text-right">Flags</TableHead>
                  <TableHead className="text-right">Discounts</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={COL_COUNT} />
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      No renewals match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow
                      key={row.id ?? `${row.policyId}-${row.targetPeriodSequence}`}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => openRow(row)}
                    >
                      <TableCell>
                        {row.policyId ? (
                          <Link
                            to={`/policies/${row.policyId}`}
                            className="font-mono text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            title={row.policyId}
                          >
                            {row.policySerial ?? shortRenewalId(row.policyId)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate" title={row.insuredName ?? ""}>
                        {row.insuredName?.trim() || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px]">
                        <div className="truncate" title={row.productName ?? row.productId}>
                          {row.productName?.trim() || row.productId || "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {policyPlanTypeLabel(row.policyPlan)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>#{row.targetPeriodSequence ?? "—"}</div>
                        <div>{formatRenewalPeriod(row.targetPeriod)}</div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${renewalStatusClass(row.status)}`}
                        >
                          {renewalStatusLabel(row.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRenewalMoney(row.chargePremium)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.outstandingDocumentCount ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.raisedReviewFlagCount ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.pendingDiscountRequestCount ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          disabled={!row.id || !row.policyId}
                          onClick={(e) => {
                            e.stopPropagation();
                            openRow(row);
                          }}
                          title="Open renewal"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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
    </AppShell>
  );
};

export default RenewalsList;
