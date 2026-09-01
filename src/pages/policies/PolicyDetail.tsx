import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Files,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getPolicy, policyStatusColor } from "@/data/policies";
import {
  policyPlanTypeDescription,
  policyPlanTypeLabel,
} from "@/data/policy-plan-types";
import { ageFromDob } from "@/data/customers";
import { openPolicyPrint, useGetPolicy } from "@/api/policies";
import { mapApiPolicy } from "@/api/adapters/policies";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { customerPath } from "@/api/adapters/customers";
import { useListDocumentTypes } from "@/api/document-types";
import { downloadDocumentFile, useGetDocument } from "@/api/documents";

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 2,
  }).format(v);

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;

const shortId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
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

const formatRate = (
  rate:
    | {
        isFlat?: boolean;
        flatValue?: number | null;
        flatValueCurrency?: string | null;
        percentageValue?: number | null;
      }
    | undefined,
  currency: string,
) => {
  if (!rate) return "—";
  if (rate.isFlat) {
    return fmtMoney(rate.flatValue ?? 0, rate.flatValueCurrency || currency);
  }
  if (rate.percentageValue != null) {
    return `${rate.percentageValue * 100}%`;
  }
  return "—";
};

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [printing, setPrinting] = useState(false);

  const { data: apiPolicy, isLoading } = useGetPolicy(id ?? "", { enabled: Boolean(id) });
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });

  const policy = useMemo(() => {
    if (apiPolicy) return mapApiPolicy(apiPolicy);
    return id ? getPolicy(id) : undefined;
  }, [apiPolicy, id]);

  const { data: apiProduct } = useGetProduct(policy?.productId ?? "", {
    enabled: Boolean(policy?.productId),
  });
  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct],
  );

  const templateDocumentId =
    policy?.templateId && policy.templateId !== "N/A" ? policy.templateId : "";
  const { data: templateDocument } = useGetDocument(templateDocumentId, {
    enabled: Boolean(templateDocumentId),
  });

  const documentTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of documentTypesPage?.items ?? []) {
      if (d.id) map[d.id] = d.name ?? d.id;
    }
    return map;
  }, [documentTypesPage?.items]);

  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => new Set());

  const toggleYearExpanded = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

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
          <Button onClick={() => navigate("/policies")} className="mt-4">
            Back to Policies
          </Button>
        </div>
      </AppShell>
    );
  }

  const holder = policy.participants.find((p) => p.role === "policyHolder");
  const payer = policy.participants.find((p) => p.role === "invoiced") ?? holder;
  const insuredPerson = policy.insuredPersons[0];
  const insuredName = insuredPerson
    ? [insuredPerson.firstName, insuredPerson.lastName].filter(Boolean).join(" ")
    : undefined;

  const handleDownload = (documentId: string | null | undefined, fileName?: string) => {
    if (!documentId) {
      toast.error("Document file is not available");
      return;
    }
    void downloadDocumentFile(documentId, fileName).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Failed to download file"),
    );
  };

  const handlePrint = async () => {
    if (!policy.id) {
      toast.error("Policy id is missing");
      return;
    }
    try {
      setPrinting(true);
      await openPolicyPrint(policy.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to print policy");
    } finally {
      setPrinting(false);
    }
  };

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
              {shortId(policy.id)}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${policyStatusColor[policy.status]}`}
            >
              {policy.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product?.name ?? policy.productId} · issued {policy.issueDate} · from offer{" "}
            <Link
              to={`/offers/${policy.offerId}`}
              className="text-primary hover:underline font-mono"
              title={policy.offerId}
            >
              {shortId(policy.offerId)}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => void handlePrint()}
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
            <CardDescription>Total Pay Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {fmtMoney(policy.premium, policy.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Insured Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {fmtMoney(policy.insuredAmount, policy.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{policy.currency}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Policy Years</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{policy.policyYears.length || policy.termYears}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {policy.status}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 max-w-4xl">
          <TabsTrigger value="summary">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="years">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Policy Years
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            People
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Files className="h-3.5 w-3.5 mr-1.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="beneficiaries">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Beneficiaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Product" value={product?.name ?? policy.productId} />
                <Field
                  label="Printable template"
                  value={
                    templateDocumentId ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate" title={templateDocument?.originalFileName}>
                          {templateDocument?.originalFileName ??
                            templateDocument?.storedFileName ??
                            shortId(templateDocumentId)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          className="h-7 w-7 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Download template"
                          onClick={() =>
                            handleDownload(
                              templateDocumentId,
                              templateDocument?.originalFileName ??
                                templateDocument?.storedFileName,
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
                <Field
                  label="Currency"
                  value={<Badge variant="outline">{policy.currency}</Badge>}
                />
                <Field
                  label="Policy plan type"
                  value={
                    policy.policyPlanType ? (
                      <span title={policyPlanTypeDescription(policy.policyPlanType)}>
                        {policyPlanTypeLabel(policy.policyPlanType)}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          ({policy.policyPlanType})
                        </span>
                      </span>
                    ) : undefined
                  }
                />
                <Field
                  label="Policy years"
                  value={
                    policy.policyYears.length > 0 ? (
                      <span className="font-mono text-xs">
                        {policy.policyYears.map((y) => y.year).join(", ")}
                      </span>
                    ) : undefined
                  }
                />
                <Field
                  label="Effective from"
                  value={<span className="font-mono text-xs">{policy.startDate}</span>}
                />
                <Field
                  label="Effective to"
                  value={<span className="font-mono text-xs">{policy.endDate}</span>}
                />
                <Field
                  label="Issued on"
                  value={<span className="font-mono text-xs">{policy.issueDate}</span>}
                />
                <Field
                  label="Offer"
                  value={
                    <Link
                      to={`/offers/${policy.offerId}`}
                      className="text-primary hover:underline font-mono text-xs"
                      title={policy.offerId}
                    >
                      {shortId(policy.offerId)}
                    </Link>
                  }
                />
                <div className="col-span-2">
                  <Field
                    label="Coverage text"
                    value={
                      policy.coverageText?.trim() ? (
                        <span className="whitespace-pre-wrap font-normal">
                          {policy.coverageText}
                        </span>
                      ) : undefined
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field
                  label="Policy Holder"
                  value={
                    <PartyLink
                      partyId={holder?.partyId}
                      partyType={holder?.partyType}
                      displayName={holder?.displayName}
                    />
                  }
                />
                <Field
                  label="Insured Person"
                  value={
                    <PartyLink
                      partyId={insuredPerson?.personId}
                      partyType="person"
                      displayName={insuredName}
                    />
                  }
                />
                <Field
                  label="Payer / Invoiced"
                  value={
                    <PartyLink
                      partyId={payer?.partyId}
                      partyType={payer?.partyType}
                      displayName={payer?.displayName}
                    />
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverages overview</CardTitle>
              <CardDescription>
                {policy.coverages.length} coverages across {policy.policyYears.length}{" "}
                {policy.policyYears.length === 1 ? "year" : "years"} · total premium{" "}
                {fmtMoney(policy.premium, policy.currency)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policy.coverages.length === 0 ? (
                <span className="text-sm text-muted-foreground">No coverages on this policy.</span>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coverage</TableHead>
                        <TableHead className="text-right">Sum Insured</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Multiplier</TableHead>
                        <TableHead className="text-right">Premium</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policy.coverages.map((c) => (
                        <TableRow key={c.id || c.coverageId}>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {c.coverageName ?? c.coverageId}
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {c.coverageId}
                            </div>
                            {c.coverageDescription?.trim() && (
                              <div className="text-xs text-muted-foreground mt-1 max-w-xl whitespace-pre-wrap">
                                {c.coverageDescription}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {fmtMoney(c.sumInsured, policy.currency)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {formatRate(c.rateUsed, policy.currency)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {c.ratingTableMultiplierUsed != null
                              ? `${c.ratingTableMultiplierUsed}x`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {fmtMoney(c.calculatedPremium, policy.currency)}
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

        <TabsContent value="years" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy Years</CardTitle>
              <CardDescription>
                Expand a year to view its coverages, rates, and calculated premiums.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policy.policyYears.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No policy years on this policy.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[44px]" />
                        <TableHead className="w-[70px]">Year</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead className="text-right">Insured Amount</TableHead>
                        <TableHead className="text-right">Pay Premium</TableHead>
                        <TableHead className="text-right">Coverages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policy.policyYears.map((y) => {
                        const isExpanded = expandedYears.has(y.year);
                        return (
                          <Fragment key={y.id || y.year}>
                            <TableRow
                              className={isExpanded ? "border-b-0" : undefined}
                              data-state={isExpanded ? "open" : undefined}
                            >
                              <TableCell className="pr-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  aria-label={
                                    isExpanded
                                      ? `Collapse policy year ${y.year}`
                                      : `Expand policy year ${y.year}`
                                  }
                                  aria-expanded={isExpanded}
                                  onClick={() => toggleYearExpanded(y.year)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-mono">{y.year}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {y.startDate || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {y.endDate || "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtMoney(y.insuredAmount, policy.currency)}
                              </TableCell>
                              <TableCell
                                className="text-right font-mono text-sm font-semibold"
                                title={`Calculated premium ${fmtMoney(y.premium, policy.currency)}`}
                              >
                                {fmtMoney(y.payPremium, policy.currency)}
                                {y.payPremium !== y.premium && (
                                  <div className="text-[11px] font-normal text-muted-foreground">
                                    calc. {fmtMoney(y.premium, policy.currency)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {y.coverages.length}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  {y.coverages.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">
                                      No coverages for {y.year}.
                                    </span>
                                  ) : (
                                    <div className="rounded-md border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Coverage</TableHead>
                                            <TableHead className="text-right">
                                              Sum Insured
                                            </TableHead>
                                            <TableHead className="text-right">Rate</TableHead>
                                            <TableHead className="text-right">
                                              Multiplier
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Premium
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {y.coverages.map((c) => (
                                            <TableRow key={c.id || c.coverageId}>
                                              <TableCell>
                                                <div className="text-sm font-medium">
                                                  {c.coverageName ?? c.coverageId}
                                                </div>
                                                <div className="font-mono text-[11px] text-muted-foreground">
                                                  {c.coverageId}
                                                </div>
                                                {c.coverageDescription?.trim() && (
                                                  <div className="text-xs text-muted-foreground mt-1 max-w-xl whitespace-pre-wrap">
                                                    {c.coverageDescription}
                                                  </div>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm">
                                                {fmtMoney(c.sumInsured, policy.currency)}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                                {formatRate(c.rateUsed, policy.currency)}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                                {c.ratingTableMultiplierUsed != null
                                                  ? `${c.ratingTableMultiplierUsed}x`
                                                  : "—"}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm font-semibold">
                                                {fmtMoney(c.calculatedPremium, policy.currency)}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
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

        <TabsContent value="people" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policy Holder</CardTitle>
                <CardDescription>Owns the policy contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {holder ? (
                  <>
                    <Field
                      label="Name"
                      value={
                        <PartyLink
                          partyId={holder.partyId}
                          partyType={holder.partyType}
                          displayName={holder.displayName}
                        />
                      }
                    />
                    <Field
                      label="Identifier"
                      value={
                        <span className="font-mono text-xs">{holder.uniqueIdentifier}</span>
                      }
                    />
                    <Field label="Party Type" value={titleCase(holder.partyType)} />
                    <Field label="Country" value={holder.countryCode} />
                    <Field
                      label="Leader"
                      value={holder.isLeader == null ? undefined : holder.isLeader ? "Yes" : "No"}
                    />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insured Person</CardTitle>
                <CardDescription>Life covered by this policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {insuredPerson ? (
                  <>
                    <Field
                      label="Name"
                      value={
                        <PartyLink
                          partyId={insuredPerson.personId}
                          partyType="person"
                          displayName={insuredName}
                        />
                      }
                    />
                    <Field
                      label="Personal ID"
                      value={
                        <span className="font-mono text-xs">
                          {insuredPerson.personalIdentifier}
                        </span>
                      }
                    />
                    <Field
                      label="DOB / Age"
                      value={
                        insuredPerson.dateOfBirth
                          ? `${insuredPerson.dateOfBirth} (${ageFromDob(insuredPerson.dateOfBirth)} yrs)`
                          : undefined
                      }
                    />
                    <Field label="Gender" value={titleCase(insuredPerson.gender)} />
                    <Field label="Country" value={insuredPerson.countryCode} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payer / Invoice Recipient</CardTitle>
                <CardDescription>Receives invoices, pays premiums</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {payer ? (
                  <>
                    <Field
                      label="Name"
                      value={
                        <PartyLink
                          partyId={payer.partyId}
                          partyType={payer.partyType}
                          displayName={payer.displayName}
                        />
                      }
                    />
                    <Field
                      label="Identifier"
                      value={
                        <span className="font-mono text-xs">{payer.uniqueIdentifier}</span>
                      }
                    />
                    <Field label="Party Type" value={titleCase(payer.partyType)} />
                    <Field label="Country" value={payer.countryCode} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>
          </div>

          {policy.insuredPersons.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Insured Persons</CardTitle>
                <CardDescription>
                  {policy.insuredPersons.length} insured persons on this policy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Country</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policy.insuredPersons.map((ip) => {
                        const name = [ip.firstName, ip.lastName].filter(Boolean).join(" ");
                        return (
                          <TableRow key={ip.id}>
                            <TableCell>
                              <PartyLink
                                partyId={ip.personId}
                                partyType="person"
                                displayName={name}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {ip.personalIdentifier ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {ip.dateOfBirth ?? "—"}
                            </TableCell>
                            <TableCell>{titleCase(ip.gender) ?? "—"}</TableCell>
                            <TableCell>{ip.countryCode ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>
                {policy.documents.length} documents attached to this policy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Document ID</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policy.documents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-6 text-sm text-muted-foreground"
                        >
                          No documents on this policy.
                        </TableCell>
                      </TableRow>
                    ) : (
                      policy.documents.map((d) => {
                        const typeName =
                          documentTypeNameById[d.documentTypeId] ?? d.documentTypeId;
                        return (
                          <TableRow key={d.id || `${d.documentTypeId}-${d.documentId}`}>
                            <TableCell>
                              <div className="text-sm font-medium">{typeName}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {d.documentTypeId}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs" title={d.documentId ?? undefined}>
                              {d.documentId ? shortId(d.documentId) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                disabled={!d.documentId}
                                onClick={() => handleDownload(d.documentId, typeName)}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </Button>
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

        <TabsContent value="beneficiaries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiaries</CardTitle>
              <CardDescription>
                {policy.beneficiaries.length} beneficiaries
                {policy.beneficiaries.length > 0
                  ? ` · total share ${policy.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policy.beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-sm text-muted-foreground py-6"
                        >
                          No beneficiaries
                        </TableCell>
                      </TableRow>
                    ) : (
                      policy.beneficiaries.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <PartyLink
                              partyId={b.customerId}
                              partyType={b.partyType}
                              displayName={b.displayName}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {b.uniqueIdentifier ?? "—"}
                          </TableCell>
                          <TableCell>{titleCase(b.partyType) ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                        </TableRow>
                      ))
                    )}
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
