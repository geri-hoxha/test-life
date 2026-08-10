import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { ProductCombobox } from "@/components/ProductCombobox";
import { PersonCombobox } from "@/components/PersonCombobox";
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
import { Eye, Plus } from "lucide-react";
import { statusColor, OfferStatus, offerStatusToApi, type Offer } from "@/data/offers";
import { CURRENCIES } from "@/data/fxRates";
import { listOffers, offersKeys, useListOffers } from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { useListProducts, mapApiProduct } from "@/api/products";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUSES: OfferStatus[] = [
  "Draft",
  "Quoted",
  "Partially Bound",
  "Bound",
  "Cancelled",
  "Expired",
];

const insuredName = (o: Offer) => {
  const person = o.insuredPersons[0];
  if (!person) return null;
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  return name || person.personalIdentifier || null;
};

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () =>
      compactQuery({
        ...(statusFilter !== "ALL" ? { status: offerStatusToApi[statusFilter as OfferStatus] } : {}),
        productId: productId.trim() || undefined,
        ...(currency !== "__all__" ? { currency } : {}),
        createdFromUtc: dateToUtcStart(createdFrom),
        createdToUtc: dateToUtcEnd(createdTo),
        personId: personId.trim() || undefined,
      }),
    [statusFilter, productId, currency, createdFrom, createdTo, personId]
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };

  const { data: offersPage, isLoading, isFetching } = useListOffers(listQuery);
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });

  const statusCountQueries = useQueries({
    queries: STATUSES.map((s) => {
      const params = { pageNumber: 1, pageSize: 1, status: offerStatusToApi[s] };
      return {
        queryKey: offersKeys.list(params),
        queryFn: ({ signal }: { signal?: AbortSignal }) => listOffers(params, signal),
        staleTime: 30_000,
      };
    }),
  });

  const offers = useMemo(
    () => (offersPage?.items ?? []).map(mapApiOffer),
    [offersPage?.items]
  );

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const totalCount = offersPage?.totalCount ?? 0;
  const totalPages = Math.max(1, offersPage?.totalPages ?? offersPage?.pageCount ?? 1);

  const counts = STATUSES.reduce((acc, s, i) => {
    acc[s] = statusCountQueries[i]?.data?.totalCount ?? 0;
    return acc;
  }, {} as Record<OfferStatus, number>);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setProductId("");
    setCurrency("__all__");
    setCreatedFrom("");
    setCreatedTo("");
    setPersonId("");
  };

  const hasFilters =
    statusFilter !== "ALL" ||
    productId ||
    currency !== "__all__" ||
    createdFrom ||
    createdTo ||
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
        <Button onClick={() => navigate("/offers/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Offer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-1.5">
              <CardDescription className="text-[11px] uppercase tracking-wider">{s}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-semibold">{counts[s]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <ProductCombobox
                  products={products}
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
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Insured</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : offers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                      No offers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((o) => {
                    const holderParticipant = o.participants.find((p) => p.role === "policyHolder");
                    const holder = holderParticipant?.displayName?.trim() || null;
                    const insured = insuredName(o);
                    const product = productMap[o.productId];
                    const hasSchedule = o.schedules.length > 0;
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            to={`/offers/${o.id}`}
                            className="font-mono text-xs font-medium text-primary hover:underline"
                            title={o.id}
                          >
                            {shortId(o.id)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {holder ? (
                            <div className="min-w-0">
                              <div className="text-sm truncate">{holder}</div>
                              {holderParticipant?.uniqueIdentifier && (
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {holderParticipant.uniqueIdentifier}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {insured ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{product?.name ?? o.productId}</TableCell>
                        <TableCell><Badge variant="outline">{o.currency}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {hasSchedule
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: o.currency,
                              }).format(o.premium)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[o.status]}`}>
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{o.createdDate}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => navigate(`/offers/${o.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
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

export default OffersList;
