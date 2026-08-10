import { useMemo, useState, Fragment } from "react";
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
  Edit,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Users,
  FileText,
  // StickyNote,
  Package,
  AlertTriangle,
  Trash2,
  Percent,
  Upload,
  ChevronRight,
  ChevronDown,
  Download,
  Calculator,
  Loader2,
} from "lucide-react";
import { getOffer, statusColor } from "@/data/offers";
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
  useCalculateOfferSchedules,
  usePreviewOfferPremium,
  useRemoveOfferInsuredPerson,
  useRemoveOfferParticipant,
  useCancelOfferSchedule,
  useRequestOfferScheduleDiscount,
  useApproveOfferScheduleDiscount,
  useRejectOfferScheduleDiscount,
  useApproveOfferScheduleDocument,
  useRejectOfferScheduleDocument,
  useSubmitOfferScheduleDocument,
  useListOfferScheduleDocuments,
  useApproveOfferScheduleReviewFlag,
  useRejectOfferScheduleReviewFlag,
  useIssueOfferPolicy,
  useRenewOffer,
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
import { customerPath } from "@/api/adapters/customers";

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;

const scheduleStatusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const discountRequestStatusColor: Record<string, string> = {
  requested: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

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
    case "accepted":
      return <Badge variant="default" className="bg-emerald-600">Accepted</Badge>;
    case "submitted":
      return <Badge variant="secondary">Submitted</Badge>;
    case "refused":
      return <Badge variant="destructive">Refused</Badge>;
    default:
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 mr-1" /> Required
        </Badge>
      );
  }
};

type ScheduleDocAction = {
  requirementId: string;
  year: number;
  label: string;
};

