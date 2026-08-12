import { useEffect, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { seedProducts } from "@/data/products";
import { getCustomer } from "@/data/customers";
import { listDocuments } from "@/data/documents";
import { listCoverages } from "@/data/coverages";
import { listTemplates } from "@/data/templates";
import type { PremiumResult } from "./PremiumCalculation";

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

type Props = {
  productId: string;
  versionId: string;
  templateId: string;
  currency: string;
  policyHolderId: string;
  insuredId: string;
  premium?: PremiumResult | null;
  loanOutstanding?: number;
  onChecksComputed?: (checks: VerificationCheck[]) => void;
};

const HIGH_INSURED_THRESHOLD = 200_000;
const HIGH_EXPOSURE_THRESHOLD = 250_000;

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

export const computeVerification = (
  args: Omit<Props, "onChecksComputed">
): VerificationCheck[] => {
  const {
    productId,
    versionId,
    templateId,
    policyHolderId,
    premium,
    loanOutstanding,
  } = args;

  const product = seedProducts.find((p) => p.id === productId);
  const template = listTemplates(productId, versionId).find((t) => t.id === templateId);
  const holder = policyHolderId ? getCustomer(policyHolderId) : undefined;

  // Determine sum insured from mandatory coverages in template
  const coverages = listCoverages(productId, versionId);
  const mandatory = coverages.filter(
    (c) => c.coverageType === "Mandatory" && template?.includedCoverageIds.includes(c.id)
  );
  const sumInsured = mandatory.reduce((total, c) => {
    const si =
      c.sumInsuredType === "Based on loan amount"
        ? loanOutstanding ?? c.defaultSumInsured
        : c.defaultSumInsured;
    return total + si;
  }, 0);

  const docs = listDocuments(productId, versionId);
  const checks: VerificationCheck[] = [];

  // 1. Insured amount threshold
  if (product?.flags.highInsuredAmount) {
    if (sumInsured >= HIGH_INSURED_THRESHOLD) {
      checks.push({
        name: "Insured Amount Threshold",
        result: "Requires Review",
        reason: `Sum insured ${sumInsured.toLocaleString()} ${args.currency} ≥ threshold ${HIGH_INSURED_THRESHOLD.toLocaleString()}.`,
        action: "Underwriter sign-off required for high coverage.",
      });
    } else {
      checks.push({
        name: "Insured Amount Threshold",
        result: "Passed",
        reason: `Sum insured ${sumInsured.toLocaleString()} ${args.currency} below threshold.`,
        action: "No action required.",
      });
    }
  }

  // 2. Total customer exposure
  if (product?.flags.totalExposure && holder) {
    const projected = (holder.totalExposure ?? 0) + sumInsured;
    if (projected >= HIGH_EXPOSURE_THRESHOLD) {
      checks.push({
        name: "Total Customer Exposure",
        result: "Requires Review",
        reason: `Projected exposure ${projected.toLocaleString()} EUR exceeds limit ${HIGH_EXPOSURE_THRESHOLD.toLocaleString()}.`,
        action: "Risk team must approve aggregate exposure.",
      });
    } else if (projected >= HIGH_EXPOSURE_THRESHOLD * 0.8) {
      checks.push({
        name: "Total Customer Exposure",
        result: "Warning",
        reason: `Projected exposure ${projected.toLocaleString()} EUR is approaching the limit.`,
        action: "Notify the relationship manager.",
      });
    } else {
      checks.push({
        name: "Total Customer Exposure",
        result: "Passed",
        reason: `Projected exposure ${projected.toLocaleString()} EUR within limits.`,
        action: "No action required.",
      });
    }
  }

  // 3. Manual underwriting
  if (product?.flags.manualUnderwriting) {
    checks.push({
      name: "Manual Underwriting Required",
      result: "Requires Review",
      reason: "Product configuration mandates manual underwriting on every offer.",
      action: "Route to underwriter queue.",
    });
  } else {
    checks.push({
      name: "Manual Underwriting Required",
      result: "Passed",
      reason: "Product permits straight-through processing.",
      action: "No action required.",
    });
  }

  // 4. Missing mandatory documents
  const mandatoryDocs = docs.filter((d) => d.isMandatory);
  if (mandatoryDocs.length > 0) {
    // No collected-docs feature yet → treat all mandatory as missing in the demo
    checks.push({
      name: "Missing Mandatory Documents",
      result: "Requires Review",
      reason: `${mandatoryDocs.length} mandatory document(s) not yet collected: ${mandatoryDocs.map((d) => d.name).join(", ")}.`,
      action: "Collect outstanding documents before issuance.",
    });
  } else {
    checks.push({
      name: "Missing Mandatory Documents",
      result: "Passed",
      reason: "No mandatory documents configured for this product version.",
      action: "No action required.",
    });
  }

  // 5. Premium manually overridden
  if (premium?.manualOverride) {
    checks.push({
      name: "Premium Manually Overridden",
      result: "Requires Review",
      reason: `Manual premium ${premium.manualOverride.amount.toLocaleString()} ${args.currency} entered. Reason: ${premium.manualOverride.reason || "not provided"}.`,
      action: "Management approval required before issuance.",
    });
  } else {
    checks.push({
      name: "Premium Manually Overridden",
      result: "Passed",
      reason: "Premium calculated from configured rate tables.",
      action: "No action required.",
    });
  }

  // 6. FX rate manually overridden
  if (premium?.fxSource === "Manual" || premium?.fxSource === "Override") {
    checks.push({
      name: "FX Rate Manually Overridden",
      result: "Warning",
      reason: `Conversion uses a ${premium.fxSource.toLowerCase()} rate of ${premium.fxRate}.`,
      action: "Verify the override reason on the FX history.",
    });
  } else if (args.currency !== "EUR") {
    checks.push({
      name: "FX Rate Manually Overridden",
      result: "Passed",
      reason: `Latest automatic rate (${premium?.fxRate ?? "—"}) applied.`,
      action: "No action required.",
    });
  }

  return checks;
};

export const overallStatus = (checks: VerificationCheck[]): "Pending Review" | "Quoted" => {
  return checks.some((c) => c.result === "Requires Review") ? "Pending Review" : "Quoted";
};

const VerificationStep = (props: Props) => {
  const checks = useMemo(
    () => computeVerification(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.productId,
      props.versionId,
      props.templateId,
      props.currency,
      props.policyHolderId,
      props.insuredId,
      props.premium,
      props.loanOutstanding,
    ]
  );

  // Notify parent (effect, not memo, to avoid setState-during-render loops)
  useEffect(() => {
    props.onChecksComputed?.(checks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks]);

  const review = checks.filter((c) => c.result === "Requires Review").length;
  const warnings = checks.filter((c) => c.result === "Warning").length;
  const passed = checks.filter((c) => c.result === "Passed").length;
  const overall = overallStatus(checks);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className={overall === "Pending Review" ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-500/40 bg-emerald-500/5"}>
          <CardHeader className="pb-2">
            <CardDescription>Resulting Status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {overall === "Pending Review" ? (
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="text-lg font-semibold">{overall}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Requires Review</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-destructive">{review}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Warnings</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{warnings}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Passed</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{passed}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Verification Checks
          </CardTitle>
          <CardDescription>
            Automatic checks based on the product configuration, parties, premium, and FX usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationChecksTable checks={checks} />
        </CardContent>
      </Card>

      <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {overall === "Pending Review" ? (
          <>
            <strong className="text-foreground">One or more checks require review.</strong> Saving this offer
            will route it to the appropriate queue with status <Badge variant="outline">Pending Review</Badge>.
          </>
        ) : (
          <>
            <strong className="text-foreground">All checks passed.</strong> The offer can be saved as
            <Badge variant="outline" className="mx-1">Quoted</Badge> or fast-tracked to
            <Badge variant="outline" className="ml-1">Approved</Badge>.
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationStep;
