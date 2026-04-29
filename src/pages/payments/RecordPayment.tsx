import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard } from "lucide-react";
import { listPolicies, getPolicy } from "@/data/policies";
import { getCustomer, fullName } from "@/data/customers";
import { getScheduleForPolicy, recordPayment, PaymentMethod } from "@/data/payments";
import { toast } from "@/hooks/use-toast";

const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Card"];

const RecordPayment = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const policies = useMemo(() => listPolicies(), []);

  const [policyId, setPolicyId] = useState<string>(search.get("policy") ?? policies[0]?.id ?? "");
  const policy = policyId ? getPolicy(policyId) : undefined;
  const schedule = useMemo(() => (policyId ? getScheduleForPolicy(policyId) : []), [policyId]);
  const dueRows = schedule.filter((r) => r.amount > 0);

  const [year, setYear] = useState<string>(search.get("year") ?? String(dueRows[0]?.year ?? 1));
  const selected = schedule.find((r) => r.year === Number(year));
  const remaining = selected ? Math.max(selected.amount - selected.paidAmount, 0) : 0;

  const [amount, setAmount] = useState<string>(remaining ? remaining.toFixed(2) : "");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [notes, setNotes] = useState("");

  const onPolicyChange = (id: string) => {
    setPolicyId(id);
    const sched = getScheduleForPolicy(id).filter((r) => r.amount > 0);
    const first = sched[0];
    setYear(String(first?.year ?? 1));
    setAmount(first ? Math.max(first.amount - first.paidAmount, 0).toFixed(2) : "");
  };

  const onYearChange = (y: string) => {
    setYear(y);
    const r = schedule.find((x) => x.year === Number(y));
    if (r) setAmount(Math.max(r.amount - r.paidAmount, 0).toFixed(2));
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!policy || !year || !amt || amt <= 0) {
      toast({ title: "Missing information", description: "Select policy, year and a positive amount.", variant: "destructive" });
      return;
    }
    recordPayment({
      policyId: policy.id,
      year: Number(year),
      amount: amt,
      currency: policy.currency,
      paymentDate,
      method,
      notes: notes.trim() || undefined,
    });
    toast({ title: "Payment recorded", description: `${policy.number} · year ${year} · ${amt.toFixed(2)} ${policy.currency}` });
    navigate("/payments");
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </Button>
      </div>

      <div className="mb-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Payments</div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Payment</h1>
        <p className="text-sm text-muted-foreground mt-1">Record a premium payment against a policy installment.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Details</CardTitle>
            <CardDescription>Select policy and installment year.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Policy</Label>
              <Select value={policyId} onValueChange={onPolicyChange}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {policies.map((p) => {
                    const ph = getCustomer(p.policyHolderId);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.number} — {ph ? fullName(ph) : "—"} ({p.currency})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={onYearChange}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dueRows.map((r) => (
                    <SelectItem key={r.year} value={String(r.year)}>
                      Year {r.year} — due {r.dueDate} ({r.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Currency</Label>
              <Input value={policy?.currency ?? ""} readOnly className="mt-1.5 font-mono" />
            </div>

            <div>
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5 font-mono" />
            </div>

            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1.5" />
            </div>

            <div className="md:col-span-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" className="mt-1.5" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Installment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Policy</span><span className="font-mono">{policy?.number ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span className="font-mono">{year}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className="font-mono">{selected?.dueDate ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Amount</span><span className="font-mono">{selected ? selected.amount.toFixed(2) : "—"} {policy?.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span className="font-mono">{selected ? selected.paidAmount.toFixed(2) : "—"} {policy?.currency}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-medium">Remaining</span><span className="font-mono font-semibold">{remaining.toFixed(2)} {policy?.currency}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/payments")}>Cancel</Button>
        <Button onClick={handleSave}>Record Payment</Button>
      </div>
    </AppShell>
  );
};

export default RecordPayment;