const ScheduleExpandedPanel = ({
  offerId,
  year,
  reviewFlags,
  documentTypeNameById,
  docActionPending,
  flagActionPending,
  onSubmit,
  onApprove,
  onReject,
  onApproveFlag,
  onRejectFlag,
}: {
  offerId: string;
  year: number;
  reviewFlags: {
    id: string;
    type: string;
    reason: string;
    status: string;
  }[];
  documentTypeNameById: Record<string, string>;
  docActionPending: boolean;
  flagActionPending: boolean;
  onSubmit: (args: ScheduleDocAction) => void;
  onApprove: (args: ScheduleDocAction) => void;
  onReject: (args: ScheduleDocAction) => void;
  onApproveFlag: (flagId: string) => void;
  onRejectFlag: (flagId: string) => void;
}) => {
  const { data, isLoading, isError, error } = useListOfferScheduleDocuments(
    offerId,
    String(year)
  );

  const documents = useMemo(
    () =>
      (data ?? []).map((d) => ({
        id: String(d.id ?? ""),
        documentId: d.documentId ?? null,
        documentTypeId: d.documentTypeId ?? "",
        status: d.status ?? ("required" as const),
        refusalReason: d.refusalReason ?? null,
      })),
    [data]
  );

  const scheduleChecks = useMemo(
    () => mapReviewFlagsToChecks(reviewFlags),
    [reviewFlags]
  );

  return (
    <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x border-t bg-muted/20">
      <div className="p-4 space-y-3 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Documents</h4>
        </div>
        {isLoading ? (
          <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : isError ? (
          <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load documents"}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            No documents on this schedule.
          </div>
        ) : (
          <div className="grid gap-2">
            {documents.map((d) => {
              const label =
                documentTypeNameById[d.documentTypeId] ?? d.documentTypeId;
              const canSubmit = d.status === "required" || d.status === "refused";
              const canReview = d.status === "submitted";
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
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {d.refusalReason ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Refusal: </span>
                        {d.refusalReason}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        disabled={!canSubmit || docActionPending || !d.id}
                        onClick={() =>
                          onSubmit({
                            requirementId: d.id,
                            year,
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
                            year,
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
                            year,
                            label,
                          })
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
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
            checks={scheduleChecks}
            actionPending={flagActionPending}
            onApprove={onApproveFlag}
            onReject={onRejectFlag}
          />
        </div>
      </div>
    </div>
  );
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apiOffer, isLoading } = useGetOffer(id ?? "", { enabled: Boolean(id) });
  const {
    data: premiumPreview,
    isFetching: premiumPreviewLoading,
    isError: premiumPreviewError,
    error: premiumPreviewErr,
    refetch: refetchPremiumPreview,
  } = usePreviewOfferPremium(id ?? "", { enabled: Boolean(id) });
  const cancelOffer = useCancelOffer();
  const calculateSchedules = useCalculateOfferSchedules();
  const removeInsuredPerson = useRemoveOfferInsuredPerson();
  const removeParticipant = useRemoveOfferParticipant();
  const cancelSchedule = useCancelOfferSchedule();
  const requestDiscount = useRequestOfferScheduleDiscount();
  const approveDiscount = useApproveOfferScheduleDiscount();
  const rejectDiscount = useRejectOfferScheduleDiscount();
  const approveScheduleDocument = useApproveOfferScheduleDocument();
  const rejectScheduleDocument = useRejectOfferScheduleDocument();
  const submitScheduleDocument = useSubmitOfferScheduleDocument();
  const approveReviewFlag = useApproveOfferScheduleReviewFlag();
  const rejectReviewFlag = useRejectOfferScheduleReviewFlag();
  const issueOfferPolicy = useIssueOfferPolicy();
  const renewOffer = useRenewOffer();
  const { data: coveragesPage } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: documentTypesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });

  const previewPremiumTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.premium, 0),
    [premiumPreview],
  );
  const previewInsuredTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.insuredAmount, 0),
    [premiumPreview],
  );

  const [pendingRemove, setPendingRemove] = useState<
    | { kind: "insured"; id: string; label: string }
    | { kind: "participant"; id: string; label: string }
    | null
  >(null);
  const [cancelScheduleYear, setCancelScheduleYear] = useState<number | null>(null);
  const [discountDialog, setDiscountDialog] = useState<{ year: number } | null>(null);
  const [discountPct, setDiscountPct] = useState("50");
  const [discountReason, setDiscountReason] = useState("");
  const [docRejectDialog, setDocRejectDialog] = useState<{
    requirementId: string;
    year: number;
    label: string;
  } | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docSubmitDialog, setDocSubmitDialog] = useState<{
    requirementId: string;
    year: number;
    label: string;
  } | null>(null);
  const [docSubmitFile, setDocSubmitFile] = useState<File | null>(null);
  const [docSubmitPending, setDocSubmitPending] = useState(false);
  const [pendingDocApprove, setPendingDocApprove] = useState<{
    requirementId: string;
    year: number;
    label: string;
  } | null>(null);
  const [pendingFlagAction, setPendingFlagAction] = useState<{
    kind: "approve" | "reject";
    flagId: string;
    year: number;
    label: string;
  } | null>(null);
  const [expandedScheduleYears, setExpandedScheduleYears] = useState<Set<number>>(
    () => new Set()
  );
  const [issuancePending, setIssuancePending] = useState<"issue" | "renew" | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<"reject" | "renew" | "issue" | null>(
    null
  );
  const [discountConfirm, setDiscountConfirm] = useState<{
    kind: "approve" | "reject";
    year: number;
    requestId: string;
    pctLabel: string;
  } | null>(null);

  const toggleScheduleExpanded = (year: number) => {
    setExpandedScheduleYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

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
    return id ? getOffer(id) : undefined;
  }, [apiOffer, id]);

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
    product?.paymentMethods?.find((pm) => pm.currency === offer?.currency) ??
    product?.paymentMethods?.[0];
  const paymentBankAccountId = paymentMethod?.bankAccountId?.trim() || "";
  const { data: paymentBankAccount } = useGetBankAccount(paymentBankAccountId, {
    enabled: Boolean(paymentBankAccountId),
  });

  // const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold">Loading offer…</h1>
        </div>
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
  const scheduleCoverages = offer.schedules.flatMap((s) => s.coverages);

  const verificationChecks: VerificationCheck[] = offer.schedules.flatMap((s) =>
    mapReviewFlagsToChecks(s.reviewFlags)
  );
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

  const issuePolicyBody = product?.defaultPrintableTemplateDocumentId
    ? { printableTemplateDocumentId: product.defaultPrintableTemplateDocumentId }
    : undefined;

  const issuanceMode = product?.issuanceMode ?? null;

  const orderedSchedules = [...offer.schedules]
    .filter((s) => s.internalStatus !== "cancelled")
    .sort((a, b) => a.year - b.year);

  const isScheduleApproved = (s: (typeof orderedSchedules)[number]) =>
    Boolean(s.policyId) || s.internalStatus === "active";

  const firstScheduleApproved = orderedSchedules[0]
    ? isScheduleApproved(orderedSchedules[0])
    : false;

  /** wholeOfTerm: issue once only, no renew. annualRenewable: issue then renew. */
  const isWholeOfTerm = issuanceMode === "wholeOfTerm";
  const showRenewButton = !isWholeOfTerm;
  const canIssuePolicy = !firstScheduleApproved;
  const canRenew = showRenewButton && firstScheduleApproved;

  const scheduleIssueTargets = orderedSchedules.filter((s) => !s.policyId);

  const handleIssueOfferPolicy = async () => {
    try {
      setIssuancePending("issue");
      if (issuanceMode === "annualRenewable") {
        const targets =
          scheduleIssueTargets.length > 0 ? scheduleIssueTargets : [null];
        let issued = 0;
        for (const _schedule of targets) {
          await issueOfferPolicy.mutateAsync({
            offerId: offer.id,
            body: issuePolicyBody,
          });
          issued += 1;
        }
        toast.success(
          issued === 1 ? "Policy issued" : `${issued} policies issued`
        );
      } else {
        // wholeOfTerm: single policy issuance only
        await issueOfferPolicy.mutateAsync({
          offerId: offer.id,
          body: issuePolicyBody,
        });
        toast.success("Policy issued");
      }
    } catch (err) {
      toastApiError(err, "Failed to issue policy");
    } finally {
      setIssuancePending(null);
    }
  };

  const handleRenewOffer = async () => {
    try {
      setIssuancePending("renew");
      const targets =
        scheduleIssueTargets.length > 0 ? scheduleIssueTargets : [null];
      let renewed = 0;
      for (const _schedule of targets) {
        await renewOffer.mutateAsync(offer.id);
        renewed += 1;
      }
      toast.success(
        renewed === 1 ? "Renewal issued" : `${renewed} renewals issued`
      );
    } catch (err) {
      toastApiError(err, "Failed to renew");
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

  const handleCommitSchedules = async () => {
    try {
      await calculateSchedules.mutateAsync(offer.id);
      toast.success("Schedules calculated");
      void refetchPremiumPreview();
    } catch (err) {
      toastApiError(err, "Failed to calculate schedules");
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    try {
      if (pendingRemove.kind === "insured") {
        await removeInsuredPerson.mutateAsync({
          offerId: offer.id,
          insuredPersonId: pendingRemove.id,
        });
        toast.success("Insured person removed");
      } else {
        await removeParticipant.mutateAsync({
          offerId: offer.id,
          participantId: pendingRemove.id,
        });
        toast.success("Participant removed");
      }
      setPendingRemove(null);
    } catch (err) {
      toastApiError(err, "Failed to remove");
    }
  };

  const handleCancelSchedule = async () => {
    if (cancelScheduleYear == null) return;
    try {
      await cancelSchedule.mutateAsync({
        offerId: offer.id,
        year: String(cancelScheduleYear),
      });
      toast.success(`Schedule ${cancelScheduleYear} cancelled`);
      setCancelScheduleYear(null);
    } catch (err) {
      toastApiError(err, "Failed to cancel schedule");
    }
  };

  const handleRequestDiscount = async () => {
    if (!discountDialog) return;
    const pct = Number(discountPct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error("Enter a discount between 0 and 100%");
      return;
    }
    if (!discountReason.trim()) {
      toast.error("Reason is required");
      return;
    }
    try {
      await requestDiscount.mutateAsync({
        offerId: offer.id,
        year: String(discountDialog.year),
        body: {
          requestedDiscountPercentage: pct / 100,
          reason: discountReason.trim(),
        },
      });
      toast.success(`Discount requested for schedule ${discountDialog.year}`);
      setDiscountDialog(null);
      setDiscountPct("50");
      setDiscountReason("");
    } catch (err) {
      toastApiError(err, "Failed to request discount");
    }
  };

  const handleApproveDiscount = async (year: number, requestId: string) => {
    try {
      await approveDiscount.mutateAsync({
        offerId: offer.id,
        year: String(year),
        requestId,
      });
      toast.success("Discount request approved");
    } catch (err) {
      toastApiError(err, "Failed to approve discount");
    }
  };

  const handleRejectDiscount = async (year: number, requestId: string) => {
    try {
      await rejectDiscount.mutateAsync({
        offerId: offer.id,
        year: String(year),
        requestId,
      });
      toast.success("Discount request rejected");
    } catch (err) {
      toastApiError(err, "Failed to reject discount");
    }
  };

  const handleApproveScheduleDocument = async () => {
    if (!pendingDocApprove) return;
    try {
      await approveScheduleDocument.mutateAsync({
        offerId: offer.id,
        year: String(pendingDocApprove.year),
        requirementId: pendingDocApprove.requirementId,
      });
      toast.success(`Document approved: ${pendingDocApprove.label}`);
      setPendingDocApprove(null);
    } catch (err) {
      toastApiError(err, "Failed to approve document");
    }
  };

  const handleRejectScheduleDocument = async () => {
    if (!docRejectDialog) return;
    if (!docRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      await rejectScheduleDocument.mutateAsync({
        offerId: offer.id,
        year: String(docRejectDialog.year),
        requirementId: docRejectDialog.requirementId,
        body: { reason: docRejectReason.trim() },
      });
      toast.success(`Document rejected: ${docRejectDialog.label}`);
      setDocRejectDialog(null);
      setDocRejectReason("");
    } catch (err) {
      toastApiError(err, "Failed to reject document");
    }
  };

  const handleSubmitScheduleDocument = async () => {
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
      await submitScheduleDocument.mutateAsync({
        offerId: offer.id,
        year: String(docSubmitDialog.year),
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
          year: String(pendingFlagAction.year),
          flagId: pendingFlagAction.flagId,
        });
        toast.success(`Review flag approved: ${pendingFlagAction.label}`);
      } else {
        await rejectReviewFlag.mutateAsync({
          offerId: offer.id,
          year: String(pendingFlagAction.year),
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

  const removing =
    removeInsuredPerson.isPending || removeParticipant.isPending;

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
      : issuancePending === "renew"
        ? "Renewing…"
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
      : confirmAction === "renew"
        ? {
            title: "Renew this offer?",
            description:
              "This will create a renewal for the next eligible schedule year.",
            confirmLabel: "Renew",
            destructive: false,
          }
        : confirmAction === "issue"
          ? {
              title: "Issue policy?",
              description: isWholeOfTerm
                ? "This will issue the policy for this whole-of-term offer. This can only be done once."
                : issuanceMode === "annualRenewable"
                  ? "This will issue a policy for each eligible schedule on this offer."
                  : "This will issue the initial policy for this offer.",
              confirmLabel: "Issue policy",
              destructive: false,
            }
          : null;

  const discountConfirmCopy = discountConfirm
    ? discountConfirm.kind === "approve"
      ? {
          title: "Approve discount request?",
          description: `Approve the ${discountConfirm.pctLabel} discount for schedule year ${discountConfirm.year}.`,
          confirmLabel: "Approve",
          destructive: false,
        }
      : {
          title: "Reject discount request?",
          description: `Reject the ${discountConfirm.pctLabel} discount for schedule year ${discountConfirm.year}.`,
          confirmLabel: "Reject",
          destructive: true,
        }
    : null;

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "reject") void handleReject();
    else if (action === "renew") void handleRenewOffer();
    else if (action === "issue") void handleIssueOfferPolicy();
  };

  const handleConfirmDiscountAction = () => {
    if (!discountConfirm) return;
    const { kind, year, requestId } = discountConfirm;
    setDiscountConfirm(null);
    if (kind === "approve") void handleApproveDiscount(year, requestId);
    else void handleRejectDiscount(year, requestId);
  };

  return (
    <AppShell>
      {pageBusy ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex min-w-[14rem] flex-col items-center gap-3 rounded-md border bg-card px-6 py-5 shadow-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-sm font-medium text-foreground">{pageBusyLabel}</div>
            <div className="text-xs text-muted-foreground">Please wait…</div>
          </div>
        </div>
      ) : null}

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
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Open editor (demo)")}>
            <Edit className="h-4 w-4" /> Edit Offer
          </Button> */}
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
          {offer.schedules.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void handleCommitSchedules()}
              disabled={calculateSchedules.isPending}
            >
              <Calculator className="h-4 w-4" />
              {calculateSchedules.isPending ? "Calculating…" : "Commit Schedules"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={!canReject || pageBusy}
            onClick={() => setConfirmAction("reject")}
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          {showRenewButton ? (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!canRenew || pageBusy}
              onClick={() => setConfirmAction("renew")}
            >
              <RefreshCw className="h-4 w-4" />
              Renew
            </Button>
          ) : null}
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>Gross Premium</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {premiumPreviewLoading && !premiumPreview && offer.schedules.length === 0
                ? "…"
                : fmtMoney(
                    offer.schedules.length > 0
                      ? offer.premium || 0
                      : premiumPreview
                        ? previewPremiumTotal
                        : offer.premium || 0,
                    offer.currency,
                  )}
            </div>
            {offer.schedules.length === 0 && premiumPreview && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Preview · not committed
              </div>
            )}
            {offer.schedules.length === 0 && premiumPreviewError && (
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
          <CardHeader className="pb-1.5"><CardDescription>Schedules</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {offer.schedules.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {offer.schedules.length === 1 ? "schedule" : "schedules"}
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
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="summary" className="gap-1.5"><Package className="h-3.5 w-3.5" />Summary</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Percent className="h-3.5 w-3.5" />Discount Requests</TabsTrigger>
          <TabsTrigger value="people" className="gap-1.5"><Users className="h-3.5 w-3.5" />People</TabsTrigger>
          {/* <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="h-3.5 w-3.5" />Notes</TabsTrigger> */}
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Product & Coverage</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Name" value={product?.name} />
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
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Schedule Coverages</div>
                  {scheduleCoverages.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No coverages on this offer yet.</span>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Coverage</TableHead>
                            <TableHead className="text-right">Sum Insured</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Premium</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scheduleCoverages.map((c) => (
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
                                {c.rateUsed?.isFlat
                                  ? fmtMoney(c.rateUsed.flatValue ?? 0, c.rateUsed.flatValueCurrency || offer.currency)
                                  : c.rateUsed?.percentageValue != null
                                    ? `${c.rateUsed.percentageValue}%`
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
                <Field label="Start Date" value={<span className="font-mono text-xs">{offer.startDate}</span>} />
                <Field label="End Date" value={<span className="font-mono text-xs">{offer.endDate}</span>} />
                <Field label="Term" value={`${offer.termYears} years`} />
                {offer.loanDisbursements.length > 0 && (
                  <div className="col-span-2 mt-2 pt-3 border-t space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Loan Disbursements ({offer.loanDisbursements.length})
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Period start</TableHead>
                            <TableHead>Period end</TableHead>
                            <TableHead className="text-right">Remaining</TableHead>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Offer Schedules</CardTitle>
              <CardDescription>
                Expand a schedule row to view its documents and verification side by side.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offer.schedules.length === 0 ? (
                premiumPreview && premiumPreview.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Premium preview (not committed). Commit schedules to persist these amounts.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Insured Amount</div>
                        <div className="text-lg font-semibold font-mono mt-1">
                          {fmtMoney(previewInsuredTotal, offer.currency)}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Premium</div>
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
                        ? "Premium preview unavailable — add loan disbursements and an insured person, then retry."
                        : "No schedules calculated for this offer yet."}
                  </div>
                )
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
                        <TableHead className="text-right">Premium</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Coverages</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offer.schedules.map((s) => {
                        const isCancelled = s.internalStatus === "cancelled";
                        const isExpanded = expandedScheduleYears.has(s.year);
                        const docActionPending =
                          approveScheduleDocument.isPending ||
                          rejectScheduleDocument.isPending ||
                          docSubmitPending;

                        return (
                          <Fragment key={s.id || s.year}>
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
                                      ? `Collapse schedule ${s.year}`
                                      : `Expand schedule ${s.year}`
                                  }
                                  aria-expanded={isExpanded}
                                  onClick={() => toggleScheduleExpanded(s.year)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-mono">{s.year}</TableCell>
                              <TableCell className="font-mono text-xs">{s.startDate || "—"}</TableCell>
                              <TableCell className="font-mono text-xs">{s.endDate || "—"}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtMoney(s.insuredAmount, offer.currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {fmtMoney(s.premium, offer.currency)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    scheduleStatusColor[s.internalStatus ?? ""] ??
                                    "bg-muted text-muted-foreground"
                                  }
                                >
                                  {titleCase(s.internalStatus) ?? "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {s.coverages.length}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {s.documents.length}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 h-8 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                                    disabled={isCancelled}
                                    onClick={() => {
                                      setDiscountPct("50");
                                      setDiscountReason("");
                                      setDiscountDialog({ year: s.year });
                                    }}
                                  >
                                    <Percent className="h-3.5 w-3.5" /> Request Discount
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="gap-1.5 h-8 text-destructive hover:text-destructive"
                                    disabled={isCancelled || cancelSchedule.isPending}
                                    onClick={() => setCancelScheduleYear(s.year)}
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Cancel
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {isExpanded && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={10} className="p-0">
                                  <ScheduleExpandedPanel
                                    offerId={offer.id}
                                    year={s.year}
                                    reviewFlags={s.reviewFlags}
                                    documentTypeNameById={documentTypeNameById}
                                    docActionPending={docActionPending}
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
                                    onApproveFlag={(flagId) => {
                                      const flag = s.reviewFlags.find((f) => f.id === flagId);
                                      setPendingFlagAction({
                                        kind: "approve",
                                        flagId,
                                        year: s.year,
                                        label: flag?.type?.trim() || flagId,
                                      });
                                    }}
                                    onRejectFlag={(flagId) => {
                                      const flag = s.reviewFlags.find((f) => f.id === flagId);
                                      setPendingFlagAction({
                                        kind: "reject",
                                        flagId,
                                        year: s.year,
                                        label: flag?.type?.trim() || flagId,
                                      });
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                      <TableRow className="bg-muted/40 font-medium">
                        <TableCell />
                        <TableCell colSpan={3} className="text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmtMoney(
                            offer.schedules.reduce((sum, s) => sum + s.insuredAmount, 0),
                            offer.currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                          {fmtMoney(
                            offer.schedules.reduce((sum, s) => sum + s.premium, 0),
                            offer.currency
                          )}
                        </TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog
            open={cancelScheduleYear != null}
            onOpenChange={(open) => !open && setCancelScheduleYear(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel schedule {cancelScheduleYear}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel the schedule for year {cancelScheduleYear} on this offer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelSchedule.isPending}>Keep schedule</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleCancelSchedule();
                  }}
                  disabled={cancelSchedule.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelSchedule.isPending ? "Cancelling…" : "Cancel schedule"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog
            open={!!discountDialog}
            onOpenChange={(open) => {
              if (!open) {
                setDiscountDialog(null);
                setDiscountPct("50");
                setDiscountReason("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request discount · Year {discountDialog?.year}</DialogTitle>
                <DialogDescription>
                  Submit a discount request for this schedule year.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="discount-pct">Discount percentage</Label>
                  <div className="relative">
                    <Input
                      id="discount-pct"
                      type="number"
                      min={0}
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
                  <Label htmlFor="discount-reason">Reason</Label>
                  <Textarea
                    id="discount-reason"
                    rows={3}
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Why is this discount requested?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDiscountDialog(null)}
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
                  Approve <span className="font-medium text-foreground">{pendingDocApprove?.label}</span> for
                  schedule year {pendingDocApprove?.year}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={approveScheduleDocument.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={approveScheduleDocument.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    void handleApproveScheduleDocument();
                  }}
                >
                  {approveScheduleDocument.isPending ? "Approving…" : "Approve"}
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
                  <span className="font-medium text-foreground">{pendingFlagAction?.label}</span> for
                  schedule year {pendingFlagAction?.year}.
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
                  Provide a reason for rejecting this document requirement (year {docRejectDialog?.year}).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="doc-reject-reason">Reason</Label>
                <Textarea
                  id="doc-reject-reason"
                  rows={4}
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
                  disabled={rejectScheduleDocument.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleRejectScheduleDocument()}
                  disabled={rejectScheduleDocument.isPending || !docRejectReason.trim()}
                >
                  {rejectScheduleDocument.isPending ? "Rejecting…" : "Reject"}
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
                  Upload a file to submit for schedule year {docSubmitDialog?.year}.
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
                  onClick={() => void handleSubmitScheduleDocument()}
                  disabled={docSubmitPending || !docSubmitFile}
                >
                  {docSubmitPending ? "Submitting…" : "Submit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="discounts" className="mt-4">
          {(() => {
            const discountRows = offer.schedules.flatMap((s) =>
              s.discountRequests.map((r) => ({ ...r, scheduleYear: s.year }))
            );
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Discount Requests</CardTitle>
                  <CardDescription>
                    Discount requests attached to offer schedules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[70px]">Year</TableHead>
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
                              <TableRow key={`${r.scheduleYear}-${r.id}`}>
                                <TableCell className="font-mono">{r.scheduleYear}</TableCell>
                                <TableCell className="text-center font-mono text-sm font-semibold min-w-[320px]">
                                  {Math.round(r.requestedDiscountPercentage * 10000) / 100}%
                                </TableCell>
                                <TableCell className="text-sm text-center min-w-[320px]">
                                  {r.reason || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      discountRequestStatusColor[r.status] ??
                                      "bg-muted text-muted-foreground"
                                    }
                                  >
                                    {titleCase(r.status)}
                                  </Badge>
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
                                          year: r.scheduleYear,
                                          requestId: r.id,
                                          pctLabel: `${Math.round(r.requestedDiscountPercentage * 10000) / 100}%`,
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
                                          year: r.scheduleYear,
                                          requestId: r.id,
                                          pctLabel: `${Math.round(r.requestedDiscountPercentage * 10000) / 100}%`,
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
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Policy Holder</CardTitle>
                  <CardDescription>Owner of the policy</CardDescription>
                </div>
                {holder?.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() =>
                      setPendingRemove({
                        kind: "participant",
                        id: holder.id,
                        label: holder.displayName || "policy holder",
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
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
                    <Field label="Country" value={holder.countryCode} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Insured Person</CardTitle>
                  <CardDescription>Life being insured</CardDescription>
                </div>
                {insuredPerson?.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() =>
                      setPendingRemove({
                        kind: "insured",
                        id: insuredPerson.id,
                        label:
                          [insuredPerson.firstName, insuredPerson.lastName].filter(Boolean).join(" ") ||
                          insuredPerson.personalIdentifier ||
                          "insured person",
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
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
                    <Field label="Country" value={insuredPerson.countryCode} />
                    <Field
                      label="PEP Status"
                      value={
                        <Badge
                          variant="outline"
                          className={
                            insuredPerson.isPep
                              ? "border-destructive/40 text-destructive"
                              : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {insuredPerson.isPep ? "Yes" : "No"}
                        </Badge>
                      }
                    />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assigned</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Payer / Invoice Recipient</CardTitle>
                  <CardDescription>Receives invoices, pays premiums</CardDescription>
                </div>
                {payer?.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() =>
                      setPendingRemove({
                        kind: "participant",
                        id: payer.id,
                        label: payer.displayName || "payer",
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
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
                    <Field label="Country" value={payer.countryCode} />
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
                        <TableHead className="w-[100px]" />
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
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                onClick={() =>
                                  setPendingRemove({
                                    kind: "insured",
                                    id: ip.id,
                                    label: name || ip.personalIdentifier || "insured person",
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </Button>
                            </TableCell>
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
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="w-[100px]" />
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
                            <TableCell className="text-right font-mono">{b.percentage}%</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                onClick={() =>
                                  setPendingRemove({
                                    kind: "participant",
                                    id: b.id,
                                    label: b.displayName || "beneficiary",
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40">
                          <TableCell colSpan={3} className="font-medium text-sm">Total</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {offer.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <AlertDialog open={!!pendingRemove} onOpenChange={(open) => !open && setPendingRemove(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingRemove?.kind === "insured" ? "Remove insured person?" : "Remove participant?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{" "}
                  <span className="font-medium text-foreground">{pendingRemove?.label}</span> from this offer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirmRemove();
                  }}
                  disabled={removing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {removing ? "Removing…" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* <TabsContent value="notes" className="mt-4">
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
        </TabsContent> */}
      </Tabs>
    </AppShell>
  );
};

export default OfferDetail;
