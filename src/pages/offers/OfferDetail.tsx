import { useMemo, useState, Fragment } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { OverlayLoader, PageLoader } from "@/components/Loader";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Users,
  FileText,
  Package,
  AlertTriangle,
  Percent,
  Upload,
  Download,
  Calculator,
  Loader2,
  Eye,
} from "lucide-react";
import { statusColor } from "@/data/offers";
import { ageFromDob } from "@/data/customers";
import {
  VerificationCheck,
  VerificationChecksTable,
  mapReviewFlagsToChecks,
  overallStatus,
} from "./VerificationStep";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-error";
import {
  useGetOffer,
  useCancelOffer,
  usePreviewOfferPremium,
  useRequestOfferDiscount,
  useApproveOfferDiscount,
  useRejectOfferDiscount,
  useAcceptOfferDocument,
  useRefuseOfferDocument,
  useSubmitOfferDocument,
  useWaiveOfferDocument,
  useApproveOfferReviewFlag,
  useRejectOfferReviewFlag,
  useIssueOfferPolicy,
  useRateOffer,
  useQuoteOffer,
} from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { useListCoverages } from "@/api/coverages";
import { useListDocumentTypes } from "@/api/document-types";
import {
  buildCreateDocumentFormData,
  createDocument,
  downloadDocumentFile,
  useGetDocument,
} from "@/api/documents";
import { useGetBankAccount } from "@/api/bank-accounts";
import { customerPath, countryDisplayName } from "@/api/adapters/customers";
import { useCountryEnum, useRelationshipToInsuredEnum, smartEnumLabel } from "@/api/smart-enums";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { useDocumentPreview } from "@/components/documents/DocumentPreview";
import {
  REASON_MAX_LENGTH,
  discountStatusClass,
  discountStatusLabel,
  documentStatusLabel,
  formatDiscountPct,
  formatOfferDate,
  formatOfferDateTime,
  formatOfferMoney,
  formatRate,
  periodStatusClass,
  periodStatusLabel,
  salesChannelLabel,
  submissionSourceLabel,
} from "./offer-ui";

const fmtMoney = (v: number, ccy: string) => formatOfferMoney(v, ccy);

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</div>
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

const docStatusBadge = (status: string) => {
  switch (status) {
    case "waived":
      return <Badge variant="secondary">{documentStatusLabel(status)}</Badge>;
    case "accepted":
      return <Badge variant="default" className="bg-emerald-600">{documentStatusLabel(status)}</Badge>;
    case "submitted":
      return <Badge variant="secondary">{documentStatusLabel(status)}</Badge>;
    case "refused":
      return <Badge variant="destructive">{documentStatusLabel(status)}</Badge>;
    default:
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 mr-1" /> {documentStatusLabel(status)}
        </Badge>
      );
  }
};

type DocAction = {
  requirementId: string;
  label: string;
};

