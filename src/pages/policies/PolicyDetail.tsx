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
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import { getPolicy, policyStatusColor } from "@/data/policies";
import { seedProducts } from "@/data/products";
import { listVersions } from "@/data/productVersions";
import { listTemplates } from "@/data/templates";
import { getCustomer, fullName } from "@/data/customers";

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
  const policy = id ? getPolicy(id) : undefined;

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

  const product = seedProducts.find((p) => p.id === policy.productId);
  const version = listVersions(policy.productId).find((v) => v.id === policy.versionId);
  const template = listTemplates(policy.productId, policy.versionId).find((t) => t.id === policy.templateId);
  const holder = getCustomer(policy.policyHolderId);
  const insured = getCustomer(policy.insuredId);
  const payer = getCustomer(policy.payerId);

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
        <Card><CardHeader className="pb-1.5"><CardDescription>Premium</CardDescription></CardHeader>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Policy Details</CardTitle></CardHeader>
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
            <Field label="Policy Holder" value={holder ? <Link to={`/customers/${holder.id}`} className="text-primary hover:underline">{fullName(holder)}</Link> : "—"} />
            <Field label="Insured Person" value={insured ? <Link to={`/customers/${insured.id}`} className="text-primary hover:underline">{fullName(insured)}</Link> : "—"} />
            <Field label="Payer" value={payer ? <Link to={`/customers/${payer.id}`} className="text-primary hover:underline">{fullName(payer)}</Link> : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Beneficiaries</CardTitle>
          <CardDescription>{policy.beneficiaries.length} beneficiaries</CardDescription>
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
                  const c = getCustomer(b.customerId);
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{c ? <Link to={`/customers/${c.id}`} className="text-primary hover:underline">{fullName(c)}</Link> : "—"}</TableCell>
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
    </AppShell>
  );
};

export default PolicyDetail;
