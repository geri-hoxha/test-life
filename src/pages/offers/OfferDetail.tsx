import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Calculator,
  Calendar,
  Users,
  FileText,
  StickyNote,
  Package,
  AlertTriangle,
} from "lucide-react";
import { getOffer, statusColor, setOfferStatus, OfferStatus } from "@/data/offers";
import { seedProducts } from "@/data/products";
import { listVersions } from "@/data/productVersions";
import { listTemplates, overrideSummary } from "@/data/templates";
import { getCustomer, fullName, ageFromDob } from "@/data/customers";
import PremiumBreakdownPanel from "@/components/premium/PremiumBreakdownPanel";
import { listCoverages } from "@/data/coverages";
import { listDocuments } from "@/data/documents";
import PremiumCalculation, { PremiumResult } from "./PremiumCalculation";
import VerificationStep, { VerificationCheck, overallStatus } from "./VerificationStep";
import type { Gender as RuleGender } from "@/data/premiumRules";
import { toast } from "sonner";

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const offer = id ? getOffer(id) : undefined;
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(null);
  const [verificationChecks, setVerificationChecks] = useState<VerificationCheck[]>([]);
  const [notes, setNotes] = useState(
    "Initial draft prepared by Erin Hoxha. Awaiting underwriter review.\n• Customer requested annual payment.\n• Beneficiary split confirmed via call on 2026-04-22."
  );

  if (!offer) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold">Offer not found</h1>
          <p className="text-sm text-muted-foreground mt-2">The offer you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/offers")} className="mt-4">Back to Offers</Button>
        </div>
      </AppShell>
    );
  }

  const product = seedProducts.find((p) => p.id === offer.productId);
  const version = listVersions(offer.productId).find((v) => v.id === offer.versionId);
  const template = listTemplates(offer.productId, offer.versionId).find((t) => t.id === offer.templateId);
  const holder = getCustomer(offer.policyHolderId);
  const insured = getCustomer(offer.insuredId);
  const payer = getCustomer(offer.payerId);
  const coverages = listCoverages(offer.productId, offer.versionId);
  const docs = listDocuments(offer.productId, offer.versionId);

  const insuredAge = insured ? ageFromDob(insured.dateOfBirth) : 35;
  const insuredGender: RuleGender = insured?.gender === "Female" ? "Female" : insured?.gender === "Male" ? "Male" : "Any";

  const mandatoryCoverages = coverages.filter(
    (c) => c.coverageType === "Mandatory" && template?.includedCoverageIds.includes(c.id)
  );
  const includedRiders = coverages.filter(
    (c) => c.coverageType === "Optional Rider" && template?.optionalRiderIds.includes(c.id)
  );

  const verifOverall = overallStatus(verificationChecks);
  const reviewCount = verificationChecks.filter((c) => c.result === "Requires Review").length;
  const warnCount = verificationChecks.filter((c) => c.result === "Warning").length;

  const updateStatus = (s: OfferStatus, msg: string) => {
    setOfferStatus(offer.id, s);
    toast.success(msg);
    refresh();
  };

  const canApprove = offer.status === "Quoted" || offer.status === "Pending Review";
  const canReject = offer.status !== "Issued" && offer.status !== "Rejected";
  const canIssue = offer.status === "Approved";

  return (
    <AppShell>
      {/* Back */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/offers")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Offers
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Offer</div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{offer.number}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${statusColor[offer.status]}`}>
              {offer.status}
            </span>
            {verifOverall === "Pending Review" && verificationChecks.length > 0 && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3 w-3 mr-1" /> Verification flagged
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product?.name} · {template?.name} · created {offer.createdDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Open editor (demo)")}>
            <Edit className="h-4 w-4" /> Edit Offer
          </Button>
          <Button
            variant="outline" size="sm" className="gap-2"
            onClick={() => { refresh(); toast.success("Premium recalculated"); }}
          >
            <RefreshCw className="h-4 w-4" /> Recalculate Premium
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={!canReject}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject this offer?</AlertDialogTitle>
                <AlertDialogDescription>
                  {offer.number} will be marked as Rejected. This can be reverted by the underwriter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateStatus("Rejected", `${offer.number} rejected`)}>
                  Reject Offer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            size="sm" variant="secondary" className="gap-2"
            onClick={() => updateStatus("Approved", `${offer.number} approved`)}
            disabled={!canApprove}
          >
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
          <Button
            size="sm" className="gap-2"
            onClick={() => navigate(`/offers/${offer.id}/issue`)}
            disabled={!canIssue}
          >
            <Send className="h-4 w-4" /> Issue Policy
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Gross Premium</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold text-primary">{fmtMoney(offer.premium || premiumResult?.grossPremium || 0, offer.currency)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Currency</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{offer.currency}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Term</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{offer.termYears} years</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Payment Mode</CardDescription></CardHeader>
          <CardContent><div className="text-sm font-semibold">{offer.paymentMode}</div></CardContent>
        </Card>
        <Card className={verifOverall === "Pending Review" ? "border-amber-500/40 bg-amber-500/5" : ""}>
          <CardHeader className="pb-1.5"><CardDescription>Verification</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              {verifOverall === "Pending Review" ? (
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="text-sm font-semibold">{verifOverall}</span>
            </div>
            {verificationChecks.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {reviewCount} review · {warnCount} warning
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full md:w-auto">
          <TabsTrigger value="summary" className="gap-1.5"><Package className="h-3.5 w-3.5" />Summary</TabsTrigger>
          <TabsTrigger value="premium" className="gap-1.5"><Calculator className="h-3.5 w-3.5" />Premium</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="people" className="gap-1.5"><Users className="h-3.5 w-3.5" />People</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="verification" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Verification</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="h-3.5 w-3.5" />Notes</TabsTrigger>
        </TabsList>

        {/* SUMMARY */}
        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Product & Coverage</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Product" value={product?.name} />
                <Field label="Product Code" value={<span className="font-mono text-xs">{product?.code}</span>} />
                <Field label="Version" value={`${version?.name} (${version?.number})`} />
                <Field label="Template / Package" value={template?.name} />
                <div className="col-span-2">
                  <Field label="Premium Override" value={template ? overrideSummary(template, offer.currency) : "—"} />
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Mandatory Coverages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mandatoryCoverages.length > 0 ? mandatoryCoverages.map((c) => (
                      <Badge key={c.id} variant="secondary">{c.name}</Badge>
                    )) : <span className="text-sm text-muted-foreground">None configured</span>}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Optional Riders Available</div>
                  <div className="flex flex-wrap gap-1.5">
                    {includedRiders.length > 0 ? includedRiders.map((c) => (
                      <Badge key={c.id} variant="outline">{c.name}</Badge>
                    )) : <span className="text-sm text-muted-foreground">No riders available in this package</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Policy Period</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Start Date" value={<span className="font-mono text-xs">{offer.startDate}</span>} />
                <Field label="End Date" value={<span className="font-mono text-xs">{offer.endDate}</span>} />
                <Field label="Term" value={`${offer.termYears} years`} />
                <Field label="Payment Mode" value={offer.paymentMode} />
                {offer.loan && (
                  <>
                    <div className="col-span-2 mt-2 pt-3 border-t">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Loan Details</div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Outstanding Balance" value={fmtMoney(offer.loan.outstandingBalance, offer.currency)} />
                        <Field label="Interest Rate" value={`${offer.loan.interestRate}%`} />
                        <Field label="Loan Term" value={`${offer.loan.loanTermYears} yrs`} />
                        <Field label="Remaining" value={`${offer.loan.remainingYears} yrs`} />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Policy Holder"
                value={holder ? <Link to={`/customers/${holder.id}`} className="text-primary hover:underline">{fullName(holder)}</Link> : "—"}
              />
              <Field
                label="Insured Person"
                value={insured ? <Link to={`/customers/${insured.id}`} className="text-primary hover:underline">{fullName(insured)}</Link> : "—"}
              />
              <Field
                label="Payer / Invoice Recipient"
                value={payer ? <Link to={`/customers/${payer.id}`} className="text-primary hover:underline">{fullName(payer)}</Link> : "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Premium Summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Net Premium" value={fmtMoney(premiumResult?.netPremium ?? offer.premium, offer.currency)} />
              <Field label="Commission" value={fmtMoney(premiumResult?.commission ?? 0, offer.currency)} />
              <Field
                label="Gross Premium"
                value={<span className="text-primary">{fmtMoney(premiumResult?.grossPremium ?? offer.premium, offer.currency)}</span>}
              />
              <Field
                label="FX Rate"
                value={offer.currency === "EUR" ? "n/a" : <span className="font-mono">{premiumResult?.fxRate?.toFixed(4) ?? "—"} <span className="text-[11px] text-muted-foreground">({premiumResult?.fxSource ?? "—"})</span></span>}
              />
            </CardContent>
          </Card>

          <PremiumBreakdownPanel
            data={{
              productName: product?.name ?? offer.productId,
              templateName: template?.name,
              currency: offer.currency,
              insuredAge,
              termYears: offer.termYears,
              paymentMode: offer.paymentMode,
              netPremium: premiumResult?.netPremium,
              commission: premiumResult?.commission,
              grossPremium: premiumResult?.grossPremium ?? offer.premium,
              loanAdjustment: offer.loan ? 0 : undefined,
              fxRate: premiumResult?.fxRate,
              fxSource: premiumResult?.fxSource,
              reportingCurrency: "EUR",
            }}
          />
        </TabsContent>

        {/* PREMIUM */}
        <TabsContent value="premium" className="mt-4">
          <PremiumCalculation
            productId={offer.productId}
            versionId={offer.versionId}
            templateId={offer.templateId}
            currency={offer.currency}
            insuredAge={insuredAge}
            insuredGender={insuredGender}
            startDate={offer.startDate}
            termYears={offer.termYears}
            loan={offer.loan}
            onResultChange={setPremiumResult}
          />
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yearly Schedule</CardTitle>
              <CardDescription>
                Premium and (where applicable) loan balance projections across the policy term.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!premiumResult ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Open the Premium tab once to compute the schedule.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Year</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        {offer.loan && <TableHead className="text-right">Est. Loan Balance</TableHead>}
                        <TableHead className="text-right">Premium</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {premiumResult.schedule.map((s) => (
                        <TableRow key={s.year}>
                          <TableCell className="font-mono">{s.year}</TableCell>
                          <TableCell className="font-mono text-xs">{s.startDate}</TableCell>
                          <TableCell className="font-mono text-xs">{s.endDate}</TableCell>
                          {offer.loan && (
                            <TableCell className="text-right font-mono text-sm">
                              {s.estimatedLoanBalance !== undefined ? fmtMoney(s.estimatedLoanBalance, offer.currency) : "—"}
                            </TableCell>
                          )}
                          <TableCell className="text-right font-mono text-sm">{fmtMoney(s.premium, offer.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmtMoney(s.commission, offer.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">{fmtMoney(s.gross, offer.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === "Current Year" ? "default" : "secondary"}>{s.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PEOPLE */}
        <TabsContent value="people" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: "Policy Holder", c: holder, role: "Owner of the policy" },
              { title: "Insured Person", c: insured, role: "Life being insured" },
              { title: "Payer / Invoice Recipient", c: payer, role: "Receives invoices, pays premiums" },
            ].map((p) => (
              <Card key={p.title}>
                <CardHeader>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription>{p.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {p.c ? (
                    <>
                      <Field label="Name" value={<Link to={`/customers/${p.c.id}`} className="text-primary hover:underline">{fullName(p.c)}</Link>} />
                      <Field label="Personal ID" value={<span className="font-mono text-xs">{p.c.personalId}</span>} />
                      <Field label="DOB / Age" value={`${p.c.dateOfBirth} (${ageFromDob(p.c.dateOfBirth)} yrs)`} />
                      <Field label="Gender" value={p.c.gender} />
                      <Field label="Email" value={p.c.email} />
                      <Field label="Phone" value={p.c.phone} />
                      <Field label="PEP Status" value={
                        <Badge variant="outline" className={
                          p.c.pepStatus === "Yes" ? "border-destructive/40 text-destructive" :
                          p.c.pepStatus === "Unknown" ? "border-amber-500/40 text-amber-700 dark:text-amber-300" :
                          "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                        }>{p.c.pepStatus}</Badge>
                      } />
                    </>
                  ) : <div className="text-sm text-muted-foreground">Not assigned</div>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiaries</CardTitle>
              <CardDescription>{offer.beneficiaries.length} beneficiaries, total split must equal 100%.</CardDescription>
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
                    {offer.beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                          No beneficiaries assigned to this offer.
                        </TableCell>
                      </TableRow>
                    ) : offer.beneficiaries.map((b) => {
                      const c = getCustomer(b.customerId);
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            {c ? <Link to={`/customers/${c.id}`} className="text-primary hover:underline">{fullName(c)}</Link> : "—"}
                          </TableCell>
                          <TableCell>{b.relationship}</TableCell>
                          <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                    {offer.beneficiaries.length > 0 && (
                      <TableRow className="bg-muted/40">
                        <TableCell colSpan={2} className="font-medium text-sm">Total</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {offer.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Documents</CardTitle>
              <CardDescription>Documents inherited from the product configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Required For</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                          No documents configured for this product version.
                        </TableCell>
                      </TableRow>
                    ) : docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-sm">{d.name}</TableCell>
                        <TableCell className="text-xs">
                          {d.requiredFor.map((r) => <Badge key={r} variant="outline" className="mr-1 font-normal">{r}</Badge>)}
                        </TableCell>
                        <TableCell>
                          {d.isMandatory
                            ? <Badge variant="default">Mandatory</Badge>
                            : <Badge variant="secondary">Optional</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.appliesWhen}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VERIFICATION */}
        <TabsContent value="verification" className="mt-4">
          <VerificationStep
            productId={offer.productId}
            versionId={offer.versionId}
            templateId={offer.templateId}
            currency={offer.currency}
            policyHolderId={offer.policyHolderId}
            insuredId={offer.insuredId}
            premium={premiumResult}
            loanOutstanding={offer.loan?.outstandingBalance}
            onChecksComputed={setVerificationChecks}
          />
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
              <CardDescription>Internal notes about this offer. Visible to underwriters and reviewers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Add internal notes about this offer…"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{notes.length} / 2000</span>
                <Button size="sm" onClick={() => toast.success("Notes saved")}>Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default OfferDetail;