const OfferDocumentsPanel = ({
  documents,
  reviewFlags,
  documentTypeNameById,
  docActionPending,
  flagActionPending,
  onSubmit,
  onApprove,
  onReject,
  onWaive,
  onApproveFlag,
  onRejectFlag,
}: {
  documents: {
    id: string;
    documentId?: string | null;
    documentTypeId: string;
    status: string;
    submissionSource?: string | null;
    refusalReason?: string | null;
    waiverReason?: string | null;
    submittedOnUtc?: string | null;
    decidedOnUtc?: string | null;
  }[];
  reviewFlags: {
    id: string;
    type: string;
    reason: string;
    status: string;
  }[];
  documentTypeNameById: Record<string, string>;
  docActionPending: boolean;
  flagActionPending: boolean;
  onSubmit: (args: DocAction) => void;
  onApprove: (args: DocAction) => void;
  onReject: (args: DocAction) => void;
  onWaive: (args: DocAction) => void;
  onApproveFlag: (flagId: string) => void;
  onRejectFlag: (flagId: string) => void;
}) => {
  const { fileBusy, openPreview, download } = useDocumentPreview();

  const yearChecks = useMemo(
    () => mapReviewFlagsToChecks(reviewFlags),
    [reviewFlags]
  );

  return (
    <>
    <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x border-t bg-muted/20">
      <div className="p-4 space-y-3 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Documents</h4>
        </div>
        {documents.length === 0 ? (
          <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            No document requirements on this offer.
          </div>
        ) : (
          <div className="grid gap-2">
            {documents.map((d) => {
              const label =
                documentTypeNameById[d.documentTypeId] ?? d.documentTypeId;
              const canSubmit = d.status === "required" || d.status === "refused";
              const canReview = d.status === "submitted";
              const hasFile = Boolean(d.documentId);
              const previewBusy =
                fileBusy?.id === d.documentId && fileBusy.action === "preview";
              const downloadBusy =
                fileBusy?.id === d.documentId && fileBusy.action === "download";
              return (
                <Card
                  key={d.id || `${d.documentTypeId}-${d.documentId}`}
                  className="bg-background shadow-none"
                >
                  <CardHeader className="p-3 pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium leading-snug">
                        {label}
                      </CardTitle>
                      {docStatusBadge(d.status)}
                    </div>
                    <div className="space-y-0.5">
                      <CardDescription className="font-mono text-[11px]">
                        {d.documentTypeId}
                      </CardDescription>
                      {d.documentId ? (
                        <CardDescription className="font-mono text-[11px]">
                          Doc: {d.documentId}
                        </CardDescription>
                      ) : null}
                      {submissionSourceLabel(d.submissionSource) ? (
                        <CardDescription className="text-[11px]">
                          Source: {submissionSourceLabel(d.submissionSource)}
                        </CardDescription>
                      ) : null}
                      {d.submittedOnUtc ? (
                        <CardDescription className="text-[11px]">
                          Submitted {formatOfferDateTime(d.submittedOnUtc)}
                        </CardDescription>
                      ) : null}
                      {d.decidedOnUtc ? (
                        <CardDescription className="text-[11px]">
                          Decided {formatOfferDateTime(d.decidedOnUtc)}
                        </CardDescription>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {d.waiverReason ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Waiver: </span>
                        {d.waiverReason}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hasFile ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="View document"
                            disabled={Boolean(fileBusy)}
                            onClick={() =>
                              d.documentId &&
                              void openPreview(d.documentId, label)
                            }
                          >
                            {previewBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="Download document"
                            disabled={Boolean(fileBusy)}
                            onClick={() =>
                              d.documentId &&
                              void download(d.documentId, label)
                            }
                          >
                            {downloadBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="sr-only">Download</span>
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        disabled={!canSubmit || docActionPending || !d.id}
                        onClick={() =>
                          onSubmit({
                            requirementId: d.id,
                            label,
                          })
                        }
                      >
                        <Upload className="h-3.5 w-3.5" /> Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                        disabled={!canReview || docActionPending || !d.id}
                        onClick={() =>
                          onApprove({
                            requirementId: d.id,
                            label,
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-destructive hover:text-destructive"
                        disabled={!canReview || docActionPending || !d.id}
                        onClick={() =>
                          onReject({
                            requirementId: d.id,
                            label,
                          })
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        disabled={!canSubmit || docActionPending || !d.id}
                        onClick={() =>
                          onWaive({
                            requirementId: d.id,
                            label,
                          })
                        }
                      >
                        Waive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 min-w-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Verification</h4>
        </div>
        <div className="bg-background rounded-md">
          <VerificationChecksTable
            checks={yearChecks}
            actionPending={flagActionPending}
            onApprove={onApproveFlag}
            onReject={onRejectFlag}
          />
        </div>
      </div>
    </div>

    </>
  );
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apiOffer, isLoading } = useGetOffer(id ?? "", { enabled: Boolean(id) });
  const { data: countryOptions = [] } = useCountryEnum();
  const { data: relationshipOptions = [] } = useRelationshipToInsuredEnum();
  const countryLabel = (code?: string) => countryDisplayName(code, countryOptions) ?? code;
  const relationshipLabel = (value?: string | null) => smartEnumLabel(relationshipOptions, value);
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();
  const {
    data: premiumPreview,
    isFetching: premiumPreviewLoading,
    isError: premiumPreviewError,
    error: premiumPreviewErr,
    refetch: refetchPremiumPreview,
  } = usePreviewOfferPremium(id ?? "", { enabled: Boolean(id) });
  const cancelOffer = useCancelOffer();
  const requestDiscount = useRequestOfferDiscount();
  const approveDiscount = useApproveOfferDiscount();
  const rejectDiscount = useRejectOfferDiscount();
  const acceptDocument = useAcceptOfferDocument();
  const refuseDocument = useRefuseOfferDocument();
  const submitDocument = useSubmitOfferDocument();
  const waiveDocument = useWaiveOfferDocument();
  const approveReviewFlag = useApproveOfferReviewFlag();
  const rejectReviewFlag = useRejectOfferReviewFlag();
  const issueOfferPolicy = useIssueOfferPolicy();
  const rateOffer = useRateOffer();
  const quoteOffer = useQuoteOffer();
  const { data: coveragesPage } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });

  const previewPremiumTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.payPremium, 0),
    [premiumPreview],
  );
  const previewInsuredTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.insuredAmount, 0),
    [premiumPreview],
  );

  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState("50");
  const [discountReason, setDiscountReason] = useState("");
  const [discountPeriod, setDiscountPeriod] = useState("");
  const [docRejectDialog, setDocRejectDialog] = useState<{
    requirementId: string;
    label: string;
  } | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docWaiveDialog, setDocWaiveDialog] = useState<{
    requirementId: string;
    label: string;
  } | null>(null);
  const [docWaiveReason, setDocWaiveReason] = useState("");
  const [docSubmitDialog, setDocSubmitDialog] = useState<{
    requirementId: string;
    label: string;
  } | null>(null);
  const [docSubmitFile, setDocSubmitFile] = useState<File | null>(null);
  const [docSubmitPending, setDocSubmitPending] = useState(false);
  const [pendingDocApprove, setPendingDocApprove] = useState<{
    requirementId: string;
    label: string;
  } | null>(null);
  const [pendingFlagAction, setPendingFlagAction] = useState<{
    kind: "approve" | "reject";
    flagId: string;
    label: string;
  } | null>(null);
  const [issuancePending, setIssuancePending] = useState<"issue" | "rate" | "quote" | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<"reject" | "issue" | "rate" | "quote" | null>(
    null
  );
  const [discountConfirm, setDiscountConfirm] = useState<{
    kind: "approve" | "reject";
    requestId: string;
    pctLabel: string;
  } | null>(null);

  const coverageNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of coveragesPage?.items ?? []) {
      if (c.id) m[c.id] = c.name?.trim() || c.id;
    }
    return m;
  }, [coveragesPage?.items]);

  const documentTypeNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const d of documentTypesPage?.items ?? []) {
      if (d.id) m[d.id] = d.name?.trim() || d.id;
    }
    return m;
  }, [documentTypesPage?.items]);

  const offer = useMemo(() => {
    if (apiOffer) return mapApiOffer(apiOffer);
    return undefined;
  }, [apiOffer]);

  const { data: apiProduct } = useGetProduct(offer?.productId ?? "", { enabled: Boolean(offer?.productId) });
  const product = useMemo(() => {
    if (apiProduct) return mapApiProduct(apiProduct);
    return undefined;
  }, [apiProduct]);

  const templateDocumentId = product?.defaultPrintableTemplateDocumentId?.trim() || "";
  const { data: templateDocument } = useGetDocument(templateDocumentId, {
    enabled: Boolean(templateDocumentId),
  });

  const paymentMethod =
    product?.bankAccounts?.find((entry) => entry.currency === offer?.currency) ??
    product?.bankAccounts?.[0];
  const paymentBankAccountId = paymentMethod?.bankAccountId?.trim() || "";
  const { data: paymentBankAccount } = useGetBankAccount(paymentBankAccountId, {
    enabled: Boolean(paymentBankAccountId),
  });

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
          <p className="text-sm text-muted-foreground mt-2">The offer you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/offers")} className="mt-4">Back to Offers</Button>
        </div>
      </AppShell>
    );
  }

  const holder = offer.participants.find((p) => p.role === "policyHolder");
  const payer = offer.participants.find((p) => p.role === "invoiced") ?? holder;
  const insuredPerson = offer.insuredPersons[0];
  const yearCoverages = offer.offerYears.flatMap((s) => s.coverages);

  const verificationChecks: VerificationCheck[] = mapReviewFlagsToChecks(offer.reviewFlags);
  const verifOverall = overallStatus(verificationChecks);
  const reviewCount = verificationChecks.filter((c) => c.result === "Requires Review").length;
  const warnCount = verificationChecks.filter((c) => c.result === "Warning").length;

  const handleReject = async () => {
    try {
      await cancelOffer.mutateAsync(offer.id);
      toast.success(`${offer.number} rejected`);
    } catch (err) {
      toastApiError(err, "Failed to reject offer");
    }
  };

  const canRate = offer.status === "Draft";
  const canQuote = offer.status === "Draft";
  const canIssuePolicy = offer.status === "Quoted" && !offer.policyId;

  const handleIssueOfferPolicy = async () => {
    try {
      setIssuancePending("issue");
      const issued = await issueOfferPolicy.mutateAsync({ offerId: offer.id });
      const policyId = issued.policy?.id;
      toast.success(policyId ? `Policy ${policyId} issued` : "Policy issued");
      if (policyId) navigate(`/policies/${policyId}`);
    } catch (err) {
      toastApiError(err, "Failed to issue policy");
    } finally {
      setIssuancePending(null);
    }
  };

  const handleRateOffer = async () => {
    try {
      setIssuancePending("rate");
      await rateOffer.mutateAsync(offer.id);
      toast.success("Offer rated");
      void refetchPremiumPreview();
    } catch (err) {
      toastApiError(err, "Failed to rate offer");
    } finally {
      setIssuancePending(null);
    }
  };

  const handleQuoteOffer = async () => {
    try {
      setIssuancePending("quote");
      await quoteOffer.mutateAsync(offer.id);
      toast.success("Offer quoted");
    } catch (err) {
      toastApiError(err, "Failed to quote offer");
    } finally {
      setIssuancePending(null);
    }
  };

  const handleRecalculate = async () => {
    try {
      await refetchPremiumPreview();
      toast.success("Premium preview updated");
    } catch (err) {
      toastApiError(err, "Failed to preview premium");
    }
  };

  const handleRequestDiscount = async () => {
    if (!discountDialogOpen) return;
    const pct = Number(discountPct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error("Enter a discount between 0 and 100%");
      return;
    }
    if (!discountReason.trim()) {
      toast.error("Reason is required");
      return;
    }
    const reason = discountReason.trim().slice(0, REASON_MAX_LENGTH);
    const seq = Number(discountPeriod);
    try {
      await requestDiscount.mutateAsync({
        offerId: offer.id,
        body: {
          requestedDiscountPercentage: pct / 100,
          reason,
          ...(Number.isInteger(seq) && seq > 0 ? { targetPeriodSequence: seq } : {}),
        },
      });
      toast.success("Discount requested");
      setDiscountDialogOpen(false);
      setDiscountPct("50");
      setDiscountReason("");
      setDiscountPeriod("");
    } catch (err) {
      toastApiError(err, "Failed to request discount");
    }
  };

  const handleApproveDiscount = async (requestId: string) => {
    try {
      await approveDiscount.mutateAsync({
        offerId: offer.id,
        requestId,
      });
      toast.success("Discount request approved");
    } catch (err) {
      toastApiError(err, "Failed to approve discount");
    }
  };

  const handleRejectDiscount = async (requestId: string) => {
    try {
      await rejectDiscount.mutateAsync({
        offerId: offer.id,
        requestId,
      });
      toast.success("Discount request rejected");
    } catch (err) {
      toastApiError(err, "Failed to reject discount");
    }
  };

  const handleApproveDocument = async () => {
    if (!pendingDocApprove) return;
    try {
      await acceptDocument.mutateAsync({
        offerId: offer.id,
        requirementId: pendingDocApprove.requirementId,
      });
      toast.success(`Document approved: ${pendingDocApprove.label}`);
      setPendingDocApprove(null);
    } catch (err) {
      toastApiError(err, "Failed to approve document");
    }
  };

  const handleRejectDocument = async () => {
    if (!docRejectDialog) return;
    if (!docRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      await refuseDocument.mutateAsync({
        offerId: offer.id,
        requirementId: docRejectDialog.requirementId,
        body: { reason: docRejectReason.trim().slice(0, REASON_MAX_LENGTH) },
      });
      toast.success(`Document rejected: ${docRejectDialog.label}`);
      setDocRejectDialog(null);
      setDocRejectReason("");
    } catch (err) {
      toastApiError(err, "Failed to reject document");
    }
  };

  const handleWaiveDocument = async () => {
    if (!docWaiveDialog) return;
    if (!docWaiveReason.trim()) {
      toast.error("Waiver reason is required");
      return;
    }
    try {
      await waiveDocument.mutateAsync({
        offerId: offer.id,
        requirementId: docWaiveDialog.requirementId,
        body: { reason: docWaiveReason.trim().slice(0, REASON_MAX_LENGTH) },
      });
      toast.success(`Document waived: ${docWaiveDialog.label}`);
      setDocWaiveDialog(null);
      setDocWaiveReason("");
    } catch (err) {
      toastApiError(err, "Failed to waive document");
    }
  };

  const handleSubmitDocument = async () => {
    if (!docSubmitDialog) return;
    if (!docSubmitFile) {
      toast.error("Choose a file to upload");
      return;
    }
    try {
      setDocSubmitPending(true);
      const uploaded = await createDocument(
        buildCreateDocumentFormData(docSubmitFile, docSubmitFile.name)
      );
      if (!uploaded.id) throw new Error("Upload did not return a document id");
      await submitDocument.mutateAsync({
        offerId: offer.id,
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

  const handleConfirmFlagAction = async () => {
    if (!pendingFlagAction) return;
    try {
      if (pendingFlagAction.kind === "approve") {
        await approveReviewFlag.mutateAsync({
          offerId: offer.id,
          flagId: pendingFlagAction.flagId,
        });
        toast.success(`Review flag approved: ${pendingFlagAction.label}`);
      } else {
        await rejectReviewFlag.mutateAsync({
          offerId: offer.id,
          flagId: pendingFlagAction.flagId,
        });
        toast.success(`Review flag rejected: ${pendingFlagAction.label}`);
      }
      setPendingFlagAction(null);
    } catch (err) {
      toastApiError(
        err,
        pendingFlagAction.kind === "approve"
          ? "Failed to approve review flag"
          : "Failed to reject review flag"
      );
    }
  };

  const flagActionPending = approveReviewFlag.isPending || rejectReviewFlag.isPending;

  const canReject =
    offer.status !== "Bound" &&
    offer.status !== "Cancelled" &&
    offer.status !== "Expired";

  const discountActionPending = approveDiscount.isPending || rejectDiscount.isPending;

  const pageBusy =
    cancelOffer.isPending || issuancePending != null || discountActionPending;
  const pageBusyLabel =
    issuancePending === "issue"
      ? "Issuing policy…"
      : issuancePending === "rate"
        ? "Rating offer…"
        : issuancePending === "quote"
          ? "Quoting offer…"
          : cancelOffer.isPending
            ? "Rejecting offer…"
            : approveDiscount.isPending
              ? "Approving discount…"
              : rejectDiscount.isPending
                ? "Rejecting discount…"
                : "Working…";

  const confirmCopy =
    confirmAction === "reject"
      ? {
          title: "Reject this offer?",
          description: `${offer.number} will be marked as Cancelled.`,
          confirmLabel: "Reject offer",
          destructive: true,
        }
      : confirmAction === "rate"
        ? {
            title: "Rate this offer?",
            description: "This will calculate premium and coverages from the current parties and loan balances.",
            confirmLabel: "Rate offer",
            destructive: false,
          }
        : confirmAction === "quote"
          ? {
              title: "Quote this offer?",
              description: "This will lock the quotation so the offer can be issued.",
              confirmLabel: "Quote offer",
              destructive: false,
            }
        : confirmAction === "issue"
          ? {
              title: "Issue policy?",
              description: "This will convert the quoted offer into a policy.",
              confirmLabel: "Issue policy",
              destructive: false,
            }
          : null;

  const discountConfirmCopy = discountConfirm
    ? discountConfirm.kind === "approve"
      ? {
          title: "Approve discount request?",
          description: `Approve the ${discountConfirm.pctLabel} discount.`,
          confirmLabel: "Approve",
          destructive: false,
        }
      : {
          title: "Reject discount request?",
          description: `Reject the ${discountConfirm.pctLabel} discount.`,
          confirmLabel: "Reject",
          destructive: true,
        }
    : null;

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "reject") void handleReject();
    else if (action === "rate") void handleRateOffer();
    else if (action === "quote") void handleQuoteOffer();
    else if (action === "issue") void handleIssueOfferPolicy();
  };

  const handleConfirmDiscountAction = () => {
    if (!discountConfirm) return;
    const { kind, requestId } = discountConfirm;
    setDiscountConfirm(null);
    if (kind === "approve") void handleApproveDiscount(requestId);
    else void handleRejectDiscount(requestId);
  };

  return (
    <AppShell>
      {pageBusy ? <OverlayLoader label={pageBusyLabel} /> : null}

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/offers")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Offers
        </Button>
      </div>

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
            {product?.name ?? offer.productId} · created {offer.createdDate}
            {offer.quotedOnUtc ? ` · quoted ${formatOfferDateTime(offer.quotedOnUtc)}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleRecalculate()}
            disabled={premiumPreviewLoading}
          >
            <RefreshCw className={`h-4 w-4 ${premiumPreviewLoading ? "animate-spin" : ""}`} />
            Preview Premium
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!canRate || pageBusy}
            onClick={() => setConfirmAction("rate")}
          >
            <Calculator className="h-4 w-4" />
            Rate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!canQuote || pageBusy}
            onClick={() => setConfirmAction("quote")}
          >
            Quote
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={!canReject || pageBusy}
            onClick={() => setConfirmAction("reject")}
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button
            size="sm"
            className="gap-2"
            disabled={!canIssuePolicy || pageBusy}
            onClick={() => setConfirmAction("issue")}
          >
            <Send className="h-4 w-4" />
            Issue policy
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open && !pageBusy) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pageBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pageBusy}
              className={
                confirmCopy?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
            >
              {confirmCopy?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={discountConfirm != null}
        onOpenChange={(open) => {
          if (!open && !pageBusy) setDiscountConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{discountConfirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {discountConfirmCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pageBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pageBusy}
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

      {offer.policyId ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm">
            This offer has been issued as policy{" "}
            <Link to={`/policies/${offer.policyId}`} className="font-mono text-primary hover:underline">
              {offer.policyId}
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Pay Premium</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {premiumPreviewLoading && !premiumPreview && offer.offerYears.length === 0
                ? "…"
                : fmtMoney(
                    offer.offerYears.length > 0
                      ? offer.premium || 0
                      : premiumPreview
                        ? previewPremiumTotal
                        : offer.premium || 0,
                    offer.currency,
                  )}
            </div>
            {offer.offerYears.length === 0 && premiumPreview && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Preview · not committed
              </div>
            )}
            {offer.offerYears.length === 0 && premiumPreviewError && (
              <div className="text-[11px] text-destructive mt-0.5">
                {premiumPreviewErr instanceof Error
                  ? premiumPreviewErr.message
                  : "Preview unavailable"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Currency</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{offer.currency}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Periods</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {offer.offerYears.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {offer.offerYears.length === 1 ? "period" : "periods"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Term</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{offer.termYears} years</div></CardContent>
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
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="summary" className="gap-1.5"><Package className="h-3.5 w-3.5" />Summary</TabsTrigger>
          <TabsTrigger value="years" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Periods</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Percent className="h-3.5 w-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="people" className="gap-1.5"><Users className="h-3.5 w-3.5" />People</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Product & Coverage</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Name" value={product?.name} />
                <Field
                  label="Policy plan"
                  value={
                    offer.policyPlan
                      ? policyPlanTypeLabel(offer.policyPlan)
                      : product?.policyPlanType
                        ? policyPlanTypeLabel(product.policyPlanType)
                        : undefined
                  }
                />
                <Field
                  label="Requires loan balances"
                  value={offer.requiresLoanBalances ? "Yes" : "No"}
                />
                {offer.renewedFromPolicyId ? (
                  <Field
                    label="Renewed from policy"
                    value={
                      <Link
                        to={`/policies/${offer.renewedFromPolicyId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {offer.renewedFromPolicyId}
                      </Link>
                    }
                  />
                ) : null}
                <Field
                  label="Printable template"
                  value={
                    templateDocumentId ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate" title={templateDocument?.originalFileName}>
                          {templateDocument?.originalFileName ??
                            templateDocument?.storedFileName ??
                            "Loading…"}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          className="h-7 w-7 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Download template"
                          onClick={() => {
                            void downloadDocumentFile(
                              templateDocumentId,
                              templateDocument?.originalFileName ??
                                templateDocument?.storedFileName,
                            ).catch((err) =>
                              toastApiError(err, "Failed to download file"),
                            );
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
                <div className="col-span-2">
                  <Field
                    label="Coverage text"
                    value={
                      product?.coverageText?.trim() ? (
                        <span className="whitespace-pre-wrap font-normal">{product.coverageText}</span>
                      ) : undefined
                    }
                  />
                </div>
                <Field
                  label="Currency"
                  value={paymentMethod?.currency ?? offer.currency}
                />
                <Field
                  label="Bank"
                  value={
                    paymentBankAccount
                      ? [paymentBankAccount.bankName, paymentBankAccount.iban || paymentBankAccount.accountNumber]
                          .filter(Boolean)
                          .join(" · ") || paymentBankAccountId
                      : paymentBankAccountId || undefined
                  }
                />
                <div className="col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Offer Year Coverages</div>
                  {yearCoverages.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No coverages on this offer yet.</span>
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
                          {yearCoverages.map((c) => (
                            <TableRow key={c.id || c.coverageId}>
                              <TableCell>
                                <div className="text-sm font-medium">
                                  {coverageNameById[c.coverageId] ?? c.coverageId}
                                </div>
                                <div className="font-mono text-[11px] text-muted-foreground">{c.coverageId}</div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtMoney(c.sumInsured, offer.currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                {formatRate(c.rateUsed, offer.currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                {c.ratingTableMultiplierUsed != null
                                  ? c.ratingTableMultiplierUsed
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {fmtMoney(c.calculatedPremium, offer.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Policy Period</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Start Date" value={<span className="font-mono text-xs">{formatOfferDate(offer.startDate)}</span>} />
                <Field label="End Date" value={<span className="font-mono text-xs">{formatOfferDate(offer.endDate)}</span>} />
                <Field label="Term" value={`${offer.termYears} years`} />
                {offer.quotedOnUtc ? (
                  <Field
                    label="Quoted"
                    value={<span className="font-mono text-xs">{formatOfferDateTime(offer.quotedOnUtc)}</span>}
                  />
                ) : null}
                {(offer.loanDisbursements.length > 0 || offer.loanSubmissions.length > 0) && (
                  <div className="col-span-2 mt-2 pt-3 border-t space-y-3">
                    {offer.loanSubmissions.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Loan submissions
                        </div>
                        {offer.loanSubmissions.map((sub) => (
                          <div key={sub.id} className="text-sm">
                            <span className="font-medium">{sub.sourceSystem || "—"}</span>
                            {sub.externalReference ? (
                              <span className="text-muted-foreground"> · {sub.externalReference}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    {offer.loanDisbursements.length > 0 && (
                      <>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Loan balances ({offer.loanDisbursements.length} periods)
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Period start</TableHead>
                            <TableHead>Period end</TableHead>
                            <TableHead className="text-right">Opening</TableHead>
                            <TableHead className="text-right">Closing</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {offer.loanDisbursements.map((loan, idx) => (
                            <TableRow key={loan.id || idx}>
                              <TableCell className="font-mono">{loan.year || "—"}</TableCell>
                              <TableCell className="font-mono">{loan.startDate || "—"}</TableCell>
                              <TableCell className="font-mono">{loan.endDate || "—"}</TableCell>
                              <TableCell className="text-right">
                                {fmtMoney(loan.remainingLoanAmount, offer.currency)}
                              </TableCell>
                              <TableCell className="text-right">
                                {loan.closingBalance != null
                                  ? fmtMoney(loan.closingBalance, offer.currency)
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  insuredPerson ? (
                    <PartyLink
                      partyId={insuredPerson.personId}
                      partyType="person"
                      displayName={[insuredPerson.firstName, insuredPerson.lastName].filter(Boolean).join(" ") || insuredPerson.personalIdentifier}
                    />
                  ) : "—"
                }
              />
              <Field
                label="Payer / Invoice Recipient"
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

          <Card>
            <CardHeader><CardTitle className="text-base">Sales attribution</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Channel"
                value={
                  offer.salesChannel ? (
                    <Badge variant="outline">{salesChannelLabel(offer.salesChannel)}</Badge>
                  ) : undefined
                }
              />
              <Field label="Sales party" value={offer.salesPartyName} />
              <Field label="Agent" value={offer.salesAgentName} />
              <Field label="Partner" value={offer.salesPartnerName} />
              <Field label="Office" value={offer.salesOfficeName} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="years" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverage periods</CardTitle>
              <CardDescription>
                Rated periods for this offer. Rate the offer to persist premium amounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offer.offerYears.length === 0 ? (
                premiumPreview && premiumPreview.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Premium preview (not committed). Rate the offer to persist these amounts.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Insured Amount</div>
                        <div className="text-lg font-semibold font-mono mt-1">
                          {fmtMoney(previewInsuredTotal, offer.currency)}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Pay Premium</div>
                        <div className="text-lg font-semibold font-mono text-primary mt-1">
                          {fmtMoney(previewPremiumTotal, offer.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    {premiumPreviewLoading
                      ? "Loading premium preview…"
                      : premiumPreviewError
                        ? "Premium preview unavailable — add parties and loan balances, then rate the offer."
                        : "No periods on this offer yet."}
                  </div>
                )
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[70px]">#</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                        <TableHead className="text-right">Pay Premium</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Coverages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offer.offerYears.map((s) => (
                        <TableRow key={s.id || s.year}>
                          <TableCell className="font-mono">{s.year}</TableCell>
                          <TableCell className="font-mono text-xs">{formatOfferDate(s.startDate)}</TableCell>
                          <TableCell className="font-mono text-xs">{formatOfferDate(s.endDate)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.openingBalance != null ? fmtMoney(s.openingBalance, offer.currency) : fmtMoney(s.insuredAmount, offer.currency)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.closingBalance != null ? fmtMoney(s.closingBalance, offer.currency) : "—"}
                          </TableCell>
                          <TableCell
                            className="text-right font-mono text-sm font-semibold"
                            title={`Calculated premium ${fmtMoney(s.premium, offer.currency)}`}
                          >
                            {fmtMoney(s.payPremium, offer.currency)}
                            {s.payPremium !== s.premium && (
                              <div className="text-[11px] font-normal text-muted-foreground">
                                calc. {fmtMoney(s.premium, offer.currency)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={periodStatusClass(s.internalStatus)}
                            >
                              {periodStatusLabel(s.internalStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.coverages.length}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/40 font-medium">
                        <TableCell colSpan={5} className="text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                          {fmtMoney(
                            offer.offerYears.reduce((sum, s) => sum + s.payPremium, 0),
                            offer.currency
                          )}
                        </TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Underwriting</CardTitle>
              <CardDescription>
                Document requirements and review flags for this offer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <OfferDocumentsPanel
                documents={offer.documentRequirements}
                reviewFlags={offer.reviewFlags}
                documentTypeNameById={documentTypeNameById}
                docActionPending={
                  acceptDocument.isPending ||
                  refuseDocument.isPending ||
                  waiveDocument.isPending ||
                  docSubmitPending
                }
                flagActionPending={flagActionPending}
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
                onApproveFlag={(flagId) => {
                  const flag = offer.reviewFlags.find((f) => f.id === flagId);
                  setPendingFlagAction({
                    kind: "approve",
                    flagId,
                    label: flag?.type?.trim() || flagId,
                  });
                }}
                onRejectFlag={(flagId) => {
                  const flag = offer.reviewFlags.find((f) => f.id === flagId);
                  setPendingFlagAction({
                    kind: "reject",
                    flagId,
                    label: flag?.type?.trim() || flagId,
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

          <Dialog
            open={discountDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                                setDiscountDialogOpen(false);
                setDiscountPct("50");
                setDiscountReason("");
                setDiscountPeriod("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request discount</DialogTitle>
                <DialogDescription>
                  Submit a discount request for this offer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="discount-pct">Discount percentage</Label>
                  <div className="relative">
                    <Input
                      id="discount-pct"
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
                  <Label htmlFor="discount-period">Target period sequence</Label>
                  <Input
                    id="discount-period"
                    type="number"
                    min={1}
                    step={1}
                    value={discountPeriod}
                    onChange={(e) => setDiscountPeriod(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount-reason">Reason</Label>
                  <Textarea
                    id="discount-reason"
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
                <Button
                  variant="outline"
                  onClick={() => setDiscountDialogOpen(false)}
                  disabled={requestDiscount.isPending}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleRequestDiscount()} disabled={requestDiscount.isPending}>
                  {requestDiscount.isPending ? "Submitting…" : "Submit request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!pendingDocApprove}
            onOpenChange={(open) => !open && setPendingDocApprove(null)}
          >
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
                    void handleApproveDocument();
                  }}
                >
                  {acceptDocument.isPending ? "Approving…" : "Approve"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={!!pendingFlagAction}
            onOpenChange={(open) => !open && setPendingFlagAction(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingFlagAction?.kind === "reject" ? "Reject review flag?" : "Approve review flag?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingFlagAction?.kind === "reject" ? "Reject" : "Approve"}{" "}
                  <span className="font-medium text-foreground">{pendingFlagAction?.label}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={flagActionPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={flagActionPending}
                  className={
                    pendingFlagAction?.kind === "reject"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirmFlagAction();
                  }}
                >
                  {flagActionPending
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
                <DialogDescription>
                  Provide a reason for rejecting this document requirement.
                </DialogDescription>
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
                  onClick={() => void handleRejectDocument()}
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
                <DialogDescription>
                  Upload a file to submit for this requirement.
                </DialogDescription>
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
                  <p className="text-xs text-muted-foreground truncate">
                    Selected: {docSubmitFile.name}
                  </p>
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
                <Button
                  onClick={() => void handleSubmitDocument()}
                  disabled={docSubmitPending || !docSubmitFile}
                >
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
                <DialogDescription>
                  Provide a reason for waiving this document requirement.
                </DialogDescription>
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
                  onClick={() => void handleWaiveDocument()}
                  disabled={waiveDocument.isPending || !docWaiveReason.trim()}
                >
                  {waiveDocument.isPending ? "Waiving…" : "Waive"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <TabsContent value="discounts" className="mt-4">
          {(() => {
            const discountRows = offer.discountRequests;
            return (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Discount Requests</CardTitle>
                    <CardDescription>
                      Discount requests on this offer.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={offer.status === "Bound" || offer.status === "Cancelled"}
                    onClick={() => {
                      setDiscountPct("50");
                      setDiscountReason("");
                      setDiscountPeriod("");
                      setDiscountDialogOpen(true);
                    }}
                  >
                    <Percent className="h-3.5 w-3.5" /> Request Discount
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">Period</TableHead>
                          <TableHead className="text-center">Discount</TableHead>
                          <TableHead className="text-center">Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discountRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                              No discount requests on this offer.
                            </TableCell>
                          </TableRow>
                        ) : (
                          discountRows.map((r) => {
                            const canAct = r.status === "requested";
                            return (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono">
                                  {r.targetPeriodSequence ?? "—"}
                                </TableCell>
                                <TableCell className="text-center font-mono text-sm font-semibold min-w-[320px]">
                                  {formatDiscountPct(r.requestedDiscountPercentage)}
                                </TableCell>
                                <TableCell className="text-sm text-center min-w-[320px]">
                                  {r.reason || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={discountStatusClass(r.status)}
                                  >
                                    {discountStatusLabel(r.status)}
                                  </Badge>
                                  {r.requestedOnUtc ? (
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      {formatOfferDateTime(r.requestedOnUtc)}
                                    </div>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 h-8 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                                      disabled={!canAct || pageBusy}
                                      onClick={() =>
                                        setDiscountConfirm({
                                          kind: "approve",
                                          requestId: r.id,
                                          pctLabel: formatDiscountPct(r.requestedDiscountPercentage) ?? "",
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="gap-1.5 h-8 text-destructive hover:text-destructive"
                                      disabled={!canAct || pageBusy}
                                      onClick={() =>
                                        setDiscountConfirm({
                                          kind: "reject",
                                          requestId: r.id,
                                          pctLabel: formatDiscountPct(r.requestedDiscountPercentage) ?? "",
                                        })
                                      }
                                    >
                                      <XCircle className="h-3.5 w-3.5" /> Reject
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
            );
          })()}
        </TabsContent>

        <TabsContent value="people" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policy Holder</CardTitle>
                <CardDescription>Owner of the policy</CardDescription>
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
                    <Field label="Identifier" value={<span className="font-mono text-xs">{holder.uniqueIdentifier}</span>} />
                    <Field label="Party Type" value={titleCase(holder.partyType)} />
                    <Field label="Country" value={countryLabel(holder.countryCode)} />
                    <Field label="Relationship" value={relationshipLabel(holder.relationshipToInsured)} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insured Person</CardTitle>
                <CardDescription>Life being insured</CardDescription>
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
                          displayName={[insuredPerson.firstName, insuredPerson.lastName].filter(Boolean).join(" ")}
                        />
                      }
                    />
                    <Field
                      label="Personal ID"
                      value={<span className="font-mono text-xs">{insuredPerson.personalIdentifier}</span>}
                    />
                    <Field
                      label="DOB / Age"
                      value={
                        insuredPerson.dateOfBirth
                          ? `${insuredPerson.dateOfBirth} (${ageFromDob(insuredPerson.dateOfBirth)} yrs)`
                          : "—"
                      }
                    />
                    <Field label="Gender" value={titleCase(insuredPerson.gender)} />
                    <Field label="Country" value={countryLabel(insuredPerson.countryCode)} />
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
                    <Field label="Identifier" value={<span className="font-mono text-xs">{payer.uniqueIdentifier}</span>} />
                    <Field label="Party Type" value={titleCase(payer.partyType)} />
                    <Field label="Country" value={countryLabel(payer.countryCode)} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>
          </div>

          {offer.insuredPersons.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Insured Persons</CardTitle>
                <CardDescription>{offer.insuredPersons.length} insured persons on this offer.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>DOB</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offer.insuredPersons.map((ip) => {
                        const name = [ip.firstName, ip.lastName].filter(Boolean).join(" ");
                        return (
                          <TableRow key={ip.id}>
                            <TableCell>
                              <PartyLink partyId={ip.personId} partyType="person" displayName={name} />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{ip.personalIdentifier ?? "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{ip.dateOfBirth ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiaries</CardTitle>
              <CardDescription>
                {offer.beneficiaries.length} beneficiaries
                {offer.beneficiaries.length > 0
                  ? `, total split ${offer.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%.`
                  : "."}
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
                      <TableHead>Relationship</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                          No beneficiaries assigned to this offer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {offer.beneficiaries.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              <PartyLink
                                partyId={b.customerId}
                                partyType={b.partyType}
                                displayName={b.displayName}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{b.uniqueIdentifier ?? "—"}</TableCell>
                            <TableCell>{titleCase(b.partyType) ?? "—"}</TableCell>
                            <TableCell>{relationshipLabel(b.relationship)}</TableCell>
                            <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40">
                          <TableCell colSpan={4} className="font-medium text-sm">Total</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {offer.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%
                          </TableCell>
                        </TableRow>
                      </>
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

export default OfferDetail;
