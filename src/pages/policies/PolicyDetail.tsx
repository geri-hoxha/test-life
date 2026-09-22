import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppShell from "@/components/layout/AppShell";
import { PageLoader, TableLoadingRow } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowLeft,
  Ban,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FilePlus,
  FileText,
  Files,
  Loader2,
  Percent,
  Printer,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { policyPlanTypeDescription, policyRenewalFlow } from "@/data/policy-plan-types";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { ageFromDob } from "@/data/customers";
import {
  openPolicyPrint,
  openPolicyPrintWindow,
  useCreatePolicyRenewalOffer,
  useGetPolicy,
  useListPolicyInstallments,
} from "@/api/policies";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { customerPath, countryDisplayName } from "@/api/adapters/customers";
import { useCountryEnum, useRelationshipToInsuredEnum, smartEnumLabel } from "@/api/smart-enums";
import { useListDocumentTypes } from "@/api/document-types";
import { useDocumentPreview, type DocumentFileBusy } from "@/components/documents/DocumentPreview";
import { toastApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type {
  PoliciesPolicyInsuredPersonResponse,
  PoliciesPolicyParticipantResponse,
  PoliciesPolicyPeriodCoverageResponse,
  RatingTablesRateResponse,
} from "@/api/types";
import {
  formatCoverageTerm,
  formatPolicyDate,
  formatPolicyDateTime,
  formatPolicyMoney,
  installmentStatusClass,
  installmentStatusLabel,
  periodStatusClass,
  periodStatusLabel,
  policyNumberLabel,
  policyStatusClass,
  policyStatusLabel,
  shareToPercentage,
  shortPolicyId,
} from "./policy-ui";
import PolicyCancellationCard from "./PolicyCancellationCard";

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const TemplateDownloadButton = ({
  documentId,
  label,
  fileBusy,
  onDownload,
  children,
}: {
  documentId?: string;
  label: string;
  fileBusy: DocumentFileBusy;
  onDownload: (documentId: string, label: string) => void;
  children: ReactNode;
}) => (
  <Button
    type="button"
    size="sm"
    variant="ghost"
    className="gap-2 h-8 px-2"
    disabled={!documentId || Boolean(fileBusy)}
    onClick={() => {
      if (!documentId) return;
      onDownload(documentId, label);
    }}
  >
    {documentId && fileBusy?.id === documentId && fileBusy.action === "download" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Download className="h-4 w-4" />
    )}
    {children}
  </Button>
);

const PartyLink = ({
  partyId,
  partyType,
  displayName,
}: {
  partyId?: string;
  partyType?: "person" | "company";
  displayName?: string;
}) => {
  if (!partyId || !displayName) return <span className="text-muted-foreground">—</span>;
  return (
    <Link
      to={customerPath(partyId, partyType ?? "person")}
      className="text-primary hover:underline"
    >
      {displayName}
    </Link>
  );
};

const ParticipantFields = ({
  party,
  countryLabel,
  relationshipLabel,
}: {
  party?: PoliciesPolicyParticipantResponse;
  countryLabel: (code?: string) => string | undefined;
  relationshipLabel: (value?: string | null) => string;
}) => {
  if (!party) {
    return <div className="text-sm text-muted-foreground">Not assigned</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        label="Name"
        value={
          <PartyLink
            partyId={party.partyId}
            partyType={party.partyType}
            displayName={party.displayName}
          />
        }
      />
      <Field
        label="Identifier"
        value={<span className="font-mono text-xs">{party.uniqueIdentifier}</span>}
      />
      <Field label="Party type" value={titleCase(party.partyType)} />
      <Field label="Country" value={countryLabel(party.countryCode)} />
      <Field
        label="Leader"
        value={party.isLeader == null ? undefined : party.isLeader ? "Yes" : "No"}
      />
      {party.role === "invoiced" ? (
        <Field label="Relationship" value={relationshipLabel(party.relationshipToInsured)} />
      ) : null}
      <Field
        label="Share"
        value={party.share == null ? undefined : `${shareToPercentage(party.share)}%`}
      />
    </div>
  );
};

