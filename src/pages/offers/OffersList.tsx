import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { FilterGrid } from "@/components/FilterGrid";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { ProductCombobox } from "@/components/ProductCombobox";
import { PersonCombobox } from "@/components/PersonCombobox";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Eye, Plus, RefreshCw } from "lucide-react";
import { getCurrencies } from "@/config/currencies";
import { useListOffers } from "@/api/offers";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { DomainOffersOfferStatus } from "@/api/types";
import { AccessDeniedOr } from "@/components/AccessDeniedNotice";
import { isApiForbidden } from "@/lib/api-error";
import {
  OFFER_STATUSES,
  formatCoverageTerm,
  formatOfferMoney,
  offerStatusClass,
  offerStatusLabel,
} from "./offer-ui";

const COL_COUNT = 8;

const toDate = (isoDay: string) => {
  if (!isoDay) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const OffersList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [productId, setProductId] = useState("");
  const [currency, setCurrency] = useState("__all__");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [personId, setPersonId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () =>
      compactQuery({
        ...(statusFilter !== "ALL" ? { status: statusFilter as DomainOffersOfferStatus } : {}),
        productId: productId.trim() || undefined,
        ...(currency !== "__all__" ? { currency } : {}),
        createdFromUtc: dateToUtcStart(createdFrom),
        createdToUtc: dateToUtcEnd(createdTo),
        partyId: partyId.trim() || undefined,
        personId: personId.trim() || undefined,
      }),
    [statusFilter, productId, currency, createdFrom, createdTo, partyId, personId],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };

  const { data: offersPage, isLoading, isFetching, isError, error } = useListOffers(listQuery);
  const accessDenied = isApiForbidden(error);

  const items = offersPage?.items ?? [];

  const totalCount = offersPage?.totalCount ?? 0;
  const totalPages = Math.max(1, offersPage?.totalPages ?? offersPage?.pageCount ?? 1);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setProductId("");
    setCurrency("__all__");
    setCreatedFrom("");
    setCreatedTo("");
    setPersonId("");
    setPartyId("");
  };

  const hasFilters =
    statusFilter !== "ALL" ||
    productId ||
    currency !== "__all__" ||
    createdFrom ||
    createdTo ||
    partyId ||
    personId;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Sales
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Draft policies awaiting quotation, review, or issuance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/renewals")}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Renewals
          </Button>
          {!accessDenied && (
            <Button onClick={() => navigate("/offers/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Offer
            </Button>
          )}
        </div>
      </div>

      <AccessDeniedOr error={error}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">All Offers</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading…"
                    : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
                </CardDescription>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
            <FilterGrid>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {OFFER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {offerStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All currencies</SelectItem>
                    {getCurrencies().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Party</Label>
                <CustomerCombobox
                  value={partyId}
                  onValueChange={setPartyId}
                  placeholder="All parties"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Person</Label>
                <PersonCombobox
                  value={personId}
                  onValueChange={setPersonId}
                  placeholder="All people"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Created from</Label>
                <DatePicker
                  value={toDate(createdFrom)}
                  onChange={(d) => setCreatedFrom(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="From date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Created to</Label>
                <DatePicker
                  value={toDate(createdTo)}
                  onChange={(d) => setCreatedTo(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="To date"
                  buttonClassName="h-9"
                />
              </div>
            </FilterGrid>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Insured</TableHead>
                  <TableHead className="text-right">Sum Insured</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={COL_COUNT} label="Loading offers…" />
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      Offers could not be loaded.
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      No offers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((o) => {
                    const productName = o.productName?.trim() || "—";
                    const productCell = o.id ? (
                      <Link
                        to={`/offers/${o.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {productName}
                      </Link>
                    ) : (
                      <span className="text-sm">{productName}</span>
                    );
                    return (
                      <TableRow
                        key={o.id}
                        className={o.id ? "cursor-pointer" : undefined}
                        onClick={() => o.id && navigate(`/offers/${o.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {productCell}
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.insuredName?.trim() || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatOfferMoney(o.sumInsured, o.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-success">
                          {formatOfferMoney(o.firstPeriodChargePremium, o.currency)}
                        </TableCell>
                        <TableCell>
                          {o.currency ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs px-2 py-0.5 !rounded-sm border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                            >
                              {o.currency}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatCoverageTerm(o.coverageTerm)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`border-0 ${offerStatusClass(o.status)}`}>
                            {offerStatusLabel(o.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => o.id && navigate(`/offers/${o.id}`)}
                            disabled={!o.id}
                            title="View offer"
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
      </AccessDeniedOr>
    </AppShell>
  );
};

export default OffersList;
