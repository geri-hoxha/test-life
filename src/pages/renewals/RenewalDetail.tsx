import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toastApiError } from "@/lib/api-error";
import type { PoliciesApplyPolicyRenewalResponse } from "@/api/types";
import { DiscountRequestsTable } from "@/pages/offers/DiscountRequestsTable";
import { DocAction, OfferDocumentsPanel } from "@/pages/offers/OfferDetail";
import {
  mapReviewFlagsToChecks,
  VerificationChecksTable,
} from "@/pages/offers/VerificationStep";
import { REASON_MAX_LENGTH } from "@/pages/offers/offer-ui";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Percent,
  Play,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { StartRenewalBalanceFields } from "./StartRenewalBalanceFields";
import { startRenewalRequestBody } from "./start-renewal-balances";
import {
  formatRenewalDate,
  formatRenewalDateTime,
  formatRenewalMoney,
  renewalStatusClass,
  renewalStatusLabel,
  shortRenewalId,
} from "./renewal-ui";

const READONLY_CHECKBOX_CLASS =
  "disabled:opacity-100 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white";

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5 break-all">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const DateTimeValue = ({ value }: { value?: string | null }) => (
  <span className="font-mono text-sm font-medium tabular-nums inline-flex items-center gap-1.5">
    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    {formatRenewalDateTime(value)}
  </span>
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
  if (rate.percentageValue != null) return `${rate.percentageValue * 100}%`;
  return "—";
};

