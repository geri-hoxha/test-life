import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  openPolicyCancellationPrint,
  openPolicyCancellationPrintWindow,
  useApplyPolicyCancellation,
  useCreatePolicyCancellation,
  useDeletePolicyCancellation,
  useGetPolicyCancellation,
  useUpdatePolicyCancellation,
} from "@/api/policies";
import { smartEnumLabel } from "@/api/smart-enums";
import type {
  DomainPoliciesCancellationKind,
  DomainPoliciesPolicyStatus,
  PoliciesPolicyCancellationRequest,
} from "@/api/types";
import { useCancellationReasonOptions } from "@/hooks/useCancellationReasonOptions";
import { toastApiError } from "@/lib/api-error";
import { OverlayLoader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Ban, FilePlus, Loader2, Printer, Trash2 } from "lucide-react";
import {
  cancellationKindLabel,
  cancellationStatusClass,
  cancellationStatusLabel,
  formatPolicyDate,
  formatPolicyDateTime,
  formatPolicyMoney,
  shortPolicyId,
} from "./policy-ui";
import {
  formatInvoiceMoney,
  invoiceStatusClass,
  invoiceStatusLabel,
  invoiceTypeLabel,
} from "@/pages/invoices/invoice-ui";

type Props = {
  policyId: string;
  currency: string;
  policyStatus?: DomainPoliciesPolicyStatus | string | null;
};

type FormState = {
  kind: DomainPoliciesCancellationKind;
  reason: string;
  registeredOn: string;
  effectiveOn: string;
  note: string;
  administrativeExpensePercentage: string;
  exchangeRateToAll: string;
};

const emptyForm = (): FormState => ({
  kind: "full",
  reason: "",
  registeredOn: "",
  effectiveOn: "",
  note: "",
  administrativeExpensePercentage: "",
  exchangeRateToAll: "",
});

const toDate = (iso?: string) => {
  if (!iso) return undefined;
  try {
    return parseISO(iso);
  } catch {
    return undefined;
  }
};

const toIsoDay = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "");

