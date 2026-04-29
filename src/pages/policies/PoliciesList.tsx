import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
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
import { Eye, Search, ShieldCheck } from "lucide-react";
import { listPolicies, policyStatusColor, PolicyStatus } from "@/data/policies";
import { seedProducts } from "@/data/products";
import { getCustomer, fullName } from "@/data/customers";

const STATUSES: PolicyStatus[] = ["Active", "Pending Payment", "Cancelled", "Expired", "Lapsed"];

const PoliciesList = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const policies = useMemo(() => listPolicies(), []);
  const productMap = useMemo(() => Object.fromEntries(seedProducts.map((p) => [p.id, p])), []);

  const filtered = policies.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const holder = getCustomer(p.policyHolderId);
    const haystack = [p.number, holder ? fullName(holder) : "", productMap[p.productId]?.name ?? ""].join(" ").toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = policies.filter((p) => p.status === s).length;
    return acc;
  }, {} as Record<PolicyStatus, number>);

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
            <CardContent className="pb-3"><div className="text-xl font-semibold">{counts[s]}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> All Policies</CardTitle>
              <CardDescription>{filtered.length} of {policies.length} policies</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search policy, customer, product…" className="pl-8 h-9 w-[260px]" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
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
                  <TableHead>Policy #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gross Premium</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">No policies match the current filters.</TableCell></TableRow>
                ) : filtered.map((p) => {
                  const ph = getCustomer(p.policyHolderId);
                  const product = productMap[p.productId];
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/policies/${p.id}`)}>
                      <TableCell>
                        <Link to={`/policies/${p.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{p.number}</Link>
                      </TableCell>
                      <TableCell>{ph ? fullName(ph) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{product?.name ?? p.productId}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.startDate}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.endDate}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${policyStatusColor[p.status]}`}>{p.status}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.premium)}
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.currency}</Badge></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(`/policies/${p.id}`)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default PoliciesList;
