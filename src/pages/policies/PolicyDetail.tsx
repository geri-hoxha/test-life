import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShieldCheck, FileText, CreditCard, Calendar, Users, History, Files } from "lucide-react";
import { getPolicy, policyStatusColor } from "@/data/policies";
import { listVersions } from "@/data/productVersions";
import { listTemplates } from "@/data/templates";
import { fullName, ageFromDob } from "@/data/customers";
import PremiumBreakdownPanel from "@/components/premium/PremiumBreakdownPanel";
import { useGetPolicy } from "@/api/policies";
import { mapApiPolicy } from "@/api/adapters/policies";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { customerPath, mergeCustomers } from "@/api/adapters/customers";

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apiPolicy, isLoading } = useGetPolicy(id ?? "", { enabled: Boolean(id) });
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });
  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  const getCustomerLocal = (cid: string) => customers.find((c) => c.id === cid);

  const policy = useMemo(() => {
    if (apiPolicy) return mapApiPolicy(apiPolicy);
    return id ? getPolicy(id) : undefined;
  }, [apiPolicy, id]);

  const { data: apiProduct } = useGetProduct(policy?.productId ?? "", {
    enabled: Boolean(policy?.productId),
  });
  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct]
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold">Loading policy…</h1>
        </div>
      </AppShell>
    );
  }

  if (!policy) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold">Policy not found</h1>
          <Button onClick={() => navigate("/policies")} className="mt-4">Back to Policies</Button>
        </div>
      </AppShell>
    );
  }

  const version = listVersions(policy.productId).find((v) => v.id === policy.versionId);
  const template = listTemplates(policy.productId, policy.versionId).find((t) => t.id === policy.templateId);
  const holder = getCustomerLocal(policy.policyHolderId);
  const insured = getCustomerLocal(policy.insuredId);
  const payer = getCustomerLocal(policy.payerId);


  // Mock payments — first year recorded if Active
  const payments = policy.status === "Active" ? [
    { id: "PAY-001", date: policy.issueDate, amount: policy.premium, method: "Bank transfer", status: "Settled", reference: `INV-${policy.number}-1` },
  ] : [];

  // Mock documents from product config
  const docs = [
    { name: "Application Form", status: "Uploaded", uploadedBy: policy.issuedBy, uploadedAt: policy.issueDate },
    { name: "ID Verification", status: "Uploaded", uploadedBy: policy.issuedBy, uploadedAt: policy.issueDate },
    { name: "Medical Declaration", status: policy.status === "Pending Payment" ? "Pending" : "Uploaded", uploadedBy: policy.issuedBy, uploadedAt: policy.issueDate },
  ];

  // Mock audit trail
  const audit = [
    { ts: policy.issueDate + " 09:14", user: policy.issuedBy, action: "Policy issued", details: `From offer ${policy.offerId}` },
    { ts: policy.issueDate + " 09:14", user: policy.issuedBy, action: "Status set", details: `→ ${policy.status}` },
    { ts: policy.issueDate + " 09:13", user: policy.issuedBy, action: "Premium confirmed", details: fmtMoney(policy.premium, policy.currency) },
  ];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/policies")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Policy</div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{policy.number}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${policyStatusColor[policy.status]}`}>{policy.status}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product?.name} · issued {policy.issueDate} by {policy.issuedBy} · from offer{" "}
            <Link to={`/offers/${policy.offerId}`} className="text-primary hover:underline font-mono">{policy.offerId}</Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card><CardHeader className="pb-1.5"><CardDescription>Gross Premium</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold text-primary">{fmtMoney(policy.premium, policy.currency)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Currency</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{policy.currency}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Term</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{policy.termYears} yrs</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Payment</CardDescription></CardHeader>
          <CardContent><div className="text-sm font-semibold">{policy.paymentMode}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Status</CardDescription></CardHeader>
          <CardContent><div className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {policy.status}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="summary"><FileText className="h-3.5 w-3.5 mr-1.5" />Summary</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Payments</TabsTrigger>
          <TabsTrigger value="documents"><Files className="h-3.5 w-3.5 mr-1.5" />Documents</TabsTrigger>
          <TabsTrigger value="beneficiaries"><Users className="h-3.5 w-3.5 mr-1.5" />Beneficiaries</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-3.5 w-3.5 mr-1.5" />Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Policy Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Product" value={product?.name} />
                <Field label="Version" value={`${version?.name} (${version?.number})`} />
                <Field label="Template" value={template?.name} />
                <Field label="Currency" value={<Badge variant="outline">{policy.currency}</Badge>} />
                <Field label="Start Date" value={<span className="font-mono text-xs">{policy.startDate}</span>} />
                <Field label="End Date" value={<span className="font-mono text-xs">{policy.endDate}</span>} />
                <Field label="Issue Date" value={<span className="font-mono text-xs">{policy.issueDate}</span>} />
                <Field label="Issued By" value={policy.issuedBy} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Policy Holder" value={holder ? <Link to={customerPath(holder.id, holder.customerType)} className="text-primary hover:underline">{fullName(holder)}</Link> : "—"} />
                <Field label="Insured Person" value={insured ? <Link to={customerPath(insured.id, insured.customerType)} className="text-primary hover:underline">{fullName(insured)}</Link> : "—"} />
                <Field label="Payer" value={payer ? <Link to={customerPath(payer.id, payer.customerType)} className="text-primary hover:underline">{fullName(payer)}</Link> : "—"} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <PremiumBreakdownPanel
              data={{
                currency: policy.currency,
                grossPremium: policy.premium,
                taxRate: 0.10,
                bankCommissionPct: template?.bankCommission ?? product?.bankCommission ?? 0,
                agentCommissionPct: template?.agentCommission ?? product?.agentCommission ?? 0,
                reportingCurrency: "EUR",
              }}
            />
          </div>
        </TabsContent>


        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
              <CardDescription>Recorded premium payments and settlements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">No payments recorded.</TableCell></TableRow>
                    ) : payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.date}</TableCell>
                        <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                        <TableCell className="text-sm">{p.method}</TableCell>
                        <TableCell className="text-right font-mono">{fmtMoney(p.amount, policy.currency)}</TableCell>
                        <TableCell><Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{p.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>Underwriting and policy documents on file.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{d.name}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === "Uploaded" ? "outline" : "secondary"}>{d.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{d.uploadedBy}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{d.uploadedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficiaries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiaries</CardTitle>
              <CardDescription>{policy.beneficiaries.length} beneficiaries · total {policy.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policy.beneficiaries.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">No beneficiaries</TableCell></TableRow>
                    ) : policy.beneficiaries.map((b) => {
                      const c = getCustomerLocal(b.customerId);
                      return (
                        <TableRow key={b.id}>
                          <TableCell>{c ? <Link to={customerPath(c.id, c.customerType)} className="text-primary hover:underline">{fullName(c)}</Link> : "—"}</TableCell>
                          <TableCell>{b.relationship}</TableCell>
                          <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>Chronological history of policy events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.ts}</TableCell>
                        <TableCell className="text-sm">{a.user}</TableCell>
                        <TableCell className="text-sm font-medium">{a.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default PolicyDetail;