const InsuredPersonFields = ({
  person,
  countryLabel,
}: {
  person: PoliciesPolicyInsuredPersonResponse;
  countryLabel: (code?: string) => string | undefined;
}) => {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        label="Name"
        value={<PartyLink partyId={person.personId} partyType="person" displayName={name} />}
      />
      <Field
        label="Personal ID"
        value={<span className="font-mono text-xs">{person.personalIdentifier}</span>}
      />
      <Field
        label="DOB / Age"
        value={
          person.dateOfBirth
            ? `${person.dateOfBirth} (${ageFromDob(person.dateOfBirth)} yrs)`
            : undefined
        }
      />
      <Field label="Gender" value={titleCase(person.gender)} />
      <Field label="Country" value={countryLabel(person.countryCode)} />
      <Field label="Father's name" value={person.fatherName} />
      <Field label="Birth place" value={person.birthPlace} />
      <Field label="Address district" value={person.addressDistrict} />
      <Field label="Profession" value={person.profession} />
      <Field label="Position" value={person.position} />
    </div>
  );
};

const formatRate = (rate: RatingTablesRateResponse | undefined, currency: string) => {
  if (!rate) return "—";
  if (rate.isFlat) {
    return formatPolicyMoney(rate.flatValue ?? 0, rate.flatValueCurrency || currency);
  }
  if (rate.percentageValue != null) {
    const pct = rate.percentageValue * 100;
    const formatted = Number.isInteger(pct) ? String(pct) : pct.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${formatted}%`;
  }
  return "—";
};

const CoverageNestedPanel = ({
  coverages,
  currency,
  sequence,
}: {
  coverages: PoliciesPolicyPeriodCoverageResponse[];
  currency: string;
  sequence: number;
}) => {
  const totalPremium = coverages.reduce((sum, c) => sum + (c.calculatedPremium ?? 0), 0);

  return (
    <div className="ml-11 mr-3 mb-3 border-l-2 border-accent/30 pl-4 py-1">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coverages
        </div>
        <div className="text-xs text-muted-foreground">
          {coverages.length} {coverages.length === 1 ? "line" : "lines"}
          {coverages.length > 0 ? ` · ${formatPolicyMoney(totalPremium, currency)}` : ""}
        </div>
      </div>
      {coverages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No coverages for period {sequence}.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider">
                Coverage
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                Sum insured
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                Rate
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                Multiplier
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase tracking-wider">
                Premium
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coverages.map((c, i) => {
              const name = c.coverageName?.trim() || c.coverageId || `Coverage ${i + 1}`;
              return (
                <TableRow
                  key={`${c.id ?? c.coverageId ?? i}`}
                  className="border-0 hover:bg-transparent"
                >
                  <TableCell className="px-2 py-1.5">
                    <div className="text-sm font-medium" title={c.coverageId}>
                      {name}
                    </div>
                    {c.coverageId ? (
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {c.coverageId}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-mono text-sm">
                    {formatPolicyMoney(c.sumInsured, currency)}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-mono text-sm text-muted-foreground">
                    {formatRate(c.rateUsed, currency)}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-mono text-sm text-muted-foreground">
                    {c.ratingTableMultiplierUsed != null ? c.ratingTableMultiplierUsed : "—"}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-mono text-sm font-semibold text-primary">
                    {formatPolicyMoney(c.calculatedPremium, currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [printing, setPrinting] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(() => new Set());
  const [tab, setTab] = useState("summary");

  const {
    data: policy,
    isLoading,
    isError,
  } = useGetPolicy(id ?? "", { enabled: Boolean(id) });
  const { data: installments = [], isLoading: installmentsLoading } = useListPolicyInstallments(
    id ?? "",
    { enabled: Boolean(id) },
  );
  const createRenewalOffer = useCreatePolicyRenewalOffer();
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const { data: countryOptions = [] } = useCountryEnum();
  const { data: relationshipOptions = [] } = useRelationshipToInsuredEnum();
  const countryLabel = (code?: string) => countryDisplayName(code, countryOptions) ?? code;
  const relationshipLabel = (value?: string | null) => smartEnumLabel(relationshipOptions, value);
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();

  const { data: apiProduct, isFetched: productFetched } = useGetProduct(policy?.productId ?? "", {
    enabled: Boolean(policy?.productId),
  });
  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct],
  );

  const printableTemplateId = policy?.printableTemplateDocumentId?.trim() || "";
  const termsTemplateId = policy?.termsTemplateDocumentId?.trim() || "";

  const documentTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of documentTypesPage?.items ?? []) {
      if (d.id) map[d.id] = d.name ?? d.id;
    }
    return map;
  }, [documentTypesPage?.items]);

  const { fileBusy, openPreview, download } = useDocumentPreview();

  const periods = useMemo(
    () => [...(policy?.periods ?? [])].sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0)),
    [policy?.periods],
  );
  const coverages = periods.flatMap((p) => p.coverages ?? []);
  const currency = policy?.currency ?? "ALL";
  const chargePremium = periods.reduce((sum, p) => sum + (p.chargePremium ?? 0), 0);
  const sumInsured =
    coverages.reduce((max, c) => Math.max(max, c.sumInsured ?? 0), 0) || null;

  const participants = policy?.participants ?? [];
  const holder = participants.find((p) => p.role === "policyHolder");
  const payer = participants.find((p) => p.role === "invoiced") ?? holder;
  const beneficiaries = participants.filter((p) => p.role === "beneficiary");
  const insuredPersons = policy?.insuredPersons ?? [];
  const sales = policy?.salesAttribution;
  const agentLine =
    [
      sales?.agentDisplayName?.trim(),
      [sales?.internalOfficeName?.trim(), sales?.internalBranchName?.trim()].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const partnerLine =
    [sales?.partnerName?.trim(), sales?.partnerOfficeName?.trim()].filter(Boolean).join(" - ") ||
    undefined;

  const togglePeriodExpanded = (sequence: number) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(sequence)) next.delete(sequence);
      else next.add(sequence);
      return next;
    });
  };

  const handleDownload = (documentId: string | null | undefined, fileName?: string) => {
    if (!documentId) {
      toast.error("Document file is not available");
      return;
    }
    void download(documentId, fileName ?? "document");
  };

  const handlePreview = (documentId: string | null | undefined, label: string) => {
    if (!documentId) {
      toast.error("Document file is not available");
      return;
    }
    void openPreview(documentId, label);
  };

  const handlePrint = () => {
    if (!policy?.id) {
      toast.error("Policy id is missing");
      return;
    }
    const printWindow = openPolicyPrintWindow();
    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to print the policy.");
      return;
    }
    void (async () => {
      try {
        setPrinting(true);
        await openPolicyPrint(policy.id as string, printWindow);
      } catch (err) {
        printWindow.close();
        toast.error(err instanceof Error ? err.message : "Failed to print policy");
      } finally {
        setPrinting(false);
      }
    })();
  };

  const planCode = policy?.policyPlan ?? product?.policyPlanType ?? null;
  const renewalFlow = policyRenewalFlow(planCode, product?.planRules?.continuation);
  const renewalActionsReady =
    policyRenewalFlow(policy?.policyPlan) != null || !policy?.productId || productFetched;

  const handleCreateRenewalOffer = () => {
    if (!policy?.id || renewalFlow !== "newPolicyOffer") return;
    createRenewalOffer.mutate(policy.id, {
      onSuccess: (offer) => {
        toast.success("Renewal offer created");
        if (offer.id) navigate(`/offers/${offer.id}`);
      },
      onError: (err) => toastApiError(err, "Failed to create renewal offer"),
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/policies")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </Button>
        <PageLoader label="Loading policy…" />
      </AppShell>
    );
  }

  if (isError || !policy) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/policies")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </Button>
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This policy could not be loaded.</p>
          <Button asChild className="mt-4">
            <Link to="/policies">Back to policies</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/policies")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Policy
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono" title={policy.id}>
              {policyNumberLabel(policy.serial, policy.id)}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${policyStatusClass(policy.status)}`}
            >
              {policyStatusLabel(policy.status)}
            </span>
            {policy.isIssued === false ? (
              <Badge variant="outline">Not issued</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product?.name ?? policy.productId} · issued {formatPolicyDate(policy.issuedOnUtc)} · from
            offer{" "}
            <Link
              to={`/offers/${policy.offerId}`}
              className="text-primary hover:underline font-mono"
              title={policy.offerId}
            >
              {shortPolicyId(policy.offerId)}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {renewalActionsReady && renewalFlow === "appendPeriod" ? (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link to={`/renewals?policyId=${encodeURIComponent(policy.id ?? "")}`}>
                <RefreshCw className="h-4 w-4" /> View renewals
              </Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="gap-2" asChild>
            <Link to={`/invoices?policyId=${encodeURIComponent(policy.id ?? "")}`}>
              <Receipt className="h-4 w-4" /> View invoices
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="gap-2" asChild>
            <Link to={`/agent-commissions?policyId=${encodeURIComponent(policy.id ?? "")}`}>
              <Percent className="h-4 w-4" /> View commissions
            </Link>
          </Button>
          {renewalActionsReady && renewalFlow === "newPolicyOffer" ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleCreateRenewalOffer}
              disabled={!policy.id || createRenewalOffer.isPending}
            >
              {createRenewalOffer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="h-4 w-4" />
              )}
              Renewal offer
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-destructive border-destructive/40 hover:!bg-destructive/10 hover:!text-destructive hover:!border-destructive/50"
            onClick={() => setTab("cancellation")}
          >
            <Ban className="h-4 w-4" />
            {policy.status === "cancelled" ? "View cancellation" : "Cancel policy"}
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handlePrint}
            disabled={printing}
          >
            <Printer className="h-4 w-4" />
            {printing ? "Printing…" : "Print Policy"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Charge premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {formatPolicyMoney(chargePremium, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Sum insured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatPolicyMoney(sumInsured, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{currency}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Coverage periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{periods.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {policyStatusLabel(policy.status)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={tab === "people" || tab === "beneficiaries" ? "participants" : tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="summary" className="w-full gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="periods" className="w-full gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Periods
          </TabsTrigger>
          <TabsTrigger value="participants" className="w-full gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="installments" className="w-full gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Installments
          </TabsTrigger>
          <TabsTrigger value="documents" className="w-full gap-1.5">
            <Files className="h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="cancellation" className="w-full gap-1.5">
            <Ban className="h-3.5 w-3.5" />
            Cancellation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">General</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field
                  label="Serial"
                  value={<span className="font-mono">{policy.serial ?? shortPolicyId(policy.id)}</span>}
                />
                <Field label="Currency" value={<Badge variant="outline">{currency}</Badge>} />
                <Field
                  label="Issued on"
                  value={
                    <span className="font-mono text-xs">{formatPolicyDateTime(policy.issuedOnUtc)}</span>
                  }
                />
                <Field
                  label="Activated on"
                  value={
                    <span className="font-mono text-xs">
                      {formatPolicyDateTime(policy.activatedOnUtc)}
                    </span>
                  }
                />
                <Field
                  label="Coverage start"
                  value={
                    <span className="font-mono text-xs">
                      {formatPolicyDate(policy.coverageTerm?.startDate)}
                    </span>
                  }
                />
                <Field
                  label="Coverage end"
                  value={
                    <span className="font-mono text-xs">
                      {formatPolicyDate(policy.coverageTerm?.endDate)}
                    </span>
                  }
                />
                <Field
                  label="Policy plan"
                  value={
                    policy.policyPlan ? (
                      <span title={policyPlanTypeDescription(policy.policyPlan)}>
                        {policyPlanTypeLabel(policy.policyPlan)}
                      </span>
                    ) : undefined
                  }
                />
                <Field
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${policyStatusClass(policy.status)}`}
                    >
                      {policyStatusLabel(policy.status)}
                    </span>
                  }
                />
                <Field
                  label="Requires loan balances"
                  value={
                    <Checkbox
                      checked={Boolean(policy.requiresLoanBalances)}
                      disabled
                      className="disabled:opacity-100 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                      aria-label="Requires loan balances"
                    />
                  }
                />
                <Field
                  label="Is issued"
                  value={
                    <Checkbox
                      checked={Boolean(policy.isIssued)}
                      disabled
                      className="disabled:opacity-100 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                      aria-label="Is issued"
                    />
                  }
                />
                <div className="col-span-2">
                  <Field
                    label="Coverage text"
                    value={
                      policy.coverageText?.trim() ? (
                        <span className="whitespace-pre-wrap font-normal">{policy.coverageText}</span>
                      ) : undefined
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agency & partners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Agent" value={agentLine} />
                <Field label="Partner" value={partnerLine} />
                <div className="flex flex-col items-start pt-2 border-t">
                  {policy.offerId ? (
                    <Button size="sm" variant="ghost" className="h-8 px-2 gap-2" asChild>
                      <Link to={`/offers/${policy.offerId}`} title={policy.offerId}>
                        <ExternalLink className="h-4 w-4" />
                        View offer
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-8 px-2 gap-2" disabled>
                      <ExternalLink className="h-4 w-4" />
                      View offer
                    </Button>
                  )}
                  <TemplateDownloadButton
                    documentId={printableTemplateId || undefined}
                    label="printable-template"
                    fileBusy={fileBusy}
                    onDownload={handleDownload}
                  >
                    Download printable template
                  </TemplateDownloadButton>
                  <TemplateDownloadButton
                    documentId={termsTemplateId || undefined}
                    label="terms-template"
                    fileBusy={fileBusy}
                    onDownload={handleDownload}
                  >
                    Download terms template
                  </TemplateDownloadButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="periods" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverage periods</CardTitle>
              <CardDescription>
                Expand a period to view its coverages, rates, and calculated premiums.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No coverage periods on this policy.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[44px]" />
                        <TableHead className="w-[70px]">#</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                        <TableHead className="text-right">Charge premium</TableHead>
                        <TableHead className="text-right">Coverages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.map((y) => {
                        const sequence = y.sequenceNumber ?? 0;
                        const isExpanded = expandedPeriods.has(sequence);
                        const periodCoverages = y.coverages ?? [];
                        return (
                          <Fragment key={y.id ?? sequence}>
                            <TableRow
                              className={cn(
                                "cursor-pointer hover:bg-accent-soft/70",
                                isExpanded && "border-b-0 bg-transparent hover:bg-transparent",
                              )}
                              data-state={isExpanded ? "open" : undefined}
                              onClick={() => togglePeriodExpanded(sequence)}
                            >
                              <TableCell className="pr-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  aria-label={
                                    isExpanded
                                      ? `Collapse period ${sequence}`
                                      : `Expand period ${sequence}`
                                  }
                                  aria-expanded={isExpanded}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePeriodExpanded(sequence);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-mono">{sequence}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {formatPolicyDate(y.period?.startDate)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {formatPolicyDate(y.period?.endDate)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${periodStatusClass(y.status)}`}
                                >
                                  {periodStatusLabel(y.status)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatPolicyMoney(y.openingBalance, currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatPolicyMoney(y.closingBalance, currency)}
                              </TableCell>
                              <TableCell
                                className="text-right font-mono text-sm font-semibold"
                                title={`Calculated premium ${formatPolicyMoney(y.calculatedPremium, currency)}`}
                              >
                                {formatPolicyMoney(y.chargePremium, currency)}
                                {y.chargePremium !== y.calculatedPremium && (
                                  <div className="text-[11px] font-normal text-muted-foreground">
                                    calc. {formatPolicyMoney(y.calculatedPremium, currency)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {periodCoverages.length}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={9} className="p-0">
                                  <CoverageNestedPanel
                                    coverages={periodCoverages}
                                    currency={currency}
                                    sequence={sequence}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policy Holder</CardTitle>
                <CardDescription>Owns the policy contract</CardDescription>
              </CardHeader>
              <CardContent>
                <ParticipantFields
                  party={holder}
                  countryLabel={countryLabel}
                  relationshipLabel={relationshipLabel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insured person</CardTitle>
                <CardDescription>
                  {insuredPersons.length > 1
                    ? `${insuredPersons.length} lives covered by this policy`
                    : "Life covered by this policy"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insuredPersons.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                ) : (
                  insuredPersons.map((person, index) => (
                    <div
                      key={person.id ?? person.personId ?? index}
                      className={index > 0 ? "border-t pt-4" : undefined}
                    >
                      <InsuredPersonFields person={person} countryLabel={countryLabel} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payer / Invoice recipient</CardTitle>
                <CardDescription>Receives invoices, pays premiums</CardDescription>
              </CardHeader>
              <CardContent>
                <ParticipantFields
                  party={payer}
                  countryLabel={countryLabel}
                  relationshipLabel={relationshipLabel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Beneficiaries</CardTitle>
                <CardDescription>
                  {beneficiaries.length === 0
                    ? "No beneficiaries"
                    : `${beneficiaries.length} ${beneficiaries.length === 1 ? "beneficiary" : "beneficiaries"} · total share ${beneficiaries.reduce((s, b) => s + shareToPercentage(b.share), 0)}%`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiaries.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                ) : (
                  beneficiaries.map((party, index) => (
                    <div
                      key={party.id ?? party.partyId ?? index}
                      className={index > 0 ? "border-t pt-4" : undefined}
                    >
                      <ParticipantFields
                        party={party}
                        countryLabel={countryLabel}
                        relationshipLabel={relationshipLabel}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="installments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Premium installments</CardTitle>
              <CardDescription>
                {installmentsLoading
                  ? "Loading…"
                  : `${installments.length} installment${installments.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Service period</TableHead>
                      <TableHead>Invoice on</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentsLoading ? (
                      <TableLoadingRow colSpan={7} label="Loading installments…" />
                    ) : installments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-6 text-sm text-muted-foreground"
                        >
                          No installments on this policy.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...installments]
                        .sort(
                          (a, b) => (a.installmentSequence ?? 0) - (b.installmentSequence ?? 0),
                        )
                        .map((row) => (
                          <TableRow key={row.id ?? row.installmentSequence}>
                            <TableCell className="font-mono text-xs">
                              {row.installmentSequence ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.coveragePeriodSequence ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatCoverageTerm(row.servicePeriod)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatPolicyDate(row.invoiceOnDate)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatPolicyDate(row.dueDate)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {formatPolicyMoney(row.amount, row.currency || currency)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${installmentStatusClass(row.status)}`}
                              >
                                {installmentStatusLabel(row.status)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
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
              <CardDescription>
                {policy.documents?.length ?? 0} documents attached to this policy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Document ID</TableHead>
                      <TableHead className="w-[88px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(policy.documents?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-sm text-muted-foreground"
                        >
                          No documents on this policy.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (policy.documents ?? []).map((d) => {
                        const typeName =
                          documentTypeNameById[d.documentTypeId ?? ""] ?? d.documentTypeId;
                        return (
                          <TableRow key={d.id || `${d.documentTypeId}-${d.documentId}`}>
                            <TableCell>
                              <div className="text-sm font-medium">{typeName}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {d.documentTypeId}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {d.coveragePeriodSequence ?? "—"}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs"
                              title={d.documentId ?? undefined}
                            >
                              {d.documentId ? shortPolicyId(d.documentId) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="View document"
                                  disabled={!d.documentId || Boolean(fileBusy)}
                                  onClick={() => handlePreview(d.documentId, typeName ?? "Document")}
                                >
                                  {fileBusy?.id === d.documentId && fileBusy.action === "preview" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Download document"
                                  disabled={!d.documentId || Boolean(fileBusy)}
                                  onClick={() => handleDownload(d.documentId, typeName)}
                                >
                                  {fileBusy?.id === d.documentId &&
                                  fileBusy.action === "download" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Download</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellation" className="mt-4">
          <PolicyCancellationCard
            policyId={policy.id ?? ""}
            currency={currency}
            policyStatus={policy.status}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default PolicyDetail;
