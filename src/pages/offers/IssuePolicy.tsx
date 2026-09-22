import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  ClipboardCheck,
} from "lucide-react";
import { fullName } from "@/data/customers";
import { toast } from "sonner";
import { useGetOffer, useIssueOfferPolicy } from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { mergeCustomers } from "@/api/adapters/customers";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { mapReviewFlagsToChecks, overallStatus } from "./VerificationStep";
import { formatOfferMoney, offerStatusLabel } from "./offer-ui";

type Step = 1 | 2;

const fmtMoney = (v: number, ccy: string) => formatOfferMoney(v, ccy);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const StepHeader = ({ step }: { step: Step }) => {
  const items = [
    { n: 1, label: "Review Policy", icon: ClipboardCheck },
    { n: 2, label: "Confirm & Issue", icon: FileCheck2 },
  ] as const;
  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((it, idx) => {
        const active = step === it.n;
        const done = step > it.n;
        const Icon = it.icon;
        return (
          <div key={it.n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : done
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-transparent"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="font-medium">Step {it.n}</span>
              <span className="hidden sm:inline">· {it.label}</span>
            </div>
            {idx < items.length - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
};

const IssuePolicy = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();

  const { data: apiOffer, isLoading } = useGetOffer(offerId ?? "", { enabled: Boolean(offerId) });
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();
  const issuePolicy = useIssueOfferPolicy();
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });
  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  const getCustomerLocal = (cid: string) => customers.find((c) => c.id === cid);

  const offer = useMemo(() => {
    if (apiOffer) return mapApiOffer(apiOffer);
    return undefined;
  }, [apiOffer]);

  const { data: apiProduct } = useGetProduct(offer?.productId ?? "", {
    enabled: Boolean(offer?.productId),
  });
  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct]
  );

  const [step, setStep] = useState<Step>(1);
  const [confirmed, setConfirmed] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader label="Loading offer…" />
      </AppShell>
    );
  }

  if (!offer) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold">Offer not found</h1>
          <Button onClick={() => navigate("/offers")} className="mt-4">Back to Offers</Button>
        </div>
      </AppShell>
    );
  }

  const holderParticipant = offer.participants.find((p) => p.role === "policyHolder");
  const payerParticipant = offer.participants.find((p) => p.role === "invoiced") ?? holderParticipant;
  const holder = getCustomerLocal(offer.policyHolderId);
  const insured = getCustomerLocal(offer.insuredId);
  const payer = getCustomerLocal(offer.payerId);
  const outstandingDocs = offer.documentRequirements.filter((d) => !d.isSatisfied && d.status !== "waived");

  const checks = mapReviewFlagsToChecks(offer.reviewFlags);
  const verifStatus = overallStatus(checks);

  const warnings: { title: string; detail: string; level: "warning" | "blocker" }[] = [];
  if (offer.status !== "Quoted") {
    warnings.push({
      title: "Offer is not ready to issue",
      detail: `Current status: ${offerStatusLabel(offer.status)}. Issuance is only permitted for quoted offers.`,
      level: offer.status === "Bound" ? "blocker" : "warning",
    });
  }
  if (outstandingDocs.length > 0) {
    warnings.push({
      title: "Required documents outstanding",
      detail: `${outstandingDocs.length} document requirement(s) are not yet satisfied.`,
      level: "warning",
    });
  }
  if (verifStatus === "Pending Review") {
    warnings.push({
      title: "Manual review is pending",
      detail: "One or more verification checks require review before issuance.",
      level: "warning",
    });
  }

  const isAlreadyIssued = offer.status === "Bound";

  const handleConfirm = async () => {
    if (!confirmed) {
      toast.error("Please confirm the issuance checkbox");
      return;
    }
    if (isAlreadyIssued) {
      toast.error("This offer has already been issued");
      return;
    }

    try {
      const issued = await issuePolicy.mutateAsync({
        offerId: offer.id,
      });
      const policyId = issued.policy?.id;
      if (!policyId) {
        toast.error("Policy was issued but the server did not return an id");
        return;
      }
      toast.success(`Policy ${policyId} issued successfully`);
      navigate(`/policies/${policyId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue policy");
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/offers/${offer.id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Offer
        </Button>
      </div>

      <div className="mb-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Issuance · {offer.number}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Issue Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Convert this approved offer into an active policy in two confirmation steps.
        </p>
      </div>

      <StepHeader step={step} />

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Pre-Issuance Warnings
                </CardTitle>
                <CardDescription>
                  Review the items below before proceeding. Issuance can continue with warnings, but blockers must be cleared first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      w.level === "blocker"
                        ? "border-destructive/40 bg-destructive/5 text-destructive"
                        : "border-amber-500/30 bg-background"
                    }`}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {w.level === "blocker" ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {w.title}
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {w.level === "blocker" ? "Blocker" : "Warning"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{w.detail}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {warnings.length === 0 && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span><strong>All clear.</strong> The offer is approved, documents are configured and verification has passed.</span>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Product & Coverage</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Product" value={product?.name} />
                <Field
                  label="Plan"
                  value={
                    offer.policyPlan
                      ? policyPlanTypeLabel(offer.policyPlan)
                      : product?.policyPlanType
                        ? policyPlanTypeLabel(product.policyPlanType)
                        : "—"
                  }
                />
                <Field label="Currency" value={<Badge variant="outline">{offer.currency}</Badge>} />
                <Field label="Policy" value={offer.policyId ?? "Not issued"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Premium</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Field label="Gross Premium" value={<span className="text-primary font-semibold">{fmtMoney(offer.premium, offer.currency)}</span>} />
                <Field label="Status" value={offerStatusLabel(offer.status)} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Policy Holder" value={holderParticipant?.displayName ?? (holder ? fullName(holder) : "—")} />
              <Field label="Insured Person" value={insured ? fullName(insured) : offer.insuredPersons[0] ? [offer.insuredPersons[0].firstName, offer.insuredPersons[0].lastName].filter(Boolean).join(" ") : "—"} />
              <Field label="Payer" value={payerParticipant?.displayName ?? (payer ? fullName(payer) : "—")} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Beneficiaries</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offer.beneficiaries.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-4">No beneficiaries</TableCell></TableRow>
                      ) : offer.beneficiaries.map((b) => {
                        const c = getCustomerLocal(b.customerId);
                        return (
                          <TableRow key={b.id}>
                            <TableCell>{c ? fullName(c) : "—"}</TableCell>
                            <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Policy Period</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Start Date" value={<span className="font-mono text-xs">{offer.startDate}</span>} />
                <Field label="End Date" value={<span className="font-mono text-xs">{offer.endDate}</span>} />
                <Field label="Term" value={`${offer.termYears} years`} />
                <Field label="Loan balances required" value={offer.requiresLoanBalances ? "Yes" : "No"} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Documents</CardTitle>
              <CardDescription>Inherited from the product configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              {offer.documentRequirements.length === 0 ? (
                <div className="text-sm text-muted-foreground">No documents on this offer.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {offer.documentRequirements.map((d) => (
                    <Badge key={d.id} variant={d.isSatisfied || d.status === "waived" ? "outline" : "default"}>
                      {d.documentTypeId} · {d.status}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {verifStatus === "Pending Review" ? (
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                Verification Status: {verifStatus}
              </CardTitle>
              <CardDescription>
                {checks.filter((c) => c.result === "Requires Review").length} requires review ·{" "}
                {checks.filter((c) => c.result === "Warning").length} warnings ·{" "}
                {checks.filter((c) => c.result === "Passed").length} passed
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generated Policy Identifiers</CardTitle>
              <CardDescription>Auto-assigned on confirmation. These cannot be changed afterwards.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Policy Number"
                value={<span className="font-mono text-base text-muted-foreground">Assigned on issue</span>}
              />
              <Field
                label="Coverage term"
                value={<span className="font-mono text-xs">{offer.startDate} → {offer.endDate}</span>}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Policy Snapshot</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Product" value={product?.name} />
              <Field
                label="Plan"
                value={
                  offer.policyPlan
                    ? policyPlanTypeLabel(offer.policyPlan)
                    : "—"
                }
              />
              <Field label="Policy Holder" value={holderParticipant?.displayName ?? (holder ? fullName(holder) : "—")} />
              <Field label="Insured" value={insured ? fullName(insured) : "—"} />
              <Field label="Start" value={<span className="font-mono text-xs">{offer.startDate}</span>} />
              <Field label="End" value={<span className="font-mono text-xs">{offer.endDate}</span>} />
              <Field label="Premium" value={<span className="text-primary font-semibold">{fmtMoney(offer.premium, offer.currency)}</span>} />
              <Field label="Status" value={offerStatusLabel(offer.status)} />
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(c) => setConfirmed(c === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="confirm" className="text-sm font-normal leading-relaxed cursor-pointer">
                  <strong className="block mb-1">I confirm this policy should be issued.</strong>
                  Once confirmed, the offer status changes to <Badge variant="outline" className="mx-0.5">Bound</Badge>,
                  the policy is created as <Badge variant="outline" className="mx-0.5">Pending activation</Badge>,
                  and it will appear in the Policies module.
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? navigate(`/offers/${offer.id}`) : setStep(1))}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step === 1 ? (
          <Button onClick={() => setStep(2)} className="gap-2" disabled={isAlreadyIssued}>
            Continue to Confirmation <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handleConfirm()}
            disabled={!confirmed || isAlreadyIssued || issuePolicy.isPending}
            className="gap-2"
          >
            <FileCheck2 className="h-4 w-4" /> Confirm and Issue Policy
          </Button>
        )}
      </div>
    </AppShell>
  );
};

export default IssuePolicy;
