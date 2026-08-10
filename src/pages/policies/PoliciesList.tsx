import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { ProductCombobox } from "@/components/ProductCombobox";
import { PersonCombobox } from "@/components/PersonCombobox";
import { OfferCombobox } from "@/components/OfferCombobox";
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
import { Eye, ShieldCheck } from "lucide-react";
import { policyStatusColor, PolicyStatus, type Policy } from "@/data/policies";
import { CURRENCIES } from "@/data/fxRates";
import { useListPolicies } from "@/api/policies";
import { mapApiPolicy } from "@/api/adapters/policies";
import { customerPath } from "@/api/adapters/customers";
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListOffers } from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { compactQuery, dateToUtcDay, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUSES: PolicyStatus[] = ["Active", "Pending Payment", "Cancelled", "Expired", "Lapsed"];

const COL_COUNT = 11;

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 2,
  }).format(v);

const insuredName = (p: Policy) => {
  const person = p.insuredPersons[0];
  if (!person) return null;
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  return name || person.personalIdentifier || null;
};

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

const yearsLabel = (p: Policy) => {
  if (p.policyYears.length === 0) return null;
  if (p.policyYears.length === 1) return String(p.policyYears[0].year);
  const years = p.policyYears.map((y) => y.year);
  return `${years[0]}–${years[years.length - 1]}`;
};

const toDate = (isoDay: string) => {
  if (!isoDay) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const PoliciesList = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [currency, setCurrency] = useState("__all__");
  const [issuedFrom, setIssuedFrom] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [effectiveOn, setEffectiveOn] = useState("");
  const [personId, setPersonId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () =>
      compactQuery({
        productId: productId.trim() || undefined,
        offerId: offerId.trim() || undefined,
        ...(currency !== "__all__" ? { currency } : {}),
        issuedFromUtc: dateToUtcStart(issuedFrom),
        issuedToUtc: dateToUtcEnd(issuedTo),
        effectiveOnUtc: dateToUtcDay(effectiveOn),
        personId: personId.trim() || undefined,
      }),
    [productId, offerId, currency, issuedFrom, issuedTo, effectiveOn, personId]
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };

  const { data: policiesPage, isLoading, isFetching } = useListPolicies(listQuery);
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });
  const { data: offersPage } = useListOffers({ pageNumber: 1, pageSize: 200 });

  const policies = useMemo(
    () => (policiesPage?.items ?? []).map(mapApiPolicy),
    [policiesPage?.items]
  );

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const offers = useMemo(
    () => (offersPage?.items ?? []).map(mapApiOffer),
    [offersPage?.items]
  );

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const totalCount = policiesPage?.totalCount ?? 0;
  const totalPages = Math.max(1, policiesPage?.totalPages ?? policiesPage?.pageCount ?? 1);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = policies.filter((p) => p.status === s).length;
    return acc;
  }, {} as Record<PolicyStatus, number>);

  const clearFilters = () => {
    setProductId("");
    setOfferId("");
    setCurrency("__all__");
    setIssuedFrom("");
    setIssuedTo("");
    setEffectiveOn("");
    setPersonId("");
  };

  const hasFilters =
    productId ||
    offerId ||
    currency !== "__all__" ||
    issuedFrom ||
    issuedTo ||
    effectiveOn ||
    personId;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Operations</div>
          <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issued life insurance policies in force.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-1.5"><CardDescription className="text-[11px] uppercase tracking-wider">{s}</CardDescription></CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-semibold">{counts[s]}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">this page</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> All Policies</CardTitle>
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
                <Label className="text-xs text-muted-foreground">Offer</Label>
                <OfferCombobox
                  offers={offers}
                  value={offerId}
                  onValueChange={setOfferId}
                  placeholder="All offers"
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
                <Label className="text-xs text-muted-foreground">Issued from</Label>
                <DatePicker
                  value={toDate(issuedFrom)}
                  onChange={(d) => setIssuedFrom(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="From date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Issued to</Label>
                <DatePicker
                  value={toDate(issuedTo)}
                  onChange={(d) => setIssuedTo(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="To date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Effective on</Label>
                <DatePicker
                  value={toDate(effectiveOn)}
                  onChange={(d) => setEffectiveOn(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Effective date"
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
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Insured</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Insured Amount</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      Loading policies…
                    </TableCell>
                  </TableRow>
                ) : policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="text-center py-10 text-sm text-muted-foreground">
                      No policies match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((p) => {
                    const holderParticipant = p.participants.find((x) => x.role === "policyHolder");
                    const holder = holderParticipant?.displayName?.trim() || null;
                    const insured = insuredName(p);
                    const insuredPerson = p.insuredPersons[0];
                    const product = productMap[p.productId];
                    const years = yearsLabel(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          {holder && holderParticipant?.partyId ? (
                            <div className="min-w-0">
                              <Link
                                to={customerPath(
                                  holderParticipant.partyId,
                                  holderParticipant.partyType ?? "person",
                                )}
                                className="text-sm truncate text-primary hover:underline block"
                              >
                                {holder}
                              </Link>
                              {holderParticipant.uniqueIdentifier && (
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
                          {insured && insuredPerson?.personId ? (
                            <Link
                              to={customerPath(insuredPerson.personId, "person")}
                              className="text-primary hover:underline"
                            >
                              {insured}
                            </Link>
                          ) : (
                            insured ?? <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm" title={p.productId}>
                          {product?.name ?? shortId(p.productId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.currency}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {p.insuredAmount > 0
                            ? fmtMoney(p.insuredAmount, p.currency)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {p.premium > 0
                            ? fmtMoney(p.premium, p.currency)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {years ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${policyStatusColor[p.status]}`}>
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{p.issueDate}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {p.startDate}
                          {p.endDate ? ` → ${p.endDate}` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => navigate(`/policies/${p.id}`)}
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

export default PoliciesList;
