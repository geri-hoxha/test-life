import { useEffect, useMemo, useState, Fragment } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { OverlayLoader, PageLoader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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
  Percent,
  Upload,
  Download,
  Calculator,
  Loader2,
  Eye,
  Plus,
  Trash2,
  Building2,
  Clock,
  Handshake,
  Landmark,
  UserRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  statusColor,
  type OfferInsuredPerson,
  type OfferParticipant,
  type OfferYearCoverage,
} from "@/data/offers";
import { ageFromDob } from "@/data/customers";
import {
  VerificationCheck,
  VerificationChecksTable,
  mapReviewFlagsToChecks,
  overallStatus,
} from "./VerificationStep";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-error";
import { buildYearlyLoanPeriodDates } from "@/lib/loan-periods";
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
  useAddOfferParticipant,
  useAddOfferInsuredPerson,
  useRemoveOfferParticipant,
  useRemoveOfferInsuredPerson,
  useSubmitOfferLoan,
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
import { useGetAgent } from "@/api/agents";
import { useGetBankAccount } from "@/api/bank-accounts";
import { customerPath, countryDisplayName } from "@/api/adapters/customers";
import { useGetPerson } from "@/api/people";
import { useGetCompany } from "@/api/companies";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { PersonCombobox } from "@/components/PersonCombobox";
import {
  useCountryEnum,
  useRelationshipToInsuredEnum,
  smartEnumLabel,
} from "@/api/smart-enums";
import type {
  DomainOffersParticipantRole,
  DomainPoliciesRelationshipToInsured,
} from "@/api/types";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import { SAME_AS_INSURED } from "@/hooks/useRelationshipToInsuredOptions";
import { useDocumentPreview } from "@/components/documents/DocumentPreview";
import {
  REASON_MAX_LENGTH,
  agentSelectionMethodLabel,
  discountStatusClass,
  discountStatusLabel,
  documentStatusLabel,
  formatDiscountPct,
  formatOfferDate,
  formatOfferDateTime,
  formatOfferMoney,
  formatRate,
  formatSharePct,
  periodStatusClass,
  periodStatusLabel,
  salesChannelLabel,
  shortOfferId,
  submissionSourceLabel,
  LOAN_SOURCE_SYSTEM_MAX_LENGTH,
  LOAN_EXTERNAL_REFERENCE_MAX_LENGTH,
} from "./offer-ui";

const fmtMoney = (v: number, ccy: string) => formatOfferMoney(v, ccy);

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
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
  if (!partyId || !displayName)
    return <span className="text-muted-foreground">—</span>;
  return (
    <Link
      to={customerPath(partyId, partyType ?? "person")}
      className="text-primary hover:underline"
    >
      {displayName}
    </Link>
  );
};

const PERIOD_DATE_CLASS = "font-mono text-sm font-medium tabular-nums";

