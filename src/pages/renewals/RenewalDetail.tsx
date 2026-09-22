import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useAcceptRenewalDocument,
  useApplyPolicyRenewal,
  useApproveRenewalDiscount,
  useApproveRenewalFlag,
  useGetPolicyRenewal,
  usePricePolicyRenewal,
  useRefuseRenewalDocument,
  useRejectRenewalDiscount,
  useRejectRenewalFlag,
  useRequestRenewalDiscount,
  useStartPolicyRenewal,
  useSubmitRenewalDocument,
  useWaiveRenewalDocument,
} from "@/api/renewals";
import { buildCreateDocumentFormData, createDocument } from "@/api/documents";
import { useListDocumentTypes } from "@/api/document-types";
import { useDocumentPreview } from "@/components/documents/DocumentPreview";
import { toastApiError } from "@/lib/api-error";
import type {
  PoliciesApplyPolicyRenewalResponse,
  PoliciesUnderwritingDocumentRequirementResponse,
  PoliciesUnderwritingReviewFlagResponse,
} from "@/api/types";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Percent,
  Play,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  discountStatusClass,
  discountStatusLabel,
  documentStatusClass,
  documentStatusLabel,
  flagStatusClass,
  flagStatusLabel,
  formatDiscountPct,
  formatRenewalDateTime,
  formatRenewalMoney,
  formatRenewalPeriod,
  humanizeRenewalEnum,
  renewalStatusClass,
  renewalStatusLabel,
  shortRenewalId,
} from "./renewal-ui";

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5 break-all">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const formatRate = (
  rate:
    | {
        isFlat?: boolean;
        flatValue?: number | null;
        flatValueCurrency?: string | null;
        percentageValue?: number | null;
      }
    | undefined,
) => {
  if (!rate) return "—";
  if (rate.isFlat) {
    return formatRenewalMoney(rate.flatValue ?? 0, rate.flatValueCurrency ?? undefined);
  }
  if (rate.percentageValue != null) return formatDiscountPct(rate.percentageValue);
  return "—";
};

