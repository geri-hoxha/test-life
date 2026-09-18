import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { FilterGrid } from "@/components/FilterGrid";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useListInvoices } from "@/api/invoices";
import type {
  DomainInvoicesInvoiceStatus,
  DomainInvoicesInvoiceType,
  InvoicesInvoiceListItemResponse,
} from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Eye, Receipt, RotateCcw } from "lucide-react";
import FiscalizationRetryDialog from "./FiscalizationRetryDialog";
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  formatInvoiceMoney,
  formatServicePeriod,
  invoiceStatusClass,
  invoiceStatusLabel,
  invoiceTypeClass,
  invoiceTypeLabel,
} from "./invoice-ui";

const COL_COUNT = 11;

const isInvoiceStatus = (value: string | null): value is DomainInvoicesInvoiceStatus =>
  value === "pending" || value === "failed" || value === "fiscalized";

const isInvoiceType = (value: string | null): value is DomainInvoicesInvoiceType =>
  value === "credit" || value === "sale";

const InvoicesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [policyId, setPolicyId] = useState(() => searchParams.get("policyId")?.trim() ?? "");
  const [status, setStatus] = useState<DomainInvoicesInvoiceStatus | "ALL">(() => {
    const fromUrl = searchParams.get("status");
    return isInvoiceStatus(fromUrl) ? fromUrl : "ALL";
  });
  const [type, setType] = useState<DomainInvoicesInvoiceType | "ALL">(() => {
    const fromUrl = searchParams.get("type");
    return isInvoiceType(fromUrl) ? fromUrl : "ALL";
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [retryTarget, setRetryTarget] = useState<InvoicesInvoiceListItemResponse | null>(null);

  const filters = useMemo(
    () =>
      compactQuery({
        policyId: policyId.trim() || undefined,
        ...(status !== "ALL" ? { status } : {}),
        ...(type !== "ALL" ? { type } : {}),
      }),
    [policyId, status, type],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListInvoices(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? items.length;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters = Boolean(policyId.trim()) || status !== "ALL" || type !== "ALL";

  const clearFilters = () => {
    setPolicyId("");
    setStatus("ALL");
    setType("ALL");
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fiscal invoices issued against policy premium installments.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> All invoices
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
            <FilterGrid>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Policy ID</Label>
                <Input
                  className="h-9 font-mono text-xs"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="Filter by policy ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value === "ALL" ? "ALL" : (value as DomainInvoicesInvoiceStatus))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {invoiceStatusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value === "ALL" ? "ALL" : (value as DomainInvoicesInvoiceType))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    {INVOICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {invoiceTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterGrid>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Number</TableHead>
                  <TableHead className="whitespace-nowrap">Policy</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Service period</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Net</TableHead>
                  <TableHead className="text-right whitespace-nowrap">VAT</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Gross</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Provider</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={COL_COUNT} />
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      No invoices match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow
                      key={row.id ?? `${row.number}-${row.issuedOn}`}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => row.id && navigate(`/invoices/${row.id}`)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {row.number != null ? `#${row.number}` : "—"}
                      </TableCell>
                      <TableCell>
                        {row.policyId ? (
                          <Link
                            to={`/policies/${row.policyId}`}
                            className="font-mono text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            title={row.policyId}
                          >
                            {row.policySerial ?? row.policyId}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate" title={row.customerName}>
                        {row.customerName?.trim() || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoiceTypeClass(row.type)}`}
                        >
                          {invoiceTypeLabel(row.type)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatServicePeriod(row.servicePeriod)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                        {formatInvoiceMoney(row.totalNetAmount, row.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                        {formatInvoiceMoney(row.totalVatAmount, row.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                        {formatInvoiceMoney(row.totalGrossAmount, row.currency)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoiceStatusClass(row.status)}`}
                        >
                          {invoiceStatusLabel(row.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.provider ? <Badge variant="outline">{row.provider}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.id) navigate(`/invoices/${row.id}`);
                            }}
                            title="View invoice"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            disabled={!row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetryTarget(row);
                            }}
                            title="Retry fiscalization"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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

      <FiscalizationRetryDialog
        invoice={retryTarget}
        open={Boolean(retryTarget)}
        onOpenChange={(open) => {
          if (!open) setRetryTarget(null);
        }}
      />
    </AppShell>
  );
};

export default InvoicesList;
