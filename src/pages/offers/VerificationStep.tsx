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
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export type CheckResult = "Passed" | "Warning" | "Requires Review";

export type VerificationCheck = {
  id?: string;
  name: string;
  result: CheckResult;
  reason: string;
  action: string;
  /** Raw backend review-flag status when sourced from `reviewFlags`. */
  flagStatus?: string;
};

export const resultStyle: Record<CheckResult, { badge: string; row: string; icon: JSX.Element }> = {
  "Passed": {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    row: "",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
  "Warning": {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    row: "bg-amber-500/5",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  },
  "Requires Review": {
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    row: "bg-destructive/5",
    icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
  },
};

/** Map backend schedule `reviewFlags` into verification table rows. */
export const mapReviewFlagsToChecks = (
  flags: {
    id?: string;
    type?: string;
    reason?: string;
    status?: string;
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
      reason: f.reason?.trim() || "No reason provided.",
      action,
      flagStatus: status,
    };
  });

export const VerificationChecksTable = ({
  checks,
  actionPending,
  onApprove,
  onReject,
}: {
  checks: VerificationCheck[];
  actionPending?: boolean;
  onApprove?: (flagId: string) => void;
  onReject?: (flagId: string) => void;
}) => (
  <div className="rounded-md border overflow-x-auto">
    <Table className="text-xs">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 w-[140px] px-2 py-1.5 text-[11px]">Check</TableHead>
          <TableHead className="h-8 w-[120px] px-2 py-1.5 text-[11px]">Status</TableHead>
          <TableHead className="h-8 px-2 py-1.5 text-[11px]">Reason</TableHead>
          <TableHead className="h-8 w-[220px] px-2 py-1.5 text-[11px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="px-2 py-4 text-center text-xs text-muted-foreground"
            >
              No review flags for this schedule.
            </TableCell>
          </TableRow>
        ) : (
          checks.map((c, i) => {
            const s = resultStyle[c.result];
            const canResolve =
              Boolean(c.id) &&
              Boolean(onApprove || onReject) &&
              c.flagStatus !== "approved" &&
              c.flagStatus !== "rejected";
            return (
              <TableRow key={`${c.id ?? c.name}-${i}`} className={s.row}>
                <TableCell className="w-[140px] px-2 py-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 shrink-0">{s.icon}</span>
                    <span className="font-medium text-xs leading-snug">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <Badge
                    variant="outline"
                    className={`w-fit text-[10px] px-1.5 py-0 h-5 font-normal ${s.badge}`}
                  >
                    {c.result}
                  </Badge>
                </TableCell>
                <TableCell className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
                  {c.reason}
                </TableCell>
                <TableCell className="w-[220px] px-2 py-1.5 text-xs leading-snug">
                  {canResolve ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {onApprove ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-7 px-2 text-[11px] border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                          disabled={actionPending}
                          onClick={() => onApprove(c.id!)}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                      ) : null}
                      {onReject ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                          disabled={actionPending}
                          onClick={() => onReject(c.id!)}
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      ) : null}
                    </div>
                  ) : c.action === "No action required." ? (
                    "—"
                  ) : (
                    c.action
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </div>
);

export const overallStatus = (checks: VerificationCheck[]): "Pending Review" | "Quoted" => {
  return checks.some((c) => c.result === "Requires Review") ? "Pending Review" : "Quoted";
};
