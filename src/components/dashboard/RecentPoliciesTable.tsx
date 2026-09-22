import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { TableLoadingRow } from "@/components/Loader";
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
import { ShieldCheck } from "lucide-react";
import { useListPolicies } from "@/api/policies";
import {
  formatPolicyDate,
  formatPolicyMoney,
  policyNumberLabel,
  policyStatusClass,
  policyStatusLabel,
} from "@/pages/policies/policy-ui";

const COL_COUNT = 5;

const RecentPoliciesTable = () => {
  const navigate = useNavigate();
  const { data: policiesPage, isLoading } = useListPolicies({
    pageNumber: 1,
    pageSize: 10,
  });

  const policies = useMemo(
    () =>
      [...(policiesPage?.items ?? [])]
        .sort((a, b) =>
          (b.issuedOnUtc ?? "").localeCompare(a.issuedOnUtc ?? ""),
        )
        .slice(0, 6),
    [policiesPage?.items],
  );

  return (
    <Card className="shadow-card border-border overflow-hidden h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-md bg-accent-soft text-accent flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Policies
            </h3>
            <p className="text-xs text-muted-foreground">Latest issued cover</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/policies">View all</Link>
        </Button>
      </div>
      <div className="min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Policy
              </TableHead>
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Product
              </TableHead>
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">
                Premium
              </TableHead>
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRow colSpan={COL_COUNT} label="Loading policies…" />
            ) : policies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COL_COUNT}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  No policies yet.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((p) => (
                <TableRow
                  key={p.id ?? `${p.serial}-${p.issuedOnUtc}`}
                  className={p.id ? "cursor-pointer" : undefined}
                  onClick={() => p.id && navigate(`/policies/${p.id}`)}
                >
                  <TableCell className="py-2 px-3">
                    {p.id ? (
                      <Link
                        to={`/policies/${p.id}`}
                        className="font-mono text-xs text-accent hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {policyNumberLabel(p.serial, p.id)}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">
                        {policyNumberLabel(p.serial, p.id)}
                      </span>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatPolicyDate(p.issuedOnUtc)}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm max-w-[10rem] truncate">
                    {p.policyHolderName?.trim() || "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm max-w-[10rem] truncate">
                    {p.productName?.trim() || p.productId || "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3 font-mono text-sm text-right tabular-nums">
                    {formatPolicyMoney(p.firstPeriodChargePremium, p.currency)}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge
                      className={`border-0 ${policyStatusClass(p.status)}`}
                    >
                      {policyStatusLabel(p.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentPoliciesTable;
