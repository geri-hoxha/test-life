import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Search } from "lucide-react";
import { getAllSchedules, paymentStatusColor, PaymentStatus } from "@/data/payments";
import { getCustomer, fullName } from "@/data/customers";
import { getPolicy } from "@/data/policies";

const STATUSES: PaymentStatus[] = ["Unpaid", "Partially Paid", "Paid"];

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const PaymentsList = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const rows = useMemo(() => getAllSchedules(), []);

  const filtered = rows.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const policy = getPolicy(r.policyId);
    const holder = policy ? getCustomer(policy.policyHolderId) : undefined;
    return [r.policyNumber, holder ? fullName(holder) : ""].join(" ").toLowerCase().includes(q.toLowerCase());
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = rows.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<PaymentStatus, number>);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Operations</div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Premium payment schedules across all issued policies.
          </p>
        </div>
        <Button onClick={() => navigate("/payments/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
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
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Schedule</CardTitle>
              <CardDescription>{filtered.length} of {rows.length} installments</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search policy, customer…" className="pl-8 h-9 w-[260px]" value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <TableHead>Year</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">No installments match the current filters.</TableCell></TableRow>
                ) : filtered.map((r) => {
                  const policy = getPolicy(r.policyId);
                  const holder = policy ? getCustomer(policy.policyHolderId) : undefined;
                  return (
                    <TableRow key={`${r.policyId}-${r.year}`} className="hover:bg-muted/40">
                      <TableCell>
                        <Link to={`/policies/${r.policyId}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.policyNumber}</Link>
                      </TableCell>
                      <TableCell>{holder ? fullName(holder) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{r.year}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.dueDate}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtMoney(r.amount, r.currency)}</TableCell>
                      <TableCell><Badge variant="outline">{r.currency}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentStatusColor[r.status]}`}>{r.status}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.lastPaymentDate ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {r.status !== "Paid" && r.amount > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/payments/new?policy=${r.policyId}&year=${r.year}`)}>
                            Record
                          </Button>
                        )}
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

export default PaymentsList;