const RenewalDetail = () => {
  const { policyId = "", renewalId = "" } = useParams();
  const navigate = useNavigate();
  const { data: renewal, isLoading, isError } = useGetPolicyRenewal(policyId, renewalId, {
    enabled: Boolean(policyId) && Boolean(renewalId),
  });
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const { fileBusy, openPreview, download } = useDocumentPreview();

  const startRenewal = useStartPolicyRenewal();
  const priceRenewal = usePricePolicyRenewal();
  const applyRenewal = useApplyPolicyRenewal();
  const acceptDocument = useAcceptRenewalDocument();
  const refuseDocument = useRefuseRenewalDocument();
  const submitDocument = useSubmitRenewalDocument();
  const waiveDocument = useWaiveRenewalDocument();
  const approveFlag = useApproveRenewalFlag();
  const rejectFlag = useRejectRenewalFlag();
  const requestDiscount = useRequestRenewalDiscount();
  const approveDiscount = useApproveRenewalDiscount();
  const rejectDiscount = useRejectRenewalDiscount();

  const [startOpen, setStartOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyResult, setApplyResult] = useState<PoliciesApplyPolicyRenewalResponse | null>(null);

  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState("10");
  const [discountReason, setDiscountReason] = useState("");

  const [submitTarget, setSubmitTarget] = useState<PoliciesUnderwritingDocumentRequirementResponse | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitPending, setSubmitPending] = useState(false);

  const [reasonDialog, setReasonDialog] = useState<{
    kind: "refuse" | "waive";
    requirement: PoliciesUnderwritingDocumentRequirementResponse;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const [flagDialog, setFlagDialog] = useState<{
    kind: "approve" | "reject";
    flag: PoliciesUnderwritingReviewFlagResponse;
  } | null>(null);
  const [flagNote, setFlagNote] = useState("");

  const documentTypeNameById = Object.fromEntries(
    (documentTypesPage?.items ?? [])
      .filter((d) => d.id)
      .map((d) => [d.id as string, d.name ?? d.id ?? ""]),
  );

  const back = (
    <Button variant="ghost" size="sm" onClick={() => navigate("/renewals")} className="gap-2 mb-4">
      <ArrowLeft className="h-4 w-4" /> Back to Renewals
    </Button>
  );

  if (isLoading) {
    return (
      <AppShell>
        {back}
        <PageLoader label="Loading renewal…" />
      </AppShell>
    );
  }

  if (isError || !renewal) {
    return (
      <AppShell>
        {back}
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This renewal could not be loaded.</p>
          <Button asChild className="mt-4">
            <Link to="/renewals">Back to renewals</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const status = renewal.status;
  const mutable = status === "draft" || status === "priced";
  const ids = { policyId, renewalId };
  const coverages = renewal.coverages ?? [];
  const documents = renewal.documentRequirements ?? [];
  const flags = renewal.reviewFlags ?? [];
  const discounts = renewal.discountRequests ?? [];

  const handleStart = () => {
    if (renewal.requiresLoanBalances) {
      const opening = Number(openingBalance);
      const closing = Number(closingBalance);
      if (!Number.isFinite(opening) || opening < 0) {
        toast.error("Opening balance is required");
        return;
      }
      if (!Number.isFinite(closing) || closing < 0) {
        toast.error("Closing balance is required");
        return;
      }
      startRenewal.mutate(
        { ...ids, body: { openingBalance: opening, closingBalance: closing } },
        {
          onSuccess: () => {
            toast.success("Renewal started");
            setStartOpen(false);
          },
          onError: (err) => toastApiError(err, "Failed to start renewal"),
        },
      );
      return;
    }
    startRenewal.mutate(
      { ...ids, body: {} },
      {
        onSuccess: () => {
          toast.success("Renewal started");
          setStartOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to start renewal"),
      },
    );
  };

  const handlePrice = () => {
    priceRenewal.mutate(ids, {
      onSuccess: () => toast.success("Renewal priced"),
      onError: (err) => toastApiError(err, "Failed to price renewal"),
    });
  };

  const handleApply = () => {
    applyRenewal.mutate(ids, {
      onSuccess: (data) => {
        toast.success("Renewal applied");
        setApplyOpen(false);
        setApplyResult(data);
      },
      onError: (err) => toastApiError(err, "Failed to apply renewal"),
    });
  };

  const handleRequestDiscount = () => {
    const pct = Number(discountPct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error("Enter a discount between 0 and 100%");
      return;
    }
    if (!discountReason.trim()) {
      toast.error("Reason is required");
      return;
    }
    requestDiscount.mutate(
      {
        ...ids,
        body: { requestedDiscountPercentage: pct / 100, reason: discountReason.trim() },
      },
      {
        onSuccess: () => {
          toast.success("Discount requested");
          setDiscountOpen(false);
          setDiscountPct("10");
          setDiscountReason("");
        },
        onError: (err) => toastApiError(err, "Failed to request discount"),
      },
    );
  };

  const handleSubmitDocument = async () => {
    if (!submitTarget?.id) return;
    if (!submitFile) {
      toast.error("Choose a file to upload");
      return;
    }
    try {
      setSubmitPending(true);
      const uploaded = await createDocument(buildCreateDocumentFormData(submitFile, submitFile.name));
      if (!uploaded.id) throw new Error("Upload did not return a document id");
      await submitDocument.mutateAsync({
        ...ids,
        requirementId: String(submitTarget.id),
        body: { documentId: uploaded.id },
      });
      toast.success("Document submitted");
      setSubmitTarget(null);
      setSubmitFile(null);
    } catch (err) {
      toastApiError(err, "Failed to submit document");
    } finally {
      setSubmitPending(false);
    }
  };

  const handleReasonAction = () => {
    if (!reasonDialog?.requirement.id) return;
    const reason = reasonText.trim();
    if (!reason) {
      toast.error("Reason is required");
      return;
    }
    const vars = {
      ...ids,
      requirementId: String(reasonDialog.requirement.id),
      body: { reason },
    };
    if (reasonDialog.kind === "refuse") {
      refuseDocument.mutate(vars, {
        onSuccess: () => {
          toast.success("Document refused");
          setReasonDialog(null);
          setReasonText("");
        },
        onError: (err) => toastApiError(err, "Failed to refuse document"),
      });
      return;
    }
    waiveDocument.mutate(vars, {
      onSuccess: () => {
        toast.success("Document waived");
        setReasonDialog(null);
        setReasonText("");
      },
      onError: (err) => toastApiError(err, "Failed to waive document"),
    });
  };

  const handleFlagAction = () => {
    if (!flagDialog?.flag.id) return;
    if (!flagNote.trim()) {
      toast.error("A note is required");
      return;
    }
    const vars = {
      ...ids,
      flagId: String(flagDialog.flag.id),
      body: { note: flagNote.trim() },
    };
    if (flagDialog.kind === "approve") {
      approveFlag.mutate(vars, {
        onSuccess: () => {
          toast.success("Review flag approved");
          setFlagDialog(null);
          setFlagNote("");
        },
        onError: (err) => toastApiError(err, "Failed to approve review flag"),
      });
      return;
    }
    rejectFlag.mutate(vars, {
      onSuccess: () => {
        toast.success("Review flag rejected");
        setFlagDialog(null);
        setFlagNote("");
      },
      onError: (err) => toastApiError(err, "Failed to reject review flag"),
    });
  };

  const docBusy =
    acceptDocument.isPending ||
    refuseDocument.isPending ||
    submitDocument.isPending ||
    waiveDocument.isPending ||
    submitPending;
  const flagBusy = approveFlag.isPending || rejectFlag.isPending;
  const discountBusy = requestDiscount.isPending || approveDiscount.isPending || rejectDiscount.isPending;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/renewals")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Renewals
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Renewal
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {shortRenewalId(renewal.id ?? renewalId)}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${renewalStatusClass(status)}`}
            >
              {renewalStatusLabel(status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Period {renewal.targetPeriodSequence ?? "—"} · {formatRenewalPeriod(renewal.targetPeriod)}
            {renewal.policyId ? (
              <>
                {" "}
                · policy{" "}
                <Link to={`/policies/${renewal.policyId}`} className="text-primary hover:underline font-mono">
                  {shortRenewalId(renewal.policyId)}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "planned" && (
            <Button size="sm" className="gap-2" onClick={() => setStartOpen(true)}>
              <Play className="h-4 w-4" /> Start renewal
            </Button>
          )}
          {status === "draft" && (
            <Button size="sm" className="gap-2" onClick={handlePrice} disabled={priceRenewal.isPending}>
              <Calculator className="h-4 w-4" />
              {priceRenewal.isPending ? "Pricing…" : "Price renewal"}
            </Button>
          )}
          {mutable && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setDiscountOpen(true)}>
              <Percent className="h-4 w-4" /> Request discount
            </Button>
          )}
          {status === "priced" && (
            <Button size="sm" className="gap-2" onClick={() => setApplyOpen(true)}>
              <CheckCircle2 className="h-4 w-4" /> Apply renewal
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Charge premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {formatRenewalMoney(renewal.chargePremium)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Calculated premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatRenewalMoney(renewal.calculatedPremium)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Existing exposure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatRenewalMoney(renewal.existingExposure)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Loan balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {renewal.requiresLoanBalances
                ? `${formatRenewalMoney(renewal.openingBalance)} → ${formatRenewalMoney(renewal.closingBalance)}`
                : "Not required"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Created" value={formatRenewalDateTime(renewal.createdOnUtc)} />
          <Field label="Started" value={formatRenewalDateTime(renewal.startedOnUtc)} />
          <Field label="Priced" value={formatRenewalDateTime(renewal.pricedOnUtc)} />
          <Field label="Applied" value={formatRenewalDateTime(renewal.appliedOnUtc)} />
          <Field label="Source offer period" value={renewal.sourceOfferPeriodSequence ?? "—"} />
          <Field label="Requires loan balances" value={renewal.requiresLoanBalances ? "Yes" : "No"} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Coverages</CardTitle>
          <CardDescription>{coverages.length} coverage line{coverages.length === 1 ? "" : "s"}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coverage</TableHead>
                  <TableHead className="text-right">Sum insured</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Multiplier</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      No coverages on this renewal yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  coverages.map((row) => (
                    <TableRow key={row.id ?? row.coverageId}>
                      <TableCell>
                        <div className="font-medium">{row.coverageName ?? row.coverageId ?? "—"}</div>
                        {row.coverageDescription ? (
                          <div className="text-xs text-muted-foreground">{row.coverageDescription}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRenewalMoney(row.sumInsured)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatRate(row.rateUsed)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.ratingTableMultiplierUsed ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRenewalMoney(row.calculatedPremium)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Documents
            {documents.length > 0 ? <Badge variant="secondary">{documents.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Review flags
            {flags.length > 0 ? <Badge variant="secondary">{flags.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5">
            <Percent className="h-3.5 w-3.5" /> Discounts
            {discounts.length > 0 ? <Badge variant="secondary">{discounts.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No document requirements on this renewal.
                  </p>
                ) : (
                  documents.map((doc) => {
                    const label = documentTypeNameById[doc.documentTypeId ?? ""] ?? doc.documentTypeId ?? "Document";
                    const hasFile = Boolean(doc.documentId);
                    return (
                      <div key={doc.id ?? doc.documentTypeId} className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-medium">{label}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${documentStatusClass(doc.status)}`}>
                              {documentStatusLabel(doc.status)}
                            </span>
                            {doc.isSatisfied ? (
                              <Badge variant="outline" className="text-emerald-700">Satisfied</Badge>
                            ) : null}
                          </div>
                          {doc.refusalReason ? (
                            <p className="text-xs text-destructive mt-1">Refusal: {doc.refusalReason}</p>
                          ) : null}
                          {doc.waiverReason ? (
                            <p className="text-xs text-muted-foreground mt-1">Waiver: {doc.waiverReason}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasFile && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                disabled={fileBusy?.id === doc.documentId}
                                onClick={() => doc.documentId && void openPreview(doc.documentId, label)}
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                disabled={fileBusy?.id === doc.documentId}
                                onClick={() => doc.documentId && void download(doc.documentId, label)}
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </Button>
                            </>
                          )}
                          {mutable && doc.status === "required" && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 gap-1.5"
                                disabled={docBusy}
                                onClick={() => {
                                  setSubmitFile(null);
                                  setSubmitTarget(doc);
                                }}
                              >
                                <Upload className="h-3.5 w-3.5" /> Submit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={docBusy}
                                onClick={() => {
                                  setReasonText("");
                                  setReasonDialog({ kind: "waive", requirement: doc });
                                }}
                              >
                                Waive
                              </Button>
                            </>
                          )}
                          {mutable && doc.status === "submitted" && (
                            <>
                              <Button
                                size="sm"
                                className="h-8"
                                disabled={docBusy}
                                onClick={() =>
                                  acceptDocument.mutate(
                                    { ...ids, requirementId: String(doc.id) },
                                    {
                                      onSuccess: () => toast.success("Document accepted"),
                                      onError: (err) => toastApiError(err, "Failed to accept document"),
                                    },
                                  )
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive"
                                disabled={docBusy}
                                onClick={() => {
                                  setReasonText("");
                                  setReasonDialog({ kind: "refuse", requirement: doc });
                                }}
                              >
                                Refuse
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {flags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No review flags on this renewal.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Raised</TableHead>
                        <TableHead>Resolved</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flags.map((flag) => (
                        <TableRow key={flag.id ?? flag.type}>
                          <TableCell className="font-medium">{humanizeRenewalEnum(flag.type)}</TableCell>
                          <TableCell className="text-sm max-w-[320px]">{flag.reason ?? "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${flagStatusClass(flag.status)}`}>
                              {flagStatusLabel(flag.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] text-muted-foreground">
                            {flag.resolutionNote?.trim() || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {formatRenewalDateTime(flag.raisedOnUtc)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {formatRenewalDateTime(flag.resolvedOnUtc)}
                          </TableCell>
                          <TableCell className="text-right">
                            {mutable && flag.status === "raised" ? (
                              <div className="inline-flex gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-8"
                                  disabled={flagBusy}
                                  onClick={() => {
                                    setFlagNote("");
                                    setFlagDialog({ kind: "approve", flag });
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-destructive"
                                  disabled={flagBusy}
                                  onClick={() => {
                                    setFlagNote("");
                                    setFlagDialog({ kind: "reject", flag });
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              "—"
                            )}
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

        <TabsContent value="discounts" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {discounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No discount requests on this renewal.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Discount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDiscountPct(row.requestedDiscountPercentage)}
                          </TableCell>
                          <TableCell className="text-sm max-w-[320px]">{row.reason ?? "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${discountStatusClass(row.status)}`}>
                              {discountStatusLabel(row.status)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {formatRenewalDateTime(row.requestedOnUtc)}
                          </TableCell>
                          <TableCell className="text-right">
                            {mutable && row.status === "requested" && row.id != null ? (
                              <div className="inline-flex gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-8"
                                  disabled={discountBusy}
                                  onClick={() =>
                                    approveDiscount.mutate(
                                      { ...ids, requestId: String(row.id) },
                                      {
                                        onSuccess: () => toast.success("Discount approved"),
                                        onError: (err) => toastApiError(err, "Failed to approve discount"),
                                      },
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-destructive"
                                  disabled={discountBusy}
                                  onClick={() =>
                                    rejectDiscount.mutate(
                                      { ...ids, requestId: String(row.id) },
                                      {
                                        onSuccess: () => toast.success("Discount rejected"),
                                        onError: (err) => toastApiError(err, "Failed to reject discount"),
                                      },
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              "—"
                            )}
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
      </Tabs>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start renewal</DialogTitle>
            <DialogDescription>
              {renewal.requiresLoanBalances
                ? "This plan requires opening and closing loan balances."
                : "Start underwriting for the next coverage period."}
            </DialogDescription>
          </DialogHeader>
          {renewal.requiresLoanBalances && (
            <div className="grid gap-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="opening-balance">Opening balance</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  min={0}
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closing-balance">Closing balance</Label>
                <Input
                  id="closing-balance"
                  type="number"
                  min={0}
                  step="any"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)} disabled={startRenewal.isPending}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={startRenewal.isPending}>
              {startRenewal.isPending ? "Starting…" : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request discount</DialogTitle>
            <DialogDescription>Submit a discount request for this renewal period.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="renewal-discount-pct">Discount percentage</Label>
              <Input
                id="renewal-discount-pct"
                type="number"
                min={0.01}
                max={100}
                step="any"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renewal-discount-reason">Reason</Label>
              <Textarea
                id="renewal-discount-reason"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                maxLength={512}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountOpen(false)} disabled={requestDiscount.isPending}>
              Cancel
            </Button>
            <Button onClick={handleRequestDiscount} disabled={requestDiscount.isPending}>
              {requestDiscount.isPending ? "Submitting…" : "Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(submitTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSubmitTarget(null);
            setSubmitFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit document</DialogTitle>
            <DialogDescription>Upload a file and attach it to this requirement.</DialogDescription>
          </DialogHeader>
          <Input
            type="file"
            onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitTarget(null)} disabled={submitPending}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmitDocument()} disabled={submitPending}>
              {submitPending ? "Uploading…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reasonDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setReasonDialog(null);
            setReasonText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reasonDialog?.kind === "waive" ? "Waive document" : "Refuse document"}</DialogTitle>
            <DialogDescription>Provide a reason (max 512 characters).</DialogDescription>
          </DialogHeader>
          <Textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} maxLength={512} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialog(null)} disabled={docBusy}>
              Cancel
            </Button>
            <Button onClick={handleReasonAction} disabled={docBusy}>
              {docBusy ? "Saving…" : reasonDialog?.kind === "waive" ? "Waive" : "Refuse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(flagDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setFlagDialog(null);
            setFlagNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {flagDialog?.kind === "approve" ? "Approve review flag" : "Reject review flag"}
            </DialogTitle>
            <DialogDescription>A note is sent with the decision.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="renewal-flag-note">Note</Label>
            <Textarea
              id="renewal-flag-note"
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              maxLength={512}
              rows={3}
              placeholder="Why is this review flag being resolved?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialog(null)} disabled={flagBusy}>
              Cancel
            </Button>
            <Button onClick={handleFlagAction} disabled={flagBusy || !flagNote.trim()}>
              {flagBusy ? "Saving…" : flagDialog?.kind === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={applyOpen} onOpenChange={setApplyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply this renewal?</AlertDialogTitle>
            <AlertDialogDescription>
              This writes the next coverage period onto the policy and creates installments and invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyRenewal.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={applyRenewal.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleApply();
              }}
            >
              {applyRenewal.isPending ? "Applying…" : "Apply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(applyResult)} onOpenChange={(open) => !open && setApplyResult(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Renewal applied</DialogTitle>
            <DialogDescription>
              {applyResult?.installments?.length ?? 0} installment
              {(applyResult?.installments?.length ?? 0) === 1 ? "" : "s"} and{" "}
              {applyResult?.invoices?.length ?? 0} invoice
              {(applyResult?.invoices?.length ?? 0) === 1 ? "" : "s"} were created.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {applyResult?.policy?.id ? (
              <Button asChild>
                <Link to={`/policies/${applyResult.policy.id}`}>Open policy</Link>
              </Button>
            ) : (
              <Button onClick={() => setApplyResult(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default RenewalDetail;