const OfferCoverageNestedPanel = ({
  coverages,
  currency,
  coverageNameById,
  periodLabel,
}: {
  coverages: OfferYearCoverage[];
  currency: string;
  coverageNameById: Record<string, string>;
  periodLabel: string | number;
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
          {coverages.length > 0 ? ` · ${fmtMoney(totalPremium, currency)}` : ""}
        </div>
      </div>
      {coverages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No coverages for period {periodLabel}.
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
            {coverages.map((c) => (
              <TableRow
                key={c.id || c.coverageId}
                className="border-0 hover:bg-transparent"
              >
                <TableCell className="px-2 py-1.5">
                  <div className="text-sm font-medium">
                    {coverageNameById[c.coverageId] ?? c.coverageId}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {c.coverageId}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right font-mono text-sm">
                  {fmtMoney(c.sumInsured, currency)}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right font-mono text-sm text-muted-foreground">
                  {formatRate(c.rateUsed, currency)}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right font-mono text-sm text-muted-foreground">
                  {c.ratingTableMultiplierUsed != null ? c.ratingTableMultiplierUsed : "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right font-mono text-sm font-semibold text-primary">
                  {fmtMoney(c.calculatedPremium, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const OfferParticipantFields = ({
  party,
  countryLabel,
  relationshipLabel,
  canRemove,
  onRemove,
}: {
  party?: OfferParticipant;
  countryLabel: (code?: string) => string | undefined;
  relationshipLabel: (value?: string | null) => string;
  canRemove?: boolean;
  onRemove?: () => void;
}) => {
  if (!party) {
    return <div className="text-sm text-muted-foreground">Not assigned</div>;
  }
  return (
    <div className="space-y-3">
      {canRemove ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 -mt-1 -mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      ) : null}
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
          value={
            <span className="font-mono text-xs">{party.uniqueIdentifier}</span>
          }
        />
        <Field label="Party type" value={titleCase(party.partyType)} />
        <Field label="Country" value={countryLabel(party.countryCode)} />
        <Field
          label="Leader"
          value={
            <Checkbox
              checked={Boolean(party.isLeader)}
              disabled
              className="disabled:opacity-100 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
              aria-label="Leader"
            />
          }
        />
        <Field
          label="Share"
          value={
            party.share == null ? undefined : (
              <span className="font-mono text-sm">
                {formatSharePct(party.share)}
              </span>
            )
          }
        />
        {party.role === "invoiced" || party.relationshipToInsured ? (
          <Field
            label="Relationship"
            value={relationshipLabel(party.relationshipToInsured)}
          />
        ) : null}
      </div>
    </div>
  );
};

const OfferInsuredPersonFields = ({
  person,
  countryLabel,
  canRemove,
  onRemove,
}: {
  person: OfferInsuredPerson;
  countryLabel: (code?: string) => string | undefined;
  canRemove?: boolean;
  onRemove?: () => void;
}) => {
  const name =
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.personalIdentifier;
  return (
    <div className="space-y-3">
      {canRemove ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 -mt-1 -mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Name"
          value={
            <PartyLink
              partyId={person.personId}
              partyType="person"
              displayName={name}
            />
          }
        />
        <Field
          label="Personal ID"
          value={
            <span className="font-mono text-xs">
              {person.personalIdentifier}
            </span>
          }
        />
        <Field label="First name" value={person.firstName} />
        <Field label="Last name" value={person.lastName} />
        <Field
          label="DOB / Age"
          value={
            person.dateOfBirth ? (
              <span className={PERIOD_DATE_CLASS}>
                {formatOfferDate(person.dateOfBirth)} (
                {ageFromDob(person.dateOfBirth)} yrs)
              </span>
            ) : undefined
          }
        />
        <Field label="Gender" value={titleCase(person.gender)} />
        <Field label="Country" value={countryLabel(person.countryCode)} />
      </div>
    </div>
  );
};

const docStatusClass = (status: string) => {
  if (status === "accepted") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "submitted") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "refused") return "bg-destructive/15 text-destructive";
  if (status === "waived") return "bg-muted text-muted-foreground";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
};

const docStatusBadge = (status: string) => (
  <Badge variant="outline" className={docStatusClass(status)}>
    {documentStatusLabel(status)}
  </Badge>
);

type DocAction = {
  requirementId: string;
  label: string;
};

const OfferDocumentsPanel = ({
  documents,
  documentTypeNameById,
  docActionPending,
  onSubmit,
  onApprove,
  onReject,
  onWaive,
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
  documentTypeNameById: Record<string, string>;
  docActionPending: boolean;
  onSubmit: (args: DocAction) => void;
  onApprove: (args: DocAction) => void;
  onReject: (args: DocAction) => void;
  onWaive: (args: DocAction) => void;
}) => {
  const { fileBusy, openPreview, download } = useDocumentPreview();

  return (
    <>
          {documents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No document requirements on this offer.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Decided</TableHead>
                    <TableHead>Waiver</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => {
                    const label =
                      documentTypeNameById[d.documentTypeId] ?? d.documentTypeId;
                    const canSubmit =
                      d.status === "required" || d.status === "refused";
                    const canReview = d.status === "submitted";
                    const hasFile = Boolean(d.documentId);
                    const previewBusy =
                      fileBusy?.id === d.documentId &&
                      fileBusy.action === "preview";
                    const downloadBusy =
                      fileBusy?.id === d.documentId &&
                      fileBusy.action === "download";
                    const source = submissionSourceLabel(d.submissionSource);
                    return (
                      <TableRow key={d.id || `${d.documentTypeId}-${d.documentId}`}>
                        <TableCell>
                          <div className="flex items-center gap-0.5 min-w-0">
                            <span className="font-medium">{label}</span>
                            {hasFile ? (
                              <>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                  title="View document"
                                  disabled={Boolean(fileBusy)}
                                  onClick={() =>
                                    d.documentId &&
                                    void openPreview(d.documentId, label)
                                  }
                                >
                                  {previewBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                  title="Download document"
                                  disabled={Boolean(fileBusy)}
                                  onClick={() =>
                                    d.documentId &&
                                    void download(d.documentId, label)
                                  }
                                >
                                  {downloadBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  <span className="sr-only">Download</span>
                                </Button>
                              </>
                            ) : null}
                          </div>
                          {source ? (
                            <div className="text-xs text-muted-foreground">
                              Source: {source}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>{docStatusBadge(d.status)}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {formatOfferDateTime(d.submittedOnUtc)}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {formatOfferDateTime(d.decidedOnUtc)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {d.waiverReason?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
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
                              variant="ghost"
                              className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
    </>
  );
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [id]);

  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    () => new Set(),
  );

  const { data: apiOffer, isLoading } = useGetOffer(id ?? "", {
    enabled: Boolean(id),
  });
  const { data: countryOptions = [] } = useCountryEnum();
  const { data: relationshipOptions = [] } = useRelationshipToInsuredEnum();
  const countryLabel = (code?: string) =>
    countryDisplayName(code, countryOptions) ?? code;
  const relationshipLabel = (value?: string | null) =>
    smartEnumLabel(relationshipOptions, value);
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
  const addParticipant = useAddOfferParticipant();
  const addInsuredPerson = useAddOfferInsuredPerson();
  const removeParticipant = useRemoveOfferParticipant();
  const removeInsuredPerson = useRemoveOfferInsuredPerson();
  const submitLoan = useSubmitOfferLoan();
  const { data: coveragesPage } = useListCoverages({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: documentTypesPage } = useListDocumentTypes({
    pageNumber: 1,
    pageSize: 200,
  });

  const previewPremiumTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.payPremium, 0),
    [premiumPreview],
  );
  const previewInsuredTotal = useMemo(
    () => (premiumPreview ?? []).reduce((sum, s) => sum + s.insuredAmount, 0),
    [premiumPreview],
  );

  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState("");
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
  const [flagNote, setFlagNote] = useState("");
  const [issuancePending, setIssuancePending] = useState<
    "issue" | "rate" | "quote" | null
  >(null);
  const [confirmAction, setConfirmAction] = useState<
    "reject" | "issue" | "rate" | "quote" | null
  >(null);
  const [discountConfirm, setDiscountConfirm] = useState<{
    kind: "approve" | "reject";
    requestId: string;
    pctLabel: string;
  } | null>(null);
  const [partyDialog, setPartyDialog] = useState<
    "participant" | "insured" | "loan" | null
  >(null);
  const [newRole, setNewRole] =
    useState<DomainOffersParticipantRole>("policyHolder");
  const [newPartyId, setNewPartyId] = useState("");
  const [newSharePct, setNewSharePct] = useState("100");
  const [newRelationship, setNewRelationship] = useState("");
  const [newIsLeader, setNewIsLeader] = useState(true);
  const [newPersonId, setNewPersonId] = useState("");
  const [loanSourceSystem, setLoanSourceSystem] = useState("manual");
  const [loanExternalRef, setLoanExternalRef] = useState("");
  const [loanRows, setLoanRows] = useState<
    {
      id: string;
      periodStart: string;
      periodEnd: string;
      openingBalance: string;
    }[]
  >([]);

  const { data: newPartyPerson } = useGetPerson(newPartyId, {
    enabled: partyDialog === "participant" && Boolean(newPartyId),
  });
  const { data: newPartyCompany } = useGetCompany(newPartyId, {
    enabled: partyDialog === "participant" && Boolean(newPartyId),
  });

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

  const salesAgentId = apiOffer?.salesAttribution?.agentId?.trim() ?? "";
  const { data: salesAgent } = useGetAgent(salesAgentId, {
    enabled: Boolean(salesAgentId) && !apiOffer?.salesAttribution?.agentDisplayName,
  });

  useEffect(() => {
    const first = offer?.offerYears[0];
    const key = first?.id || (first ? String(first.year) : "");
    if (!key) return;
    setExpandedPeriods((prev) => (prev.size > 0 ? prev : new Set([key])));
  }, [offer?.id, offer?.offerYears]);

  const { data: apiProduct } = useGetProduct(offer?.productId ?? "", {
    enabled: Boolean(offer?.productId),
  });
  const product = useMemo(() => {
    if (apiProduct) return mapApiProduct(apiProduct);
    return undefined;
  }, [apiProduct]);

  const templateDocumentId =
    product?.defaultPrintableTemplateDocumentId?.trim() || "";
  const { data: templateDocument } = useGetDocument(templateDocumentId, {
    enabled: Boolean(templateDocumentId),
  });

  const paymentMethod =
    product?.bankAccounts?.find(
      (entry) => entry.currency === offer?.currency,
    ) ?? product?.bankAccounts?.[0];
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
          <p className="text-sm text-muted-foreground mt-2">
            The offer you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/offers")} className="mt-4">
            Back to Offers
          </Button>
        </div>
      </AppShell>
    );
  }

  const holder = offer.participants.find((p) => p.role === "policyHolder");
  const payer = offer.participants.find((p) => p.role === "invoiced");
  const beneficiaryParties = offer.participants.filter(
    (p) => p.role === "beneficiary",
  );

  const verificationChecks: VerificationCheck[] = mapReviewFlagsToChecks(
    offer.reviewFlags,
  );
  const verifOverall = overallStatus(verificationChecks);
  const reviewCount = verificationChecks.filter(
    (c) => c.result === "Requires Review",
  ).length;
  const warnCount = verificationChecks.filter(
    (c) => c.result === "Warning",
  ).length;

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

  const canEditParties = offer.status === "Draft";
  const togglePeriodExpanded = (key: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const newPartyType =
    newPartyCompany?.id && !newPartyPerson?.id ? "company" : "person";

  const resetPartyDialog = () => {
    setPartyDialog(null);
    setNewRole("policyHolder");
    setNewPartyId("");
    setNewSharePct("100");
    setNewRelationship("");
    setNewIsLeader(true);
    setNewPersonId("");
    setLoanSourceSystem("manual");
    setLoanExternalRef("");
    setLoanRows([]);
  };

  const openLoanDialog = () => {
    const start = offer.startDate || new Date().toISOString().slice(0, 10);
    const end = offer.endDate || start;
    const term = Math.max(1, offer.termYears);
    const rows = buildYearlyLoanPeriodDates(start, end, term).map((range) => ({
      id: crypto.randomUUID(),
      periodStart: range.periodStart,
      periodEnd: range.periodEnd,
      openingBalance: "",
    }));
    setLoanRows(rows);
    setPartyDialog("loan");
  };

  const openAddParticipant = (role: DomainOffersParticipantRole) => {
    setNewRole(role);
    setNewPartyId("");
    setNewSharePct("100");
    setNewRelationship("");
    setNewIsLeader(role === "policyHolder");
    setPartyDialog("participant");
  };

  const handleAddParticipant = async () => {
    if (!newPartyId) {
      toast.error("Select a party");
      return;
    }
    const share =
      newRole === "beneficiary" ? (Number(newSharePct) || 0) / 100 : 1;
    if (!(share > 0)) {
      toast.error("Share must be greater than 0");
      return;
    }
    if (newRole === "invoiced" && !newRelationship) {
      toast.error("Select relationship to insured");
      return;
    }
    try {
      await addParticipant.mutateAsync({
        offerId: offer.id,
        body: {
          partyId: newPartyId,
          partyType: newPartyType,
          role: newRole,
          isLeader: newIsLeader,
          share,
          ...(newRole === "invoiced"
            ? {
                relationshipToInsured:
                  newRelationship as DomainPoliciesRelationshipToInsured,
              }
            : {}),
        },
      });
      toast.success("Participant added");
      resetPartyDialog();
    } catch (err) {
      toastApiError(err, "Failed to add participant");
    }
  };

  const handleAddInsured = async () => {
    if (!newPersonId) {
      toast.error("Select an insured person");
      return;
    }
    try {
      await addInsuredPerson.mutateAsync({
        offerId: offer.id,
        body: { personId: newPersonId },
      });
      toast.success("Insured person added");
      resetPartyDialog();
    } catch (err) {
      toastApiError(err, "Failed to add insured person");
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant.mutateAsync({ offerId: offer.id, participantId });
      toast.success("Participant removed");
    } catch (err) {
      toastApiError(err, "Failed to remove participant");
    }
  };

  const handleRemoveInsured = async (insuredPersonId: string) => {
    try {
      await removeInsuredPerson.mutateAsync({
        offerId: offer.id,
        insuredPersonId,
      });
      toast.success("Insured person removed");
    } catch (err) {
      toastApiError(err, "Failed to remove insured person");
    }
  };

  const handleSubmitLoan = async () => {
    const sourceSystem = loanSourceSystem
      .trim()
      .slice(0, LOAN_SOURCE_SYSTEM_MAX_LENGTH);
    if (!sourceSystem) {
      toast.error("Source system is required");
      return;
    }
    const periods = loanRows
      .filter((row) => row.periodStart && row.periodEnd)
      .map((row, i, rows) => ({
        sequenceNumber: i + 1,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        openingBalance: Number(row.openingBalance) || 0,
        closingBalance: Number(rows[i + 1]?.openingBalance) || 0,
      }));
    if (periods.length === 0) {
      toast.error("Add at least one loan period");
      return;
    }
    try {
      await submitLoan.mutateAsync({
        offerId: offer.id,
        body: {
          sourceSystem,
          externalReference: loanExternalRef.trim()
            ? loanExternalRef
                .trim()
                .slice(0, LOAN_EXTERNAL_REFERENCE_MAX_LENGTH)
            : null,
          periods,
        },
      });
      toast.success("Loan balances submitted");
      resetPartyDialog();
    } catch (err) {
      toastApiError(err, "Failed to submit loan balances");
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
          ...(Number.isInteger(seq) && seq > 0
            ? { targetPeriodSequence: seq }
            : {}),
        },
      });
      toast.success("Discount requested");
      setDiscountDialogOpen(false);
      setDiscountPct("");
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
        buildCreateDocumentFormData(docSubmitFile, docSubmitFile.name),
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
    const note = flagNote.trim().slice(0, REASON_MAX_LENGTH);
    if (!note) {
      toast.error("A note is required");
      return;
    }
    const body = { note };
    try {
      if (pendingFlagAction.kind === "approve") {
        await approveReviewFlag.mutateAsync({
          offerId: offer.id,
          flagId: pendingFlagAction.flagId,
          body,
        });
        toast.success(`Review flag approved: ${pendingFlagAction.label}`);
      } else {
        await rejectReviewFlag.mutateAsync({
          offerId: offer.id,
          flagId: pendingFlagAction.flagId,
          body,
        });
        toast.success(`Review flag rejected: ${pendingFlagAction.label}`);
      }
      setPendingFlagAction(null);
      setFlagNote("");
    } catch (err) {
      toastApiError(
        err,
        pendingFlagAction.kind === "approve"
          ? "Failed to approve review flag"
          : "Failed to reject review flag",
      );
    }
  };

  const flagActionPending =
    approveReviewFlag.isPending || rejectReviewFlag.isPending;

  const canReject =
    offer.status !== "Bound" &&
    offer.status !== "Cancelled" &&
    offer.status !== "Expired";

  const discountActionPending =
    approveDiscount.isPending || rejectDiscount.isPending;

  const pageBusy =
    cancelOffer.isPending ||
    issuancePending != null ||
    discountActionPending ||
    addParticipant.isPending ||
    addInsuredPerson.isPending ||
    removeParticipant.isPending ||
    removeInsuredPerson.isPending ||
    submitLoan.isPending;
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
                : submitLoan.isPending
                  ? "Submitting loan balances…"
                  : addParticipant.isPending || addInsuredPerson.isPending
                    ? "Updating parties…"
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
            description:
              "This will calculate premium and coverages from the current parties and loan balances.",
            confirmLabel: "Rate offer",
            destructive: false,
          }
        : confirmAction === "quote"
          ? {
              title: "Quote this offer?",
              description:
                "This will lock the quotation so the offer can be issued.",
              confirmLabel: "Quote offer",
              destructive: false,
            }
          : confirmAction === "issue"
            ? {
                title: "Issue policy?",
                description:
                  "This will convert the quoted offer into a policy.",
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/offers")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Offers
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Offer
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {offer.number}
            </h1>
            <Badge
              variant="outline"
              className={`text-sm font-semibold px-3 py-1.5 rounded-md border-0 ${statusColor[offer.status]}`}
            >
              {offer.status}
            </Badge>
            {verifOverall === "Pending Review" &&
              verificationChecks.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-700 dark:text-amber-300"
                >
                  <ShieldAlert className="h-3 w-3 mr-1" /> Verification flagged
                </Badge>
              )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product?.name ?? offer.productId}
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
            <RefreshCw
              className={`h-4 w-4 ${premiumPreviewLoading ? "animate-spin" : ""}`}
            />
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
            variant="ghost"
            size="sm"
            className="gap-2 border border-destructive text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={!canReject || pageBusy}
            onClick={() => setConfirmAction("reject")}
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 border border-emerald-600 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-400 dark:text-emerald-400 dark:hover:text-emerald-300"
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
            <AlertDialogDescription>
              {confirmCopy?.description}
            </AlertDialogDescription>
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
            <Link
              to={`/policies/${offer.policyId}`}
              className="font-mono text-primary hover:underline"
            >
              {offer.policyId}
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Pay Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {premiumPreviewLoading &&
              !premiumPreview &&
              offer.offerYears.length === 0
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
          <CardHeader className="pb-1.5">
            <CardDescription>Currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{offer.currency}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Periods</CardDescription>
          </CardHeader>
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
          <CardHeader className="pb-1.5">
            <CardDescription>Term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{offer.termYears} years</div>
          </CardContent>
        </Card>
        <Card
          className={
            verifOverall === "Pending Review"
              ? "border-amber-500/40 bg-amber-500/5"
              : ""
          }
        >
          <CardHeader className="pb-1.5">
            <CardDescription>Verification</CardDescription>
          </CardHeader>
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
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="summary" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="years" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Periods
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Review flags
            {offer.reviewFlags.length > 0 ? (
              <Badge variant="secondary">{offer.reviewFlags.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Participants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product & Coverage
                </CardTitle>
              </CardHeader>
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
                  label="Status"
                  value={
                    <Badge
                      variant="outline"
                      className={`text-sm font-semibold px-3 py-1 rounded-md border-0 ${statusColor[offer.status]}`}
                    >
                      {offer.status}
                    </Badge>
                  }
                />
                <Field
                  label="Requires loan balances"
                  value={
                    <Checkbox
                      checked={Boolean(offer.requiresLoanBalances)}
                      disabled
                      className="disabled:opacity-100 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                      aria-label="Requires loan balances"
                    />
                  }
                />
                <Field
                  label="Created on UTC"
                  value={
                    <span
                      className={`${PERIOD_DATE_CLASS} inline-flex items-center gap-1.5`}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatOfferDateTime(offer.createdOnUtc)}
                    </span>
                  }
                />
                <Field
                  label="Quoted on UTC"
                  value={
                    <span
                      className={`${PERIOD_DATE_CLASS} inline-flex items-center gap-1.5`}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatOfferDateTime(offer.quotedOnUtc)}
                    </span>
                  }
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
                        <span
                          className="truncate"
                          title={templateDocument?.originalFileName}
                        >
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
                        <span className="whitespace-pre-wrap font-normal">
                          {product.coverageText}
                        </span>
                      ) : undefined
                    }
                  />
                </div>
                <Field
                  label="Currency"
                  value={
                    <Badge variant="outline">
                      {paymentMethod?.currency ?? offer.currency}
                    </Badge>
                  }
                />
                <Field
                  label="Bank"
                  value={
                    paymentBankAccount
                      ? [
                          paymentBankAccount.bankName,
                          paymentBankAccount.iban ||
                            paymentBankAccount.accountNumber,
                        ]
                          .filter(Boolean)
                          .join(" · ") || paymentBankAccountId
                      : paymentBankAccountId || undefined
                  }
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Policy period
                </CardTitle>
                <CardDescription>Coverage term for this offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Start date"
                    value={
                      <span className={PERIOD_DATE_CLASS}>
                        {formatOfferDate(offer.startDate)}
                      </span>
                    }
                  />
                  <Field
                    label="End date"
                    value={
                      <span className={PERIOD_DATE_CLASS}>
                        {formatOfferDate(offer.endDate)}
                      </span>
                    }
                  />
                  <Field
                    label="Term"
                    value={`${offer.termYears} ${offer.termYears === 1 ? "year" : "years"}`}
                  />
                  <Field
                    label="Periods"
                    value={
                      <span>
                        {offer.offerYears.length}{" "}
                        {offer.offerYears.length === 1 ? "period" : "periods"}
                      </span>
                    }
                  />
                </div>
                {offer.loanSubmissions.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5" />
                      Loan submissions
                    </div>
                    <div className="space-y-2">
                      {offer.loanSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="rounded-md border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                              {sub.sourceSystem || "—"}
                            </Badge>
                            {sub.externalReference ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                {sub.externalReference}
                              </span>
                            ) : null}
                          </div>
                          <div className={`${PERIOD_DATE_CLASS} mt-1 text-xs text-muted-foreground`}>
                            {formatOfferDateTime(sub.receivedOnUtc)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {canEditParties && offer.requiresLoanBalances ? (
                  offer.loanDisbursements.length === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={openLoanDialog}
                    >
                      <Plus className="h-4 w-4" /> Submit loan balances
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={openLoanDialog}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resubmit loan balances
                    </Button>
                  )
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                  Sales attribution
                </CardTitle>
                <CardDescription>How this offer was sold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Created by"
                  value={
                    offer.createdByUserName ? (
                      <span className="inline-flex items-center gap-1.5 break-all">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {offer.createdByUserName}
                      </span>
                    ) : undefined
                  }
                />
                <Field
                  label="Agent selection"
                  value={
                    offer.agentSelectionMethod ? (
                      <Badge variant="outline">
                        {agentSelectionMethodLabel(offer.agentSelectionMethod)}
                      </Badge>
                    ) : undefined
                  }
                />
                {offer.salesChannel ? (
                  <Field
                    label="Channel"
                    value={
                      <Badge variant="outline">
                        {salesChannelLabel(offer.salesChannel)}
                      </Badge>
                    }
                  />
                ) : null}
                <Field
                  label="Agent"
                  value={
                    offer.agentId ? (
                      <Link
                        to={`/agents/${offer.agentId}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {offer.salesAgentName ||
                          salesAgent?.displayName ||
                          shortOfferId(offer.agentId)}
                      </Link>
                    ) : undefined
                  }
                />
                <Field
                  label="Partner"
                  value={
                    offer.salesPartnerName || offer.partnerId ? (
                      offer.partnerId ? (
                        <Link
                          to={`/partners/${offer.partnerId}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Handshake className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {offer.salesPartnerName || shortOfferId(offer.partnerId)}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Handshake className="h-3.5 w-3.5 text-muted-foreground" />
                          {offer.salesPartnerName}
                        </span>
                      )
                    ) : undefined
                  }
                />
                <Field
                  label="Office"
                  value={
                    offer.salesOfficeName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {offer.salesOfficeName}
                      </span>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="years" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverage periods</CardTitle>
              <CardDescription>
                Rated periods for this offer. Rate the offer to persist premium
                amounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offer.offerYears.length === 0 ? (
                premiumPreview && premiumPreview.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Premium preview (not committed). Rate the offer to persist
                      these amounts.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">
                          Insured Amount
                        </div>
                        <div className="text-lg font-semibold font-mono mt-1">
                          {fmtMoney(previewInsuredTotal, offer.currency)}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">
                          Pay Premium
                        </div>
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
                        <TableHead className="w-[44px]" />
                        <TableHead className="w-[70px]">#</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                        <TableHead className="text-right">
                          Pay Premium
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Coverages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offer.offerYears.map((s) => {
                        const periodKey = s.id || String(s.year);
                        const isExpanded = expandedPeriods.has(periodKey);
                        return (
                          <Fragment key={periodKey}>
                            <TableRow
                              className={cn(
                                "cursor-pointer hover:bg-accent-soft/70",
                                isExpanded &&
                                  "border-b-0 bg-transparent hover:bg-transparent",
                              )}
                              data-state={isExpanded ? "open" : undefined}
                              onClick={() => togglePeriodExpanded(periodKey)}
                            >
                              <TableCell className="pr-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  aria-label={
                                    isExpanded
                                      ? `Collapse coverages for period ${s.year}`
                                      : `Expand coverages for period ${s.year}`
                                  }
                                  aria-expanded={isExpanded}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePeriodExpanded(periodKey);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-mono">{s.year}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {formatOfferDate(s.startDate)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {formatOfferDate(s.endDate)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {s.openingBalance != null
                                  ? fmtMoney(s.openingBalance, offer.currency)
                                  : fmtMoney(s.insuredAmount, offer.currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {s.closingBalance != null
                                  ? fmtMoney(s.closingBalance, offer.currency)
                                  : "—"}
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
                            {isExpanded && (
                              <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={9} className="p-0">
                                  <OfferCoverageNestedPanel
                                    coverages={s.coverages}
                                    currency={offer.currency}
                                    coverageNameById={coverageNameById}
                                    periodLabel={s.year}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                      <TableRow className="bg-muted/40 font-medium">
                        <TableCell colSpan={6} className="text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                          {fmtMoney(
                            offer.offerYears.reduce(
                              (sum, s) => sum + s.payPremium,
                              0,
                            ),
                            offer.currency,
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
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>
                Document requirements on this offer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfferDocumentsPanel
                documents={offer.documentRequirements}
                documentTypeNameById={documentTypeNameById}
                docActionPending={
                  acceptDocument.isPending ||
                  refuseDocument.isPending ||
                  waiveDocument.isPending ||
                  docSubmitPending
                }
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
              <CardDescription>
                Review flags on this offer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationChecksTable
                checks={verificationChecks}
                actionPending={flagActionPending}
                onApprove={(flagId) => {
                  const flag = offer.reviewFlags.find((f) => f.id === flagId);
                  setFlagNote("");
                  setPendingFlagAction({
                    kind: "approve",
                    flagId,
                    label: flag?.type?.trim() || flagId,
                  });
                }}
                onReject={(flagId) => {
                  const flag = offer.reviewFlags.find((f) => f.id === flagId);
                  setFlagNote("");
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
              setDiscountPct("");
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
              <Button
                onClick={() => void handleRequestDiscount()}
                disabled={requestDiscount.isPending}
              >
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
                Approve{" "}
                <span className="font-medium text-foreground">
                  {pendingDocApprove?.label}
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={acceptDocument.isPending}>
                Cancel
              </AlertDialogCancel>
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
                {pendingFlagAction?.kind === "reject"
                  ? "Reject review flag?"
                  : "Approve review flag?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingFlagAction?.kind === "reject" ? "Reject" : "Approve"}{" "}
                <span className="font-medium text-foreground">
                  {pendingFlagAction?.label}
                </span>
                . A note is sent with the decision.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="flag-note">Note</Label>
              <Textarea
                id="flag-note"
                rows={3}
                maxLength={REASON_MAX_LENGTH}
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="Why is this review flag being resolved?"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={flagActionPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={flagActionPending || !flagNote.trim()}
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
              <DialogTitle>
                Reject document · {docRejectDialog?.label}
              </DialogTitle>
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
              <DialogTitle>
                Submit document · {docSubmitDialog?.label}
              </DialogTitle>
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
              <DialogTitle>
                Waive document · {docWaiveDialog?.label}
              </DialogTitle>
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
                    <CardTitle className="text-base">
                      Discount Requests
                    </CardTitle>
                    <CardDescription>
                      Discount requests on this offer.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={
                      offer.status === "Bound" || offer.status === "Cancelled"
                    }
                    onClick={() => {
                      setDiscountPct("");
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
                          <TableHead className="text-center">
                            Discount
                          </TableHead>
                          <TableHead className="text-center">Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discountRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-sm text-muted-foreground py-6"
                            >
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
                                  {formatDiscountPct(
                                    r.requestedDiscountPercentage,
                                  )}
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
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  {formatOfferDateTime(r.requestedOnUtc)}
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
                                          pctLabel:
                                            formatDiscountPct(
                                              r.requestedDiscountPercentage,
                                            ) ?? "",
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={!canAct || pageBusy}
                                      onClick={() =>
                                        setDiscountConfirm({
                                          kind: "reject",
                                          requestId: r.id,
                                          pctLabel:
                                            formatDiscountPct(
                                              r.requestedDiscountPercentage,
                                            ) ?? "",
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

        <TabsContent value="participants" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Policy holder</CardTitle>
                  <CardDescription>Owner of the policy</CardDescription>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canEditParties ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => openAddParticipant("policyHolder")}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add participant
                    </Button>
                  ) : null}
                  {canEditParties && holder?.id ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void handleRemoveParticipant(holder.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <OfferParticipantFields
                  party={holder}
                  countryLabel={countryLabel}
                  relationshipLabel={relationshipLabel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Insured persons</CardTitle>
                  <CardDescription>
                    {offer.insuredPersons.length === 0
                      ? "Life covered by this offer"
                      : offer.insuredPersons.length === 1
                        ? "Life covered by this offer"
                        : `${offer.insuredPersons.length} lives covered by this offer`}
                  </CardDescription>
                </div>
                <div className="flex flex-row flex-nowrap items-center gap-1 shrink-0">
                  {canEditParties ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setPartyDialog("insured")}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add insured person
                    </Button>
                  ) : null}
                  {canEditParties && offer.insuredPersons[0]?.id ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        void handleRemoveInsured(offer.insuredPersons[0].id)
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.insuredPersons.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Not assigned
                  </div>
                ) : (
                  offer.insuredPersons.map((person, index) => (
                    <div
                      key={person.id || person.personId || index}
                      className={index > 0 ? "border-t pt-4" : undefined}
                    >
                      <OfferInsuredPersonFields
                        person={person}
                        countryLabel={countryLabel}
                        canRemove={Boolean(
                          canEditParties && person.id && index > 0,
                        )}
                        onRemove={() =>
                          person.id && void handleRemoveInsured(person.id)
                        }
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">
                    Payer / Invoice recipient
                  </CardTitle>
                  <CardDescription>
                    Receives invoices, pays premiums
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canEditParties ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => openAddParticipant("invoiced")}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add participant
                    </Button>
                  ) : null}
                  {canEditParties && payer?.id ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void handleRemoveParticipant(payer.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <OfferParticipantFields
                  party={payer}
                  countryLabel={countryLabel}
                  relationshipLabel={relationshipLabel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Beneficiaries</CardTitle>
                  <CardDescription>
                    {beneficiaryParties.length === 0
                      ? "No beneficiaries"
                      : `${beneficiaryParties.length} ${
                          beneficiaryParties.length === 1
                            ? "beneficiary"
                            : "beneficiaries"
                        } · total share ${
                          formatSharePct(
                            beneficiaryParties.reduce(
                              (sum, party) => sum + (party.share ?? 0),
                              0,
                            ),
                          ) ?? "—"
                        }`}
                  </CardDescription>
                </div>
                <div className="flex flex-row flex-nowrap items-center gap-1 shrink-0">
                  {canEditParties ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => openAddParticipant("beneficiary")}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add participant
                    </Button>
                  ) : null}
                  {canEditParties && beneficiaryParties[0]?.id ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        void handleRemoveParticipant(beneficiaryParties[0].id)
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiaryParties.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Not assigned
                  </div>
                ) : (
                  beneficiaryParties.map((party, index) => (
                    <div
                      key={party.id || `${party.partyId}-${index}`}
                      className={index > 0 ? "border-t pt-4" : undefined}
                    >
                      <OfferParticipantFields
                        party={party}
                        countryLabel={countryLabel}
                        relationshipLabel={relationshipLabel}
                        canRemove={Boolean(canEditParties && party.id && index > 0)}
                        onRemove={() =>
                          party.id && void handleRemoveParticipant(party.id)
                        }
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={partyDialog === "participant"}
        onOpenChange={(open) => {
          if (!open) resetPartyDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newRole === "policyHolder"
                ? "Add policy holder"
                : newRole === "invoiced"
                  ? "Add payer"
                  : "Add beneficiary"}
            </DialogTitle>
            <DialogDescription>
              {newRole === "policyHolder"
                ? "Add the party that owns this offer."
                : newRole === "invoiced"
                  ? "Add the party that receives invoices and pays premiums."
                  : "Add a beneficiary and their share of the benefit."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Party</Label>
              <CustomerCombobox
                value={newPartyId}
                onValueChange={(id) => {
                  setNewPartyId(id);
                  if (
                    newRole === "invoiced" &&
                    offer.insuredPersons.some((p) => p.personId === id)
                  ) {
                    setNewRelationship(SAME_AS_INSURED);
                  }
                }}
                placeholder="Select person or company"
              />
            </div>
            {newRole === "invoiced" ? (
              <div className="grid gap-1.5">
                <Label>Relationship to insured</Label>
                <Select
                  value={newRelationship || undefined}
                  onValueChange={setNewRelationship}
                  disabled={
                    newRole === "invoiced" &&
                    offer.insuredPersons.some((p) => p.personId === newPartyId)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.text || opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {newRole === "beneficiary" ? (
              <div className="grid gap-1.5">
                <Label>Share (%)</Label>
                <Input
                  type="number"
                  min={0.01}
                  max={100}
                  value={newSharePct}
                  onChange={(e) => setNewSharePct(e.target.value)}
                />
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newIsLeader}
                onChange={(e) => setNewIsLeader(e.target.checked)}
              />
              Leader
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPartyDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddParticipant()}
              disabled={addParticipant.isPending}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={partyDialog === "insured"}
        onOpenChange={(open) => {
          if (!open) resetPartyDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add insured person</DialogTitle>
            <DialogDescription>
              The insured person must be an individual, not a company.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label>Person</Label>
            <PersonCombobox
              value={newPersonId}
              onValueChange={setNewPersonId}
              placeholder="Select insured person"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPartyDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddInsured()}
              disabled={addInsuredPerson.isPending}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={partyDialog === "loan"}
        onOpenChange={(open) => {
          if (!open) resetPartyDialog();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit loan balances</DialogTitle>
            <DialogDescription>
              Opening and closing balances for each coverage period.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Source system</Label>
                <Input
                  value={loanSourceSystem}
                  maxLength={LOAN_SOURCE_SYSTEM_MAX_LENGTH}
                  onChange={(e) => setLoanSourceSystem(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>External reference</Label>
                <Input
                  value={loanExternalRef}
                  maxLength={LOAN_EXTERNAL_REFERENCE_MAX_LENGTH}
                  onChange={(e) => setLoanExternalRef(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Opening balance</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <DatePicker
                          value={
                            row.periodStart
                              ? parseISO(row.periodStart)
                              : undefined
                          }
                          onChange={(d) =>
                            setLoanRows((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      periodStart: d
                                        ? format(d, "yyyy-MM-dd")
                                        : "",
                                    }
                                  : r,
                              ),
                            )
                          }
                          buttonClassName="h-8 px-2 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <DatePicker
                          value={
                            row.periodEnd ? parseISO(row.periodEnd) : undefined
                          }
                          onChange={(d) =>
                            setLoanRows((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      periodEnd: d
                                        ? format(d, "yyyy-MM-dd")
                                        : "",
                                    }
                                  : r,
                              ),
                            )
                          }
                          buttonClassName="h-8 px-2 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8"
                          value={row.openingBalance}
                          onChange={(e) =>
                            setLoanRows((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, openingBalance: e.target.value }
                                  : r,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            setLoanRows((rows) =>
                              rows.filter((r) => r.id !== row.id),
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Closing balance for each period is the next row’s opening balance
              (0 on the last row).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPartyDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmitLoan()}
              disabled={submitLoan.isPending}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default OfferDetail;
