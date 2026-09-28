import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import { AccessDeniedOr } from "@/components/AccessDeniedNotice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListPolicyPlans } from "@/api/policy-plans";
import type {
  PolicyPlansPolicyPlanResponse,
  PolicyPlansPolicyPlanRules,
} from "@/api/types";
import { isApiForbidden } from "@/lib/api-error";
import { Eye } from "lucide-react";

const RULE_KEYS: (keyof PolicyPlansPolicyPlanRules)[] = [
  "offerSchedule",
  "continuation",
  "coverageCadence",
  "billingCadence",
  "premiumCalculation",
  "maturityRule",
  "renewalPlanning",
];

const planName = (plan: PolicyPlansPolicyPlanResponse) =>
  plan.name?.sq || plan.text || plan.value;

const PolicyPlanTypesList = () => {
  const [viewing, setViewing] = useState<PolicyPlansPolicyPlanResponse | null>(
    null,
  );
  const { data, isLoading, isFetching, error } = useListPolicyPlans();
  const accessDenied = isApiForbidden(error);

  const items = data ?? [];

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Policy plan types
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference catalog of policy plan types and the rules that govern how
            each one prices and renews.
          </p>
        </div>
      </div>

      <AccessDeniedOr error={error}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Policy plan types</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading…"
                : `${items.length} total${isFetching && !isLoading ? " · updating…" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Value</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[90px] text-right">Rules</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableLoadingRow colSpan={4} />
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-10 text-sm text-muted-foreground"
                      >
                        No policy plan types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((plan) => (
                      <TableRow key={plan.value}>
                        <TableCell className="font-mono text-xs min-w-20">
                          {plan.value}
                        </TableCell>
                        <TableCell className="font-medium min-w-40">
                          {planName(plan)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[500px] whitespace-normal break-words">
                          {plan.description?.sq || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => setViewing(plan)}
                            title="View rules"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </AccessDeniedOr>

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing ? planName(viewing) : ""}</DialogTitle>
            {viewing?.description?.sq && (
              <DialogDescription>{viewing.description.sq}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {viewing &&
              RULE_KEYS.map((key) => {
                const rule = viewing.rules?.[key];
                if (!rule) return null;
                const settingName = rule.setting?.name?.sq || key;
                const settingDescription = rule.setting?.description?.sq;
                const valueName = rule.name?.sq || rule.value;
                const valueDescription = rule.description?.sq;
                return (
                  <div key={key} className="rounded-md border p-3 space-y-1.5">
                    <div>
                      <div className="text-sm font-medium">{settingName}</div>
                      {settingDescription && (
                        <p className="text-xs text-muted-foreground">
                          {settingDescription}
                        </p>
                      )}
                    </div>
                    <div className="border-t pt-1.5">
                      <div className="text-sm">{valueName}</div>
                      {valueDescription && (
                        <p className="text-xs text-muted-foreground">
                          {valueDescription}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            {viewing && !RULE_KEYS.some((key) => viewing.rules?.[key]) && (
              <p className="text-sm text-muted-foreground">
                No rules defined for this plan.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default PolicyPlanTypesList;
