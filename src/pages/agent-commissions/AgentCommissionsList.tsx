import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { AgentCombobox } from "@/components/AgentCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useListAgentCommissions } from "@/api/agent-commissions";
import type {
  DomainCommissionsBusinessType,
  DomainCommissionsEntryType,
} from "@/api/types";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Eye, Percent } from "lucide-react";
import {
  COMMISSION_BUSINESS_TYPES,
  COMMISSION_ENTRY_TYPES,
  basisLabel,
  businessTypeLabel,
  entryTypeClass,
  entryTypeLabel,
  formatCommissionDateTime,
  formatCommissionMoney,
  formatCommissionRate,
  shortCommissionId,
} from "./commission-ui";

const COL_COUNT = 10;

const isBusinessType = (
  value: string | null,
): value is DomainCommissionsBusinessType =>
  value === "newBusiness" || value === "renewal";

const isEntryType = (
  value: string | null,
): value is DomainCommissionsEntryType =>
  value === "accrual" || value === "reversal";

const toDate = (isoDay: string) => {
  if (!isoDay) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const AgentCommissionsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [agentId, setAgentId] = useState(
    () => searchParams.get("agentId")?.trim() ?? "",
  );
  const [policyId, setPolicyId] = useState(
    () => searchParams.get("policyId")?.trim() ?? "",
  );
  const [productId, setProductId] = useState(
    () => searchParams.get("productId")?.trim() ?? "",
  );
  const [businessType, setBusinessType] = useState<
    DomainCommissionsBusinessType | "ALL"
  >(() => {
    const fromUrl = searchParams.get("businessType");
    return isBusinessType(fromUrl) ? fromUrl : "ALL";
  });
  const [entryType, setEntryType] = useState<
    DomainCommissionsEntryType | "ALL"
  >(() => {
    const fromUrl = searchParams.get("entryType");
    return isEntryType(fromUrl) ? fromUrl : "ALL";
  });
  const [postedFrom, setPostedFrom] = useState(
    () => searchParams.get("postedFrom")?.trim() ?? "",
  );
  const [postedTo, setPostedTo] = useState(
    () => searchParams.get("postedTo")?.trim() ?? "",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () =>
      compactQuery({
        agentId: agentId.trim() || undefined,
        policyId: policyId.trim() || undefined,
        productId: productId.trim() || undefined,
        ...(businessType !== "ALL" ? { businessType } : {}),
        ...(entryType !== "ALL" ? { entryType } : {}),
        postedFrom: dateToUtcStart(postedFrom),
        postedTo: dateToUtcEnd(postedTo),
      }),
    [
      agentId,
      policyId,
      productId,
      businessType,
      entryType,
      postedFrom,
      postedTo,
    ],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
  } = useListAgentCommissions(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? items.length;
  const totalPages = Math.max(
    1,
    pageData?.totalPages ?? pageData?.pageCount ?? 1,
  );

  const hasFilters =
    Boolean(agentId.trim()) ||
    Boolean(policyId.trim()) ||
    Boolean(productId.trim()) ||
    businessType !== "ALL" ||
    entryType !== "ALL" ||
    Boolean(postedFrom) ||
    Boolean(postedTo);

  const clearFilters = () => {
    setAgentId("");
    setPolicyId("");
    setProductId("");
    setBusinessType("ALL");
    setEntryType("ALL");
    setPostedFrom("");
    setPostedTo("");
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agent commissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accrued and reversed commission entries posted against policies.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4" /> All commissions
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
                <Label className="text-xs text-muted-foreground">Agent</Label>
                <AgentCombobox
                  value={agentId}
                  onValueChange={setAgentId}
                  placeholder="All agents"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <ProductCombobox
                  value={productId}
                  onValueChange={setProductId}
                  placeholder="All products"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Business type
                </Label>
                <Select
                  value={businessType}
                  onValueChange={(value) =>
                    setBusinessType(
                      value === "ALL"
                        ? "ALL"
                        : (value as DomainCommissionsBusinessType),
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    {COMMISSION_BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {businessTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Entry type
                </Label>
                <Select
                  value={entryType}
                  onValueChange={(value) =>
                    setEntryType(
                      value === "ALL"
                        ? "ALL"
                        : (value as DomainCommissionsEntryType),
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All entries</SelectItem>
                    {COMMISSION_ENTRY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {entryTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Posted from
                </Label>
                <DatePicker
                  value={toDate(postedFrom)}
                  onChange={(d) =>
                    setPostedFrom(d ? format(d, "yyyy-MM-dd") : "")
                  }
                  placeholder="From date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Posted to
                </Label>
                <DatePicker
                  value={toDate(postedTo)}
                  onChange={(d) =>
                    setPostedTo(d ? format(d, "yyyy-MM-dd") : "")
                  }
                  placeholder="To date"
                  buttonClassName="h-9"
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
                  <TableHead>Posted</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Basis</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={COL_COUNT} />
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={COL_COUNT}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Commission entries could not be loaded.
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COL_COUNT}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No commissions match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => {
                    return (
                      <TableRow
                        key={row.id ?? `${row.policyId}-${row.postedOnUtc}`}
                        className="hover:bg-muted/40 cursor-pointer"
                        onClick={() =>
                          row.id && navigate(`/agent-commissions/${row.id}`)
                        }
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatCommissionDateTime(row.postedOnUtc)}
                        </TableCell>
                        <TableCell>
                          {row.policyId ? (
                            <Link
                              to={`/policies/${row.policyId}`}
                              className="font-mono text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                              title={row.policyId}
                            >
                              {row.policySerial ??
                                shortCommissionId(row.policyId)}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entryTypeClass(row.entryType)}`}
                          >
                            {entryTypeLabel(row.entryType)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCommissionRate(row.appliedRate)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <div>
                            {formatCommissionMoney(
                              row.basisAmount,
                              row.currency,
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {basisLabel(row.basis)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatCommissionMoney(row.amount, row.currency)}
                        </TableCell>

                        <TableCell>
                          {row.productId ? (
                            <Link
                              to={`/products/${row.productId}`}
                              className="text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.productName?.trim() ||
                                shortCommissionId(row.productId)}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-sm max-w-[180px] truncate"
                          title={row.agentId}
                        >
                          {row.agentId ? (
                            <Link
                              to={`/agents/${row.agentId}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-mono text-xs">
                                {shortCommissionId(row.agentId)}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {businessTypeLabel(row.businessType)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.id)
                                navigate(`/agent-commissions/${row.id}`);
                            }}
                            title="View commission"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

export default AgentCommissionsList;
