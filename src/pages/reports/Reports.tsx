import { useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
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
import { listOffers, OfferStatus } from "@/data/offers";
import { listPolicies } from "@/data/policies";
import { listProducts } from "@/data/products";
import { listCustomers, fullName, getCustomer } from "@/data/customers";

const fmtMoney = (v: number, ccy = "EUR") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(v);

const STATUS_COLORS: Record<OfferStatus, string> = {
  Draft: "hsl(var(--muted-foreground))",
  Quoted: "hsl(217 91% 60%)",
  "Pending Review": "hsl(38 92% 50%)",
  Approved: "hsl(142 71% 45%)",
  Issued: "hsl(160 84% 39%)",
  Rejected: "hsl(var(--destructive))",
};

const Reports = () => {
  const offers = useMemo(() => listOffers(), []);
  const policies = useMemo(() => listPolicies(), []);
  const products = useMemo(() => listProducts(), []);
  const customers = useMemo(() => listCustomers(), []);

  // Offers by Status
  const offersByStatus = useMemo(() => {
    const order: OfferStatus[] = ["Draft", "Quoted", "Pending Review", "Approved", "Issued", "Rejected"];
    return order.map((s) => ({ status: s, count: offers.filter((o) => o.status === s).length }));
  }, [offers]);

  // Policies issued this month
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const policiesThisMonth = policies.filter((p) => p.issueDate.startsWith(ym));

  // Premium by product
  const premiumByProduct = useMemo(() => {
    const map = new Map<string, { name: string; premium: number; count: number }>();
    policies.forEach((p) => {
      const prod = products.find((x) => x.id === p.productId);
      const key = p.productId;
      const cur = map.get(key) ?? { name: prod?.name ?? p.productId, premium: 0, count: 0 };
      cur.premium += p.premium;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.premium - a.premium);
  }, [policies, products]);

  // Pending manual verification
  const pendingReview = offers.filter((o) => o.status === "Pending Review");

  // Expiring policies — within next 365 days
  const expiring = useMemo(() => {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 365);
    return policies
      .filter((p) => {
        const end = new Date(p.endDate);
        return end >= now && end <= horizon;
      })
      .sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  }, [policies]);

  // Customer exposure — sum of policy premiums + active offer premiums per customer (as policy holder)
  const exposure = useMemo(() => {
    const map = new Map<string, { id: string; name: string; policies: number; offers: number; total: number }>();
    const add = (cid: string, amount: number, isPolicy: boolean) => {
      const c = getCustomer(cid);
      if (!c) return;
      const cur = map.get(cid) ?? { id: cid, name: fullName(c), policies: 0, offers: 0, total: 0 };
      if (isPolicy) cur.policies += amount; else cur.offers += amount;
      cur.total += amount;
      map.set(cid, cur);
    };
    policies.forEach((p) => add(p.policyHolderId, p.premium, true));
    offers.filter((o) => o.status !== "Rejected" && o.status !== "Issued").forEach((o) => add(o.policyHolderId, o.premium, false));
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [policies, offers]);

  const offerStatusConfig = Object.fromEntries(
    offersByStatus.map((d) => [d.status, { label: d.status, color: STATUS_COLORS[d.status] }])
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Total Offers</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{offers.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Active Policies</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{policies.filter((p) => p.status === "Active").length}</div></CardContent>
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

      {/* Row 1: Offers by Status + Premium by Product */}
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
                <Pie data={offersByStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {offersByStatus.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status]} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {offersByStatus.map((d) => (
                <div key={d.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[d.status] }} />
                    {d.status}
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

      {/* Row 2: Issued this month + Pending review */}
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
                    const ph = getCustomer(p.policyHolderId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell><Link to={`/policies/${p.id}`} className="font-mono text-xs text-primary hover:underline">{p.number}</Link></TableCell>
                        <TableCell className="text-sm">{ph ? fullName(ph) : "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.issueDate}</TableCell>
                        <TableCell className="text-right font-mono">{fmtMoney(p.premium, p.currency)}</TableCell>
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
                  ) : pendingReview.map((o) => {
                    const ph = getCustomer(o.policyHolderId);
                    return (
                      <TableRow key={o.id}>
                        <TableCell><Link to={`/offers/${o.id}`} className="font-mono text-xs text-primary hover:underline">{o.number}</Link></TableCell>
                        <TableCell className="text-sm">{ph ? fullName(ph) : "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{o.createdDate}</TableCell>
                        <TableCell className="text-right font-mono">{fmtMoney(o.premium, o.currency)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Expiring policies */}
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
                  const ph = getCustomer(p.policyHolderId);
                  const days = Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / 86400000);
                  return (
                    <TableRow key={p.id}>
                      <TableCell><Link to={`/policies/${p.id}`} className="font-mono text-xs text-primary hover:underline">{p.number}</Link></TableCell>
                      <TableCell className="text-sm">{ph ? fullName(ph) : "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={days < 60 ? "destructive" : "outline"} className="font-mono">{days}d</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmtMoney(p.premium, p.currency)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Exposure */}
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
                    <TableCell><Link to={`/customers/${r.id}`} className="text-primary hover:underline">{r.name}</Link></TableCell>
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
