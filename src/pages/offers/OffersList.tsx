import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Eye, Plus, Search } from "lucide-react";
import { statusColor, OfferStatus, offerStatusToApi, type Offer } from "@/data/offers";
import { listOffers, offersKeys, useListOffers } from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { useListProducts, mapApiProduct } from "@/api/products";

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

const OffersList = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, pageSize]);

  const listQuery = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== "ALL" ? { status: offerStatusToApi[statusFilter as OfferStatus] } : {}),
  };

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

  const productMap = useMemo(
    () => Object.fromEntries((productsPage?.items ?? []).map(mapApiProduct).map((p) => [p.id, p])),
    [productsPage?.items]
  );

  // Client search only narrows the current server page (API has no search param).
  const rows = useMemo(() => {
    if (!q.trim()) return offers;
    const needle = q.toLowerCase();
    return offers.filter((o) => {
      const holder = o.participants.find((p) => p.role === "policyHolder");
      const haystack = [
        o.id,
        holder?.displayName ?? "",
        holder?.uniqueIdentifier ?? "",
        insuredName(o) ?? "",
        productMap[o.productId]?.name ?? "",
        o.productId,
        o.currency,
        o.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [offers, productMap, q]);

  const totalCount = offersPage?.totalCount ?? 0;
  const totalPages = Math.max(1, offersPage?.totalPages ?? offersPage?.pageCount ?? 1);

  const counts = STATUSES.reduce((acc, s, i) => {
    acc[s] = statusCountQueries[i]?.data?.totalCount ?? 0;
    return acc;
  }, {} as Record<OfferStatus, number>);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">All Offers</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading…"
                  : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search this page…"
                  className="pl-8 h-9 w-[260px]"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
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
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                      No offers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o) => {
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
