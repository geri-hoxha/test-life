import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  discountStatusClass,
  discountStatusLabel,
  formatDiscountPct,
  formatOfferDateTime,
} from "./offer-ui";

export type DiscountRequestRow = {
  id: string;
  targetPeriodSequence?: number | null;
  requestedDiscountPercentage?: number | null;
  reason?: string | null;
  status?: string;
  requestedOnUtc?: string | null;
};

export type DiscountRequestAction = {
  requestId: string;
  pctLabel: string;
};

export const DiscountRequestsTable = ({
  rows,
  actionPending,
  onApprove,
  onReject,
  emptyMessage = "No discount requests on this offer.",
}: {
  rows: DiscountRequestRow[];
  actionPending?: boolean;
  onApprove: (action: DiscountRequestAction) => void;
  onReject: (action: DiscountRequestAction) => void;
  emptyMessage?: string;
}) => (
  <div className="rounded-md border overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[90px]">Period</TableHead>
          <TableHead className="text-center">Discount</TableHead>
          <TableHead className="text-center">Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-sm text-muted-foreground py-6"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r, index) => {
            const canAct = r.status === "requested" && Boolean(r.id);
            const pctLabel = formatDiscountPct(r.requestedDiscountPercentage) ?? "";
            return (
              <TableRow key={r.id || index}>
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
                  <Badge variant="outline" className={discountStatusClass(r.status)}>
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
                      disabled={!canAct || actionPending}
                      onClick={() =>
                        onApprove({
                          requestId: r.id,
                          pctLabel,
                        })
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={!canAct || actionPending}
                      onClick={() =>
                        onReject({
                          requestId: r.id,
                          pctLabel,
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
);
