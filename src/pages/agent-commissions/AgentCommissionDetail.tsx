import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader, TableLoadingRow } from "@/components/Loader";
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
import { useGetAgent } from "@/api/agents";
import { useGetAgentCommission, useGetAgentCommissionsSummary } from "@/api/agent-commissions";
import { ArrowLeft } from "lucide-react";
import {
  basisLabel,
  businessTypeLabel,
  entryTypeClass,
  entryTypeLabel,
  formatCommissionDateTime,
  formatCommissionMoney,
  formatCommissionRate,
  shortCommissionId,
} from "./commission-ui";

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5 break-all">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const AgentCommissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: commission, isLoading, isError } = useGetAgentCommission(id ?? "", {
    enabled: Boolean(id),
  });
  const agentId = commission?.agentId?.trim() ?? "";
  const { data: agent } = useGetAgent(agentId, {
    enabled: Boolean(agentId),
  });
  const { data: summary, isLoading: summaryLoading } = useGetAgentCommissionsSummary(
    { agentId },
    { enabled: Boolean(agentId) },
  );
  const summaryLines = summary?.lines ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agent-commissions")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Agent commissions
        </Button>
        <PageLoader label="Loading commission…" />
      </AppShell>
    );
  }

  if (isError || !commission) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agent-commissions")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Agent commissions
        </Button>
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This commission could not be loaded.</p>
          <Button asChild className="mt-4">
            <Link to="/agent-commissions">Back to commissions</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const agentLabel = agent?.displayName?.trim() || commission.agentId;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/agent-commissions")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Agent commissions
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Agent commission
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {shortCommissionId(commission.id ?? "")}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${entryTypeClass(commission.entryType)}`}
            >
              {entryTypeLabel(commission.entryType)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {commission.productName?.trim() || "Commission"}
            {commission.postedOnUtc ? ` · posted ${formatCommissionDateTime(commission.postedOnUtc)}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {formatCommissionMoney(commission.amount, commission.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Applied rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatCommissionRate(commission.appliedRate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Basis amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatCommissionMoney(commission.basisAmount, commission.currency)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{basisLabel(commission.basis)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Business type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{businessTypeLabel(commission.businessType)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entry</CardTitle>
            <CardDescription>Posted commission calculation.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Commission ID" value={<span className="font-mono text-xs">{commission.id}</span>} />
            <Field
              label="Posted on"
              value={<span className="font-mono text-xs">{formatCommissionDateTime(commission.postedOnUtc)}</span>}
            />
            <Field
              label="Entry type"
              value={
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entryTypeClass(commission.entryType)}`}
                >
                  {entryTypeLabel(commission.entryType)}
                </span>
              }
            />
            <Field label="Business type" value={businessTypeLabel(commission.businessType)} />
            <Field label="Basis" value={basisLabel(commission.basis)} />
            <Field label="Applied rate" value={formatCommissionRate(commission.appliedRate)} />
            <Field
              label="Currency"
              value={commission.currency ? <Badge variant="outline">{commission.currency}</Badge> : undefined}
            />
            <Field
              label="Calculation version"
              value={commission.calculationVersion != null ? String(commission.calculationVersion) : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">References</CardTitle>
            <CardDescription>Agent, product, policy, and configuration used for this entry.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field
              label="Agent"
              value={
                commission.agentId ? (
                  <Link
                    to={`/agents/${encodeURIComponent(commission.agentId)}`}
                    className="text-primary hover:underline"
                    title={commission.agentId}
                  >
                    {agentLabel}
                  </Link>
                ) : undefined
              }
            />
            <Field
              label="Product"
              value={
                commission.productId ? (
                  <Link
                    to={`/products/${commission.productId}`}
                    className="text-primary hover:underline"
                    title={commission.productId}
                  >
                    {commission.productName?.trim() || shortCommissionId(commission.productId)}
                  </Link>
                ) : undefined
              }
            />
            <Field
              label="Policy"
              value={
                commission.policyId ? (
                  <Link
                    to={`/policies/${commission.policyId}`}
                    className="text-primary hover:underline font-mono text-xs"
                    title={commission.policyId}
                  >
                    {commission.policySerial ?? commission.policyId}
                  </Link>
                ) : undefined
              }
            />
            <Field
              label="Premium installment"
              value={
                commission.premiumInstallmentId ? (
                  <span className="font-mono text-xs">{commission.premiumInstallmentId}</span>
                ) : undefined
              }
            />
            <Field
              label="Product configuration"
              value={
                commission.agentProductConfigurationId ? (
                  <span className="font-mono text-xs" title={commission.agentProductConfigurationId}>
                    {commission.agentProductConfigurationId}
                  </span>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Totals for this agent by currency and business type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead>Business type</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Accrued</TableHead>
                  <TableHead className="text-right">Reversed</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!agentId ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                      This commission has no agent to summarize.
                    </TableCell>
                  </TableRow>
                ) : summaryLoading ? (
                  <TableLoadingRow colSpan={6} label="Loading summary…" />
                ) : summaryLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                      No commission totals for this agent.
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryLines.map((line, index) => (
                    <TableRow key={`${line.currency}-${line.businessType}-${index}`}>
                      <TableCell>
                        {line.currency ? <Badge variant="outline">{line.currency}</Badge> : "—"}
                      </TableCell>
                      <TableCell>{businessTypeLabel(line.businessType)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.entryCount ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCommissionMoney(line.accruedAmount, line.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCommissionMoney(line.reversedAmount, line.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatCommissionMoney(line.netAmount, line.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default AgentCommissionDetail;
