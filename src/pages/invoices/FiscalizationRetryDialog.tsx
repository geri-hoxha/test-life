import { useEffect, useState } from "react";
import { useRetryInvoiceFiscalization } from "@/api/invoices";
import type { InvoicesInvoiceListItemResponse } from "@/api/types";
import { toastApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentCombobox } from "@/components/DocumentCombobox";
import { toast } from "sonner";

type Props = {
  invoice: InvoicesInvoiceListItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FiscalizationRetryDialog = ({ invoice, open, onOpenChange }: Props) => {
  const retry = useRetryInvoiceFiscalization();
  const [reason, setReason] = useState("");
  const [externalDocumentId, setExternalDocumentId] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setExternalDocumentId("");
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmedReason = reason.trim();
    if (!invoice?.id) return;
    if (!trimmedReason) {
      toast.error("Reason is required");
      return;
    }

    retry.mutate(
      {
        id: invoice.id,
        body: {
          reason: trimmedReason,
          ...(externalDocumentId.trim()
            ? { externalDocumentId: externalDocumentId.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            invoice.number != null
              ? `Fiscalization retry submitted for invoice #${invoice.number}`
              : "Fiscalization retry submitted",
          );
          onOpenChange(false);
        },
        onError: (err) => toastApiError(err, "Failed to retry fiscalization"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retry fiscalization</DialogTitle>
          <DialogDescription>
            {invoice?.number != null
              ? `Resubmit invoice #${invoice.number} to the fiscal provider.`
              : "Resubmit this invoice to the fiscal provider."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-retry-reason">Reason</Label>
            <Textarea
              id="invoice-retry-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this invoice should be fiscalized again"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>External document ID</Label>
            <DocumentCombobox
              value={externalDocumentId}
              onValueChange={setExternalDocumentId}
              placeholder="Select from documents…"
              allowClear
              clearLabel="No document"
              disabled={retry.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={retry.isPending}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={retry.isPending || !invoice?.id}
          >
            {retry.isPending ? "Submitting…" : "Retry fiscalization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalizationRetryDialog;