const RenewalDetail = () => {
  const { policyId = "", renewalId = "" } = useParams();
  const navigate = useNavigate();
  const { data: renewal, isLoading, isError } = useGetPolicyRenewal(policyId, renewalId, {
    enabled: Boolean(policyId) && Boolean(renewalId),
  });
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });

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
  const [balanceError, setBalanceError] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyResult, setApplyResult] = useState<PoliciesApplyPolicyRenewalResponse | null>(null);

  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [discountConfirm, setDiscountConfirm] = useState<{
    kind: "approve" | "reject";
    requestId: string;
    pctLabel: string;
  } | null>(null);

  const [docSubmitDialog, setDocSubmitDialog] = useState<DocAction | null>(null);
  const [docSubmitFile, setDocSubmitFile] = useState<File | null>(null);
  const [docSubmitPending, setDocSubmitPending] = useState(false);
  const [pendingDocApprove, setPendingDocApprove] = useState<DocAction | null>(null);
  const [docRejectDialog, setDocRejectDialog] = useState<DocAction | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docWaiveDialog, setDocWaiveDialog] = useState<DocAction | null>(null);
  const [docWaiveReason, setDocWaiveReason] = useState("");

  const [pendingFlagAction, setPendingFlagAction] = useState<{
    kind: "approve" | "reject";
    flagId: string;
    label: string;
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
  const ids = { policyId, renewalId };
  const coverages = renewal.coverages ?? [];
  const documents = (renewal.documentRequirements ?? []).map((doc) => ({
    id: doc.id == null ? "" : String(doc.id),
    documentId: doc.documentId ?? null,
    documentTypeId: doc.documentTypeId ?? "",
    status: doc.status ?? "required",
    submissionSource: doc.submissionSource,
    refusalReason: doc.refusalReason,
    waiverReason: doc.waiverReason,
    submittedOnUtc: doc.submittedOnUtc,
    decidedOnUtc: doc.decidedOnUtc,
  }));
  const verificationChecks = mapReviewFlagsToChecks(
    (renewal.reviewFlags ?? []).map((flag) => ({
      id: flag.id == null ? undefined : String(flag.id),
      type: flag.type,
      reason: flag.reason,
      status: flag.status,
      resolutionNote: flag.resolutionNote,
      raisedOnUtc: flag.raisedOnUtc,
      resolvedOnUtc: flag.resolvedOnUtc,
    })),
  );
  const discountRows = (renewal.discountRequests ?? []).map((row) => ({
    id: row.id == null ? "" : String(row.id),
    targetPeriodSequence: row.targetPeriodSequence,
    requestedDiscountPercentage: row.requestedDiscountPercentage,
    reason: row.reason,
    status: row.status,
    requestedOnUtc: row.requestedOnUtc,
  }));

  const resetStartBalances = () => {
    setOpeningBalance("");
    setClosingBalance("");
    setBalanceError(false);
  };

  const closeStart = () => {
    setStartOpen(false);
    resetStartBalances();
  };

  const handleStart = () => {
    const balances = startRenewalRequestBody(openingBalance, closingBalance);
    if (!balances.ok) {
      setBalanceError(true);
      return;
    }
    startRenewal.mutate(
      { ...ids, body: balances.body },
      {
        onSuccess: () => {
          toast.success("Renewal started");
          closeStart();
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
    if (status !== "draft") {
      toast.error("Discount requests can only be submitted while the renewal is draft");
      return;
    }
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
        body: {
          requestedDiscountPercentage: pct / 100,
          reason: discountReason.trim().slice(0, REASON_MAX_LENGTH),
        },
      },
      {
        onSuccess: () => {
          toast.success("Discount requested");
          setDiscountOpen(false);
          setDiscountPct("");
          setDiscountReason("");
        },
        onError: (err) => toastApiError(err, "Failed to request discount"),
      },
    );
  };

  const handleApproveDiscount = (requestId: string) => {
    approveDiscount.mutate(
      { ...ids, requestId },
      {
        onSuccess: () => toast.success("Discount request approved"),
        onError: (err) => toastApiError(err, "Failed to approve discount"),
      },
    );
  };

  const handleRejectDiscount = (requestId: string) => {
    rejectDiscount.mutate(
      { ...ids, requestId },
      {
        onSuccess: () => toast.success("Discount request rejected"),
        onError: (err) => toastApiError(err, "Failed to reject discount"),
      },
    );
  };

  const handleConfirmDiscountAction = () => {
    if (!discountConfirm) return;
    const { kind, requestId } = discountConfirm;
    setDiscountConfirm(null);
    if (kind === "approve") handleApproveDiscount(requestId);
    else handleRejectDiscount(requestId);
  };

  const handleSubmitDocument = async () => {
    if (!docSubmitDialog) return;
    if (!docSubmitFile) {
      toast.error("Choose a file to upload");
      return;
    }
    try {
      setDocSubmitPending(true);
      const uploaded = await createDocument(buildCreateDocumentFormData(docSubmitFile, docSubmitFile.name));
      if (!uploaded.id) throw new Error("Upload did not return a document id");
      await submitDocument.mutateAsync({
        ...ids,
        requirementId: docSubmitDialog.requirementId,
        body: { documentId: uploaded.id },
      });
      toast.success(`Document submitted: ${docSubmitDialog.label}`);
      setDocSubmitDialog(null);
      setDocSubmitFile(null);
    } catch (err) {
      toastApiError(err, "Failed to submit document");
    } finally {
      setDocSubmitPending(false);
    }
  };

  const handleApproveDocument = () => {
    if (!pendingDocApprove) return;
    acceptDocument.mutate(
      { ...ids, requirementId: pendingDocApprove.requirementId },
      {
        onSuccess: () => {
          toast.success(`Document approved: ${pendingDocApprove.label}`);
          setPendingDocApprove(null);
        },
        onError: (err) => toastApiError(err, "Failed to approve document"),
      },
    );
  };

  const handleRejectDocument = () => {
    if (!docRejectDialog) return;
    if (!docRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    refuseDocument.mutate(
      {
        ...ids,
        requirementId: docRejectDialog.requirementId,
        body: { reason: docRejectReason.trim().slice(0, REASON_MAX_LENGTH) },
      },
      {
        onSuccess: () => {
          toast.success(`Document rejected: ${docRejectDialog.label}`);
          setDocRejectDialog(null);
          setDocRejectReason("");
        },
        onError: (err) => toastApiError(err, "Failed to reject document"),
      },
    );
  };

  const handleWaiveDocument = () => {
    if (!docWaiveDialog) return;
    if (!docWaiveReason.trim()) {
      toast.error("Waiver reason is required");
      return;
    }
    waiveDocument.mutate(
      {
        ...ids,
        requirementId: docWaiveDialog.requirementId,
        body: { reason: docWaiveReason.trim().slice(0, REASON_MAX_LENGTH) },
      },
      {
        onSuccess: () => {
          toast.success(`Document waived: ${docWaiveDialog.label}`);
          setDocWaiveDialog(null);
          setDocWaiveReason("");
        },
        onError: (err) => toastApiError(err, "Failed to waive document"),
      },
    );
  };

  const handleFlagAction = () => {
    if (!pendingFlagAction) return;
    const note = flagNote.trim().slice(0, REASON_MAX_LENGTH);
    if (!note) {
      toast.error("A note is required");
      return;
    }
    const vars = {
      ...ids,
      flagId: pendingFlagAction.flagId,
      body: { note },
    };
    if (pendingFlagAction.kind === "approve") {
      approveFlag.mutate(vars, {
        onSuccess: () => {
          toast.success(`Review flag approved: ${pendingFlagAction.label}`);
          setPendingFlagAction(null);
          setFlagNote("");
        },
        onError: (err) => toastApiError(err, "Failed to approve review flag"),
      });
      return;
    }
    rejectFlag.mutate(vars, {
      onSuccess: () => {
        toast.success(`Review flag rejected: ${pendingFlagAction.label}`);
        setPendingFlagAction(null);
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
    docSubmitPending;
  const flagBusy = approveFlag.isPending || rejectFlag.isPending;
  const discountBusy = requestDiscount.isPending || approveDiscount.isPending || rejectDiscount.isPending;

  const discountConfirmCopy = discountConfirm
    ? discountConfirm.kind === "approve"
      ? {
          title: "Approve discount request?",
          description: `Approve the ${discountConfirm.pctLabel} discount.`,
          confirmLabel: discountBusy ? "Approving…" : "Approve",
          destructive: false,
        }
      : {
          title: "Reject discount request?",
          description: `Reject the ${discountConfirm.pctLabel} discount.`,
          confirmLabel: discountBusy ? "Rejecting…" : "Reject",
          destructive: true,
        }
    : null;

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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "planned" && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                resetStartBalances();
                setStartOpen(true);
              }}
            >
              <Play className="h-4 w-4" /> Start renewal
            </Button>
          )}
          {status === "draft" && (
            <Button size="sm" className="gap-2" onClick={handlePrice} disabled={priceRenewal.isPending}>
              <Calculator className="h-4 w-4" />
              {priceRenewal.isPending ? "Pricing…" : "Price renewal"}
            </Button>
          )}
          {status === "priced" && (
            <Button size="sm" className="gap-2" onClick={() => setApplyOpen(true)}>
              <CheckCircle2 className="h-4 w-4" /> Apply renewal
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field
            label="Policy"
            value={
              renewal.policyId ? (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <span className="font-mono text-xs truncate">{renewal.policyId}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    title="Open policy"
                    asChild
                  >
                    <Link to={`/policies/${renewal.policyId}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="sr-only">Open policy</span>
                    </Link>
                  </Button>
                </span>
              ) : undefined
            }
          />
          <Field
            label="Requires loan balances"
            value={
              <Checkbox
                checked={Boolean(renewal.requiresLoanBalances)}
                disabled
                className={READONLY_CHECKBOX_CLASS}
                aria-label="Requires loan balances"
              />
            }
          />
          <Field label="Target period sequence" value={renewal.targetPeriodSequence ?? "—"} />
          <Field
            label="Target period start"
            value={
              <span className="font-mono text-sm tabular-nums">
                {formatRenewalDate(renewal.targetPeriod?.startDate)}
              </span>
            }
          />
          <Field
            label="Target period end"
            value={
              <span className="font-mono text-sm tabular-nums">
                {formatRenewalDate(renewal.targetPeriod?.endDate)}
              </span>
            }
          />
          <Field label="Source offer period sequence" value={renewal.sourceOfferPeriodSequence ?? "—"} />
          <Field label="Opening balance" value={formatRenewalMoney(renewal.openingBalance)} />
          <Field label="Closing balance" value={formatRenewalMoney(renewal.closingBalance)} />
          <Field label="Calculated premium" value={formatRenewalMoney(renewal.calculatedPremium)} />
          <Field
            label="Charge premium"
            value={<span className="text-primary">{formatRenewalMoney(renewal.chargePremium)}</span>}
          />
          <Field
            label="Status"
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${renewalStatusClass(status)}`}
              >
                {renewalStatusLabel(status)}
              </span>
            }
          />
          <Field label="Created on UTC" value={<DateTimeValue value={renewal.createdOnUtc} />} />
          <Field label="Started on UTC" value={<DateTimeValue value={renewal.startedOnUtc} />} />
          <Field label="Priced on UTC" value={<DateTimeValue value={renewal.pricedOnUtc} />} />
          <Field label="Applied on UTC" value={<DateTimeValue value={renewal.appliedOnUtc} />} />
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
            {verificationChecks.length > 0 ? (
              <Badge variant="secondary">{verificationChecks.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5">
            <Percent className="h-3.5 w-3.5" /> Discounts
            {discountRows.length > 0 ? <Badge variant="secondary">{discountRows.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="coverages" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Coverages
            {coverages.length > 0 ? <Badge variant="secondary">{coverages.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>Document requirements on this renewal.</CardDescription>
            </CardHeader>
            <CardContent>
              <OfferDocumentsPanel
                documents={documents}
                documentTypeNameById={documentTypeNameById}
                docActionPending={docBusy}
                emptyMessage="No document requirements on this renewal."
                onSubmit={(args) => {
                  setDocSubmitFile(null);
                  setDocSubmitDialog(args);
                }}
                onApprove={setPendingDocApprove}
                onReject={(args) => {
                  setDocRejectReason("");
                  setDocRejectDialog(args);
                }}
                onWaive={(args) => {
                  setDocWaiveReason("");
                  setDocWaiveDialog(args);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review flags</CardTitle>
              <CardDescription>Review flags on this renewal.</CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationChecksTable
                checks={verificationChecks}
                actionPending={flagBusy}
                emptyMessage="No review flags on this renewal."
                onApprove={(flagId) => {
                  const flag = verificationChecks.find((item) => item.id === flagId);
                  setFlagNote("");
                  setPendingFlagAction({
                    kind: "approve",
                    flagId,
                    label: flag?.name?.trim() || flagId,
                  });
                }}
                onReject={(flagId) => {
                  const flag = verificationChecks.find((item) => item.id === flagId);
                  setFlagNote("");
                  setPendingFlagAction({
                    kind: "reject",
                    flagId,
                    label: flag?.name?.trim() || flagId,
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Discount Requests</CardTitle>
                <CardDescription>Discount requests on this renewal.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={status !== "draft" || requestDiscount.isPending}
                title={
                  status !== "draft"
                    ? "Discount requests can only be submitted while the renewal is draft"
                    : undefined
                }
                onClick={() => {
                  if (status !== "draft") return;
                  setDiscountPct("");
                  setDiscountReason("");
                  setDiscountOpen(true);
                }}
              >
                <Percent className="h-3.5 w-3.5" /> Request Discount
              </Button>
            </CardHeader>
            <CardContent>
              <DiscountRequestsTable
                rows={discountRows}
                actionPending={discountBusy}
                emptyMessage="No discount requests on this renewal."
                onApprove={(action) =>
                  setDiscountConfirm({
                    kind: "approve",
                    requestId: action.requestId,
                    pctLabel: action.pctLabel,
                  })
                }
                onReject={(action) =>
                  setDiscountConfirm({
                    kind: "reject",
                    requestId: action.requestId,
                    pctLabel: action.pctLabel,
                  })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverages</CardTitle>
              <CardDescription>
                {coverages.length} coverage line{coverages.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
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
                              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {row.coverageDescription}
                              </div>
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={startOpen}
        onOpenChange={(open) => {
          if (!open && !startRenewal.isPending) closeStart();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start renewal</DialogTitle>
            <DialogDescription>
              Start underwriting for the next coverage period.
            </DialogDescription>
          </DialogHeader>
          <StartRenewalBalanceFields
            openingBalance={openingBalance}
            closingBalance={closingBalance}
            onOpeningBalanceChange={setOpeningBalance}
            onClosingBalanceChange={setClosingBalance}
            disabled={startRenewal.isPending}
            showError={balanceError}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeStart} disabled={startRenewal.isPending}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={startRenewal.isPending}>
              {startRenewal.isPending ? "Starting…" : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={discountOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDiscountOpen(false);
            setDiscountPct("");
            setDiscountReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request discount</DialogTitle>
            <DialogDescription>Submit a discount request for this renewal.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="renewal-discount-pct">Discount percentage</Label>
              <div className="relative">
                <Input
                  id="renewal-discount-pct"
                  type="number"
                  min={0.01}
                  max={100}
                  step="any"
                  className="pr-8"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="renewal-discount-reason">Reason</Label>
              <Textarea
                id="renewal-discount-reason"
                rows={3}
                maxLength={REASON_MAX_LENGTH}
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Why is this discount requested?"
              />
              <p className="text-[11px] text-muted-foreground">
                {discountReason.length}/{REASON_MAX_LENGTH}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountOpen(false)} disabled={requestDiscount.isPending}>
              Cancel
            </Button>
            <Button onClick={handleRequestDiscount} disabled={requestDiscount.isPending}>
              {requestDiscount.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDocApprove} onOpenChange={(open) => !open && setPendingDocApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve document?</AlertDialogTitle>
            <AlertDialogDescription>
              Approve <span className="font-medium text-foreground">{pendingDocApprove?.label}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acceptDocument.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={acceptDocument.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleApproveDocument();
              }}
            >
              {acceptDocument.isPending ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingFlagAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingFlagAction(null);
            setFlagNote("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingFlagAction?.kind === "reject" ? "Reject review flag?" : "Approve review flag?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingFlagAction?.kind === "reject" ? "Reject" : "Approve"}{" "}
              <span className="font-medium text-foreground">{pendingFlagAction?.label}</span>. A note is sent with
              the decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="renewal-flag-note">Note</Label>
            <Textarea
              id="renewal-flag-note"
              rows={3}
              maxLength={REASON_MAX_LENGTH}
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              placeholder="Why is this review flag being resolved?"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={flagBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={flagBusy || !flagNote.trim()}
              className={
                pendingFlagAction?.kind === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                handleFlagAction();
              }}
            >
              {flagBusy
                ? pendingFlagAction?.kind === "reject"
                  ? "Rejecting…"
                  : "Approving…"
                : pendingFlagAction?.kind === "reject"
                  ? "Reject"
                  : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!docRejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDocRejectDialog(null);
            setDocRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document · {docRejectDialog?.label}</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this document requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="doc-reject-reason">Reason</Label>
            <Textarea
              id="doc-reject-reason"
              rows={4}
              maxLength={REASON_MAX_LENGTH}
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              placeholder="Why is this document being rejected?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDocRejectDialog(null);
                setDocRejectReason("");
              }}
              disabled={refuseDocument.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={refuseDocument.isPending || !docRejectReason.trim()}
            >
              {refuseDocument.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!docSubmitDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDocSubmitDialog(null);
            setDocSubmitFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit document · {docSubmitDialog?.label}</DialogTitle>
            <DialogDescription>Upload a file to submit for this requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="doc-submit-file">File</Label>
            <Input
              id="doc-submit-file"
              type="file"
              disabled={docSubmitPending}
              onChange={(e) => setDocSubmitFile(e.target.files?.[0] ?? null)}
            />
            {docSubmitFile && (
              <p className="text-xs text-muted-foreground truncate">Selected: {docSubmitFile.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDocSubmitDialog(null);
                setDocSubmitFile(null);
              }}
              disabled={docSubmitPending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmitDocument()} disabled={docSubmitPending || !docSubmitFile}>
              {docSubmitPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!docWaiveDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDocWaiveDialog(null);
            setDocWaiveReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive document · {docWaiveDialog?.label}</DialogTitle>
            <DialogDescription>Provide a reason for waiving this document requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="doc-waive-reason">Reason</Label>
            <Textarea
              id="doc-waive-reason"
              rows={4}
              maxLength={REASON_MAX_LENGTH}
              value={docWaiveReason}
              onChange={(e) => setDocWaiveReason(e.target.value)}
              placeholder="Why is this document being waived?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDocWaiveDialog(null);
                setDocWaiveReason("");
              }}
              disabled={waiveDocument.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWaiveDocument}
              disabled={waiveDocument.isPending || !docWaiveReason.trim()}
            >
              {waiveDocument.isPending ? "Waiving…" : "Waive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!discountConfirm}
        onOpenChange={(open) => {
          if (!open && !discountBusy) setDiscountConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{discountConfirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{discountConfirmCopy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={discountBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={discountBusy}
              className={
                discountConfirmCopy?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDiscountAction();
              }}
            >
              {discountConfirmCopy?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
