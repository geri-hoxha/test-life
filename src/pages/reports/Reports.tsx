import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { FilterGrid } from "@/components/FilterGrid";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  PieChart as PieIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { fullName } from "@/data/customers";
import { useListOffers } from "@/api/offers";
import { useListPolicies } from "@/api/policies";
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { customerPath, mergeCustomers } from "@/api/adapters/customers";
import {
  formatPolicyDate,
  POLICY_STATUSES,
  policyNumberLabel,
  policyStatusLabel,
} from "@/pages/policies/policy-ui";
import {
  OFFER_STATUSES,
  formatOfferDate,
  offerStatusLabel,
  shortOfferId,
} from "@/pages/offers/offer-ui";
import type { DomainOffersOfferStatus } from "@/api/types";

const fmtMoney = (v: number, ccy = "EUR") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(v);

const STATUS_COLORS: Record<DomainOffersOfferStatus, string> = {
  draft: "hsl(var(--muted-foreground))",
  quoted: "hsl(217 91% 60%)",
  bound: "hsl(160 84% 39%)",
  cancelled: "hsl(var(--destructive))",
  expired: "hsl(var(--muted-foreground))",
};

const Reports = () => {
  const { data: offersPage } = useListOffers({ pageNumber: 1, pageSize: 200 });
  const { data: policiesPage } = useListPolicies({ pageNumber: 1, pageSize: 200 });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });

  const [productId, setProductId] = useState("__all__");
  const [offerStatus, setOfferStatus] = useState("ALL");
  const [policyStatus, setPolicyStatus] = useState("ALL");
  const [query, setQuery] = useState("");

  const allOffers = offersPage?.items ?? [];
  const allPolicies = policiesPage?.items ?? [];
  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );
  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  const getCustomerLocal = (cid: string) => customers.find((c) => c.id === cid);

  const offers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOffers.filter((o) => {
      if (productId !== "__all__" && o.productId !== productId) return false;
      if (offerStatus !== "ALL" && o.status !== offerStatus) return false;
      if (!q) return true;
      return [o.productName, o.policyHolderName, o.insuredName, o.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [allOffers, productId, offerStatus, query]);

  const policies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPolicies.filter((p) => {
      if (productId !== "__all__" && p.productId !== productId) return false;
      if (policyStatus !== "ALL" && p.status !== policyStatus) return false;
      if (!q) return true;
      return [p.productName, p.policyHolderName, p.insuredName, p.id, p.serial]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [allPolicies, productId, policyStatus, query]);

  const hasFilters =
    productId !== "__all__" ||
    offerStatus !== "ALL" ||
    policyStatus !== "ALL" ||
    Boolean(query.trim());

  // Offers by Status
  const offersByStatus = useMemo(() => {
    return OFFER_STATUSES.map((s) => ({
      status: s,
      label: offerStatusLabel(s),
      count: offers.filter((o) => o.status === s).length,
    }));
  }, [offers]);

  // Policies issued this month
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const policiesThisMonth = policies.filter((p) => p.issuedOnUtc?.startsWith(ym));

  // Premium by product
  const premiumByProduct = useMemo(() => {
    const map = new Map<string, { name: string; premium: number; count: number }>();
    policies.forEach((p) => {
      const prod = products.find((x) => x.id === p.productId);
      const key = p.productId ?? "";
      const cur = map.get(key) ?? {
        name: p.productName?.trim() || prod?.name || p.productId || "—",
        premium: 0,
        count: 0,
      };
      cur.premium += p.firstPeriodChargePremium ?? 0;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.premium - a.premium);
  }, [policies, products]);

  // Pending manual verification
  const pendingReview = offers.filter(
    (o) =>
      o.status === "quoted" &&
      ((o.outstandingDocumentCount ?? 0) > 0 ||
        (o.raisedReviewFlagCount ?? 0) > 0 ||
        (o.pendingDiscountRequestCount ?? 0) > 0),
  );

  // Expiring policies — within next 365 days
  const expiring = useMemo(() => {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 365);
    return policies
      .filter((p) => {
        const end = p.coverageTerm?.endDate;
        if (!end) return false;
        const endDate = new Date(end);
        return endDate >= now && endDate <= horizon;
      })
      .sort((a, b) =>
        (a.coverageTerm?.endDate ?? "") < (b.coverageTerm?.endDate ?? "") ? -1 : 1,
      );
  }, [policies]);

  // Customer exposure — sum of policy premiums + active offer premiums per customer (as policy holder)
  const exposure = useMemo(() => {
    const map = new Map<string, { id: string; name: string; customerType: "Individual" | "Company"; policies: number; offers: number; total: number }>();
    const add = (cid: string, amount: number, isPolicy: boolean) => {
      const c = getCustomerLocal(cid);
      if (!c) return;
      const cur = map.get(cid) ?? { id: cid, name: fullName(c), customerType: c.customerType, policies: 0, offers: 0, total: 0 };
      if (isPolicy) cur.policies += amount; else cur.offers += amount;
      cur.total += amount;
      map.set(cid, cur);
    };
    policies.forEach((p) => {
      const name = p.policyHolderName?.trim();
      if (!name) return;
      const customer = customers.find((c) => fullName(c) === name);
      if (customer) add(customer.id, p.firstPeriodChargePremium ?? 0, true);
    });
    offers
      .filter((o) => o.status !== "cancelled" && o.status !== "expired" && o.status !== "bound")
      .forEach((o) => {
        const name = o.policyHolderName?.trim();
        if (!name) return;
        const customer = customers.find((c) => fullName(c) === name);
        if (customer) add(customer.id, o.firstPeriodChargePremium ?? 0, false);
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [policies, offers]);

  const offerStatusConfig = Object.fromEntries(
    offersByStatus.map((d) => [d.status, { label: d.label, color: STATUS_COLORS[d.status] }])
  );

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Insights</div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational and portfolio overview across offers, policies and customers.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Filters</CardTitle>
                <CardDescription>Applied to the tables and charts below.</CardDescription>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => {
                    setProductId("__all__");
                    setOfferStatus("ALL");
                    setPolicyStatus("ALL");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <FilterGrid>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <Input
                  className="h-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, product, ID…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All products</SelectItem>
                    {products.filter((p) => p.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Offer status</Label>
                <Select value={offerStatus} onValueChange={setOfferStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {OFFER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{offerStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Policy status</Label>
                <Select value={policyStatus} onValueChange={setPolicyStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {POLICY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{policyStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterGrid>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Total Offers</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{offers.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Active Policies</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{policies.filter((p) => p.status === "active").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Issued This Month</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{policiesThisMonth.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Pending Review</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-amber-600">{pendingReview.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><PieIcon className="h-4 w-4" /> Offers by Status</CardTitle>
            <CardDescription>Distribution of all offers in the pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={offerStatusConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={offersByStatus} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {offersByStatus.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status]} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {offersByStatus.map((d) => (
                <div key={d.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[d.status] }} />
                    {d.label}
                  </span>
                  <span className="font-mono font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Premium by Product</CardTitle>
            <CardDescription>Total in-force premium grouped by product.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ premium: { label: "Premium", color: "hsl(var(--primary))" } }} className="h-[260px] w-full">
              <BarChart data={premiumByProduct} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="premium" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="rounded-md border mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Policies</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {premiumByProduct.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-sm text-muted-foreground">No issued policies yet.</TableCell></TableRow>
                  ) : premiumByProduct.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="text-right font-mono">{r.count}</TableCell>
                      <TableCell className="text-right font-mono">{fmtMoney(r.premium)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Policies Issued This Month</CardTitle>
            <CardDescription>{policiesThisMonth.length} policies issued in {now.toLocaleString("en", { month: "long", year: "numeric" })}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policiesThisMonth.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">No policies issued this month.</TableCell></TableRow>
                  ) : policiesThisMonth.map((p) => {
                    return (
                      <TableRow key={p.id}>
                        <TableCell><Link to={`/policies/${p.id}`} className="font-mono text-xs text-primary hover:underline">{policyNumberLabel(p.serial, p.id)}</Link></TableCell>
                        <TableCell className="text-sm">{p.policyHolderName?.trim() || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{formatPolicyDate(p.issuedOnUtc)}</TableCell>
                        <TableCell className="text-right font-mono">{fmtMoney(p.firstPeriodChargePremium ?? 0, p.currency)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Pending Manual Verification</CardTitle>
            <CardDescription>Offers awaiting underwriter review.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer #</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReview.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">No offers awaiting review. </TableCell></TableRow>
                  ) : pendingReview.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell><Link to={`/offers/${o.id}`} className="font-mono text-xs text-primary hover:underline">{shortOfferId(o.id)}</Link></TableCell>
                        <TableCell className="text-sm">{o.policyHolderName?.trim() || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{formatOfferDate(o.createdOnUtc)}</TableCell>
                        <TableCell className="text-right font-mono">{fmtMoney(o.firstPeriodChargePremium ?? 0, o.currency)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Expiring Policies</CardTitle>
          <CardDescription>Policies ending within the next 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiring.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">No policies expiring in the next year.</TableCell></TableRow>
                ) : expiring.map((p) => {
                  const endDate = p.coverageTerm?.endDate ?? "";
                  const days = Math.ceil((new Date(endDate).getTime() - now.getTime()) / 86400000);
                  return (
                    <TableRow key={p.id}>
                      <TableCell><Link to={`/policies/${p.id}`} className="font-mono text-xs text-primary hover:underline">{policyNumberLabel(p.serial, p.id)}</Link></TableCell>
                      <TableCell className="text-sm">{p.policyHolderName?.trim() || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatPolicyDate(endDate)}</TableCell>
                      <TableCell>
                        <Badge variant={days < 60 ? "destructive" : "outline"} className="font-mono">{days}d</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmtMoney(p.firstPeriodChargePremium ?? 0, p.currency)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Customer Exposure Report</CardTitle>
          <CardDescription>Total premium per customer across in-force policies and open offers ({customers.length} customers).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ total: { label: "Exposure", color: "hsl(var(--primary))" } }} className="h-[240px] w-full">
            <BarChart data={exposure.slice(0, 8)} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="rounded-md border mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Policy Premium</TableHead>
                  <TableHead className="text-right">Open Offer Premium</TableHead>
                  <TableHead className="text-right">Total Exposure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposure.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">No exposure recorded yet.</TableCell></TableRow>
                ) : exposure.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Link to={customerPath(r.id, r.customerType)} className="text-primary hover:underline">{r.name}</Link></TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(r.policies)}</TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(r.offers)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{fmtMoney(r.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default Reports;