const parseOptionalNumber = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
};

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div className="text-sm font-medium mt-0.5">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const PolicyCancellationCard = ({
  policyId,
  currency,
  policyStatus,
}: Props) => {
  const reasonOptions = useCancellationReasonOptions();
  const {
    data: cancellation,
    isLoading,
    isError,
    refetch,
  } = useGetPolicyCancellation(policyId, {
    enabled: Boolean(policyId),
  });
  const createCancellation = useCreatePolicyCancellation();
  const updateCancellation = useUpdatePolicyCancellation();
  const deleteCancellation = useDeletePolicyCancellation();
  const applyCancellation = useApplyPolicyCancellation();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmAction, setConfirmAction] = useState<"apply" | "delete" | null>(
    null,
  );
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!cancellation) {
      setForm(emptyForm());
      return;
    }
    setForm({
      kind: cancellation.kind === "partial" ? "partial" : "full",
      reason: cancellation.reason ?? "",
      registeredOn: cancellation.registeredOn?.slice(0, 10) ?? "",
      effectiveOn: cancellation.effectiveOn?.slice(0, 10) ?? "",
      note: cancellation.note ?? "",
      administrativeExpensePercentage:
        cancellation.administrativeExpensePercentage != null
          ? String(cancellation.administrativeExpensePercentage)
          : "",
      exchangeRateToAll:
        cancellation.exchangeRateToAll != null
          ? String(cancellation.exchangeRateToAll)
          : "",
    });
  }, [cancellation]);

  const isApplied = cancellation?.status === "applied";
  const isDraft = cancellation?.status === "draft";
  const canCreate =
    !cancellation && policyStatus !== "cancelled" && policyStatus !== "matured";
  const readOnly = isApplied;
  const saving = createCancellation.isPending || updateCancellation.isPending;
  const busy =
    saving ||
    deleteCancellation.isPending ||
    applyCancellation.isPending ||
    printing;

  const busyLabel = applyCancellation.isPending
    ? "Applying cancellation…"
    : deleteCancellation.isPending
      ? "Discarding cancellation…"
      : saving
        ? cancellation
          ? "Saving cancellation…"
          : "Creating cancellation…"
        : printing
          ? "Preparing print…"
          : "Working…";

  const reasonLabel = (value?: string | null) =>
    smartEnumLabel(reasonOptions, value);

  const buildBody = (): PoliciesPolicyCancellationRequest | null => {
    if (!form.reason) {
      toast.error("Select a cancellation reason");
      return null;
    }
    const adminPct = parseOptionalNumber(form.administrativeExpensePercentage);
    if (form.administrativeExpensePercentage.trim() && adminPct == null) {
      toast.error("Administrative expense must be a number");
      return null;
    }
    if (adminPct != null && (adminPct < 0 || adminPct > 100)) {
      toast.error("Administrative expense must be between 0 and 100");
      return null;
    }
    const fx = parseOptionalNumber(form.exchangeRateToAll);
    if (form.exchangeRateToAll.trim() && (fx == null || fx <= 0)) {
      toast.error("Exchange rate to ALL must be greater than 0");
      return null;
    }
    return {
      kind: form.kind,
      reason: form.reason,
      registeredOn: form.registeredOn || null,
      effectiveOn: form.effectiveOn || null,
      note: form.note.trim() || null,
      administrativeExpensePercentage: adminPct ?? null,
      exchangeRateToAll: fx ?? null,
    };
  };

  const handleSave = () => {
    const body = buildBody();
    if (!body) return;
    const mutation = cancellation ? updateCancellation : createCancellation;
    mutation.mutate(
      { policyId, body },
      {
        onSuccess: () =>
          toast.success(
            cancellation
              ? "Cancellation updated"
              : "Cancellation draft created",
          ),
        onError: (err) =>
          toastApiError(
            err,
            cancellation
              ? "Failed to update cancellation"
              : "Failed to create cancellation",
          ),
      },
    );
  };

  const handleApply = () => {
    applyCancellation.mutate(policyId, {
      onSuccess: (data) => {
        const credits = data.creditInvoices?.length ?? 0;
        toast.success(
          credits > 0
            ? `Cancellation applied · ${credits} credit invoice${credits === 1 ? "" : "s"} created`
            : "Cancellation applied",
        );
        setConfirmAction(null);
      },
      onError: (err) => toastApiError(err, "Failed to apply cancellation"),
    });
  };

  const handleDelete = () => {
    deleteCancellation.mutate(policyId, {
      onSuccess: () => {
        toast.success("Cancellation draft discarded");
        setConfirmAction(null);
      },
      onError: (err) => toastApiError(err, "Failed to discard cancellation"),
    });
  };

  const handlePrint = () => {
    const printWindow = openPolicyCancellationPrintWindow();
    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to print the cancellation.");
      return;
    }
    void (async () => {
      try {
        setPrinting(true);
        await openPolicyCancellationPrint(policyId, printWindow);
      } catch (err) {
        printWindow.close();
        toastApiError(err, "Failed to print cancellation");
      } finally {
        setPrinting(false);
      }
    })();
  };

  const settlementCurrency = cancellation?.currency || currency;

  const creditInvoiceLinks = useMemo(() => {
    return applyCancellation.data?.creditInvoices ?? [];
  }, [applyCancellation.data?.creditInvoices]);

  if (isError) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Cancellation</CardTitle>
            <CardDescription>
              Could not load the cancellation for this policy.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cancellation</CardTitle>
          <CardDescription>Loading cancellation…</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching cancellation details
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {busy ? <OverlayLoader label={busyLabel} /> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">Cancellation</CardTitle>
              {cancellation?.status ? (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${cancellationStatusClass(cancellation.status)}`}
                >
                  {cancellationStatusLabel(cancellation.status)}
                </span>
              ) : null}
            </div>
            <CardDescription className="mt-1.5">
              {cancellation
                ? isApplied
                  ? "This cancellation has been applied to the policy."
                  : "Draft cancellation. Save changes, then apply to take effect."
                : canCreate
                  ? "Create a draft cancellation and apply it when ready."
                  : "This policy cannot be cancelled."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            {cancellation ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handlePrint}
                disabled={busy}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            ) : null}
            {isDraft ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={busy}
                onClick={() => setConfirmAction("apply")}
              >
                <Ban className="h-4 w-4" />
                Apply cancellation
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!cancellation && !canCreate ? (
            <p className="text-sm text-muted-foreground">
              No cancellation exists for this policy.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Kind</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium">
                      {cancellationKindLabel(form.kind)}
                    </div>
                  ) : (
                    <Select
                      value={form.kind}
                      onValueChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          kind: v as DomainPoliciesCancellationKind,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Reason *</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium">
                      {reasonLabel(form.reason)}
                      {form.reason ? (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">
                          ({form.reason})
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <Select
                      value={form.reason || undefined}
                      onValueChange={(v) =>
                        setForm((s) => ({ ...s, reason: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cancellation reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasonOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.text === opt.value
                              ? opt.text
                              : `${opt.text} (${opt.value})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Registered on</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium font-mono">
                      {formatPolicyDate(form.registeredOn)}
                    </div>
                  ) : (
                    <DatePicker
                      value={toDate(form.registeredOn)}
                      onChange={(d) =>
                        setForm((s) => ({ ...s, registeredOn: toIsoDay(d) }))
                      }
                      placeholder="Registration date"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Effective on</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium font-mono">
                      {formatPolicyDate(form.effectiveOn)}
                    </div>
                  ) : (
                    <DatePicker
                      value={toDate(form.effectiveOn)}
                      onChange={(d) =>
                        setForm((s) => ({ ...s, effectiveOn: toIsoDay(d) }))
                      }
                      placeholder="Effective date"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Administrative expense %</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium">
                      {form.administrativeExpensePercentage
                        ? `${form.administrativeExpensePercentage}%`
                        : "—"}
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={form.administrativeExpensePercentage}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          administrativeExpensePercentage: e.target.value,
                        }))
                      }
                      placeholder="0–100"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Exchange rate to ALL</Label>
                  {readOnly ? (
                    <div className="text-sm font-medium font-mono">
                      {form.exchangeRateToAll || "—"}
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={form.exchangeRateToAll}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          exchangeRateToAll: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  )}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Note</Label>
                  {readOnly ? (
                    <div className="text-sm whitespace-pre-wrap">
                      {form.note.trim() || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      value={form.note}
                      maxLength={1024}
                      rows={3}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, note: e.target.value }))
                      }
                      placeholder="Optional note"
                    />
                  )}
                </div>
              </div>

              {cancellation ? (
                <div className="rounded-md border bg-muted/20 p-4 space-y-3">
                  <div className="text-sm font-medium">Settlement</div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      label="Premium invoiced"
                      value={formatPolicyMoney(
                        cancellation.premiumInvoiced,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Coverage days"
                      value={cancellation.coverageDays}
                    />
                    <Field
                      label="Consumed days"
                      value={cancellation.consumedDays}
                    />
                    <Field
                      label="Consumed premium"
                      value={formatPolicyMoney(
                        cancellation.consumedPremium,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Unearned premium"
                      value={formatPolicyMoney(
                        cancellation.unearnedPremium,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Administrative expenses"
                      value={formatPolicyMoney(
                        cancellation.administrativeExpenses,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Refund"
                      value={
                        <span className="text-primary">
                          {formatPolicyMoney(
                            cancellation.refundAmount,
                            settlementCurrency,
                          )}
                        </span>
                      }
                    />
                    <Field
                      label="Refund (ALL)"
                      value={formatPolicyMoney(
                        cancellation.refundAmountAll,
                        "ALL",
                      )}
                    />
                    <Field
                      label="Agent commission reversed"
                      value={formatPolicyMoney(
                        cancellation.agentCommissionReversed,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Partner commission reversed"
                      value={formatPolicyMoney(
                        cancellation.partnerCommissionReversed,
                        settlementCurrency,
                      )}
                    />
                    <Field
                      label="Registered"
                      value={
                        <span className="font-mono text-xs">
                          {formatPolicyDateTime(cancellation.registeredOnUtc)}
                        </span>
                      }
                    />
                    <Field
                      label="Applied"
                      value={
                        <span className="font-mono text-xs">
                          {formatPolicyDateTime(cancellation.appliedOnUtc)}
                        </span>
                      }
                    />
                  </div>
                </div>
              ) : null}

              {creditInvoiceLinks.length > 0 ? (
                <div className="rounded-md border p-4 space-y-3">
                  <div className="text-sm font-medium">Credit invoices</div>
                  <div className="space-y-2">
                    {creditInvoiceLinks.map((invoice) =>
                      invoice.id ? (
                        <Link
                          key={invoice.id}
                          to={`/invoices/${invoice.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">
                              #{invoice.number ?? shortPolicyId(invoice.id)}
                            </span>
                            {invoice.type ? (
                              <span className="text-xs text-muted-foreground">
                                {invoiceTypeLabel(invoice.type)}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {formatInvoiceMoney(
                                invoice.totalGrossAmount,
                                invoice.currency,
                              )}
                            </span>
                            {invoice.status ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${invoiceStatusClass(invoice.status)}`}
                              >
                                {invoiceStatusLabel(invoice.status)}
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}

              {!readOnly ? (
                <div
                  className={`flex flex-wrap items-center gap-2 border-t pt-4 justify-end `}
                >
                  {isDraft ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={busy}
                      onClick={() => setConfirmAction("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                      Discard draft
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    className={`gap-2 ${isDraft ? " " : ""}`}
                  >
                    {cancellation ? (
                      "Save draft"
                    ) : (
                      <>
                        <FilePlus className="h-4 w-4" />
                        Create draft
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "apply"
                ? "Apply this cancellation?"
                : "Discard this draft?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "apply"
                ? "The policy will be cancelled and refunds / credit invoices will be generated."
                : "The draft cancellation will be deleted. You can create a new one later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction === "apply") handleApply();
                else handleDelete();
              }}
            >
              {confirmAction === "apply"
                ? "Apply cancellation"
                : "Discard draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PolicyCancellationCard;
