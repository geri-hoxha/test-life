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
import { formatOfferDateTime, humanizeOfferEnum } from "./offer-ui";

export type CheckResult = "Passed" | "Warning" | "Requires Review";

export type VerificationCheck = {
  id?: string;
  name: string;
  result: CheckResult;
  reason: string;
  action: string;
  /** Raw backend review-flag status when sourced from `reviewFlags`. */
  flagStatus?: string;
  resolutionNote?: string | null;
  raisedOnUtc?: string | null;
  resolvedOnUtc?: string | null;
};

const flagStatusLabel = (status?: string) => {
  if (status === "raised") return "Raised";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? humanizeOfferEnum(status) : "—";
};

const flagStatusClass = (status?: string) => {
  if (status === "raised") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

/** Map backend schedule `reviewFlags` into verification table rows. */
export const mapReviewFlagsToChecks = (
  flags: {
    id?: string;
    type?: string;
    reason?: string;
    status?: string;
    resolutionNote?: string | null;
    raisedOnUtc?: string | null;
    resolvedOnUtc?: string | null;
  }[]
): VerificationCheck[] =>
  flags.map((f) => {
    const status = (f.status ?? "pending").toLowerCase();
    let result: CheckResult = "Requires Review";
    let action = "Resolve this review flag.";
    if (status === "approved") {
      result = "Passed";
      action = "No action required.";
    } else if (status === "rejected") {
      result = "Warning";
      action = "Flag was rejected — escalate or revise the offer.";
    }

    const rawType = (f.type ?? "Review").trim() || "Review";
    const name = rawType
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id: f.id,
      name,
      result,
      reason: f.reason?.trim() || "—",
      action,
      flagStatus: status,
      resolutionNote: f.resolutionNote,
      raisedOnUtc: f.raisedOnUtc,
      resolvedOnUtc: f.resolvedOnUtc,
    };
  });

export const VerificationChecksTable = ({
  checks,
  actionPending,
  onApprove,
  onReject,
  emptyMessage = "No review flags on this offer.",
}: {
  checks: VerificationCheck[];
  actionPending?: boolean;
  onApprove?: (flagId: string) => void;
  onReject?: (flagId: string) => void;
  emptyMessage?: string;
}) => {
  if (checks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
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
          {checks.map((c, i) => {
            const canResolve =
              Boolean(c.id) &&
              Boolean(onApprove || onReject) &&
              c.flagStatus !== "approved" &&
              c.flagStatus !== "rejected";
            return (
              <TableRow key={`${c.id ?? c.name}-${i}`}>
                <TableCell className="font-medium whitespace-nowrap">{c.name}</TableCell>
                <TableCell className="max-w-[320px]">{c.reason}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={flagStatusClass(c.flagStatus)}>
                    {flagStatusLabel(c.flagStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[240px] text-muted-foreground">
                  {c.resolutionNote?.trim() || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formatOfferDateTime(c.raisedOnUtc)}
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formatOfferDateTime(c.resolvedOnUtc)}
                </TableCell>
                <TableCell className="text-right">
                  {canResolve ? (
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      {onApprove ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-8 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                          disabled={actionPending}
                          onClick={() => onApprove(c.id!)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      ) : null}
                      {onReject ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={actionPending}
                          onClick={() => onReject(c.id!)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export const overallStatus = (checks: VerificationCheck[]): "Pending Review" | "Quoted" => {
  return checks.some((c) => c.result === "Requires Review") ? "Pending Review" : "Quoted";
};
