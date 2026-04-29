import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { seedProducts } from "@/data/products";
import { getCustomer, fullName } from "@/data/customers";
import { listDocuments } from "@/data/documents";
import { listCoverages } from "@/data/coverages";
import { listTemplates } from "@/data/templates";
import type { PremiumResult } from "./PremiumCalculation";

export type CheckResult = "Passed" | "Warning" | "Requires Review";

export type VerificationCheck = {
  name: string;
  result: CheckResult;
  reason: string;
  action: string;
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

const resultStyle: Record<CheckResult, { badge: string; row: string; icon: JSX.Element }> = {
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

export const computeVerification = (
  args: Omit<Props, "onChecksComputed">
): VerificationCheck[] => {
  const {
    productId,
    versionId,
    templateId,
    policyHolderId,
    insuredId,
    premium,
    loanOutstanding,
  } = args;

  const product = seedProducts.find((p) => p.id === productId);
  const template = listTemplates(productId, versionId).find((t) => t.id === templateId);
  const holder = policyHolderId ? getCustomer(policyHolderId) : undefined;
  const insured = insuredId ? getCustomer(insuredId) : undefined;

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

  // 1. PEP check
  if (product?.flags.pep) {
    const pepHolder = holder?.pepStatus === "Yes";
    const pepInsured = insured?.pepStatus === "Yes";
    const pepUnknown = holder?.pepStatus === "Unknown" || insured?.pepStatus === "Unknown";
    if (pepHolder || pepInsured) {
      const who = [pepHolder && holder ? fullName(holder) : null, pepInsured && insured ? fullName(insured) : null]
        .filter(Boolean).join(", ");
      checks.push({
        name: "PEP Check",
        result: "Requires Review",
        reason: `Politically Exposed Person flagged: ${who}.`,
        action: "Compliance team must approve before quotation.",
      });
    } else if (pepUnknown) {
      checks.push({
        name: "PEP Check",
        result: "Warning",
        reason: "PEP status is Unknown for one or more parties.",
        action: "Confirm PEP declaration with the customer.",
      });
    } else {
      checks.push({
        name: "PEP Check",
        result: "Passed",
        reason: "No PEP flags on policy holder or insured.",
        action: "No action required.",
      });
    }
  }

  // 2. Insured amount threshold
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

  // 3. Total customer exposure
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

  // 4. Manual underwriting
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

  // 5. Missing mandatory documents
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

  // 6. Premium manually overridden
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

  // 7. FX rate manually overridden
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check</TableHead>
                  <TableHead className="w-[150px]">Result</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Action Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No verification checks configured for this product.
                    </TableCell>
                  </TableRow>
                ) : (
                  checks.map((c, i) => {
                    const s = resultStyle[c.result];
                    return (
                      <TableRow key={i} className={s.row}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {s.icon}
                            <span className="font-medium text-sm">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={s.badge}>{c.result}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.reason}</TableCell>
                        <TableCell className="text-sm">{c.action}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
