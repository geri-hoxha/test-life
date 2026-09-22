import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetInvoice } from "@/api/invoices";
import type { InvoicesInvoiceLineResponse } from "@/api/types";
import { ArrowLeft, ExternalLink, RotateCcw, ShieldCheck } from "lucide-react";
import FiscalizationRetryDialog from "./FiscalizationRetryDialog";
import {
  formatInvoiceDate,
  formatInvoiceDateTime,
  formatInvoiceMoney,
  humanizeInvoiceEnum,
  invoiceStatusClass,
  invoiceStatusLabel,
  invoiceTypeClass,
  invoiceTypeLabel,
  shortInvoiceId,
} from "./invoice-ui";

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div className="text-sm font-medium mt-0.5 break-all">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const InvoiceLineCard = ({
  line,
  currency,
}: {
  line: InvoicesInvoiceLineResponse;
  currency?: string;
}) => (
  <Card className="shadow-none bg-muted/40">
    <CardContent className="p-3 grid grid-cols-2 gap-x-3 gap-y-2">
      <Field label="Fiscal name" value={line.fiscalName} />
      <Field label="Name" value={line.name} />
      <Field
        label="Type"
        value={
          <span className="text-xs">{humanizeInvoiceEnum(line.type)}</span>
        }
      />
      <Field
        label="Line gross"
        value={formatInvoiceMoney(line.lineGrossAmount, currency)}
      />
      <Field
        label="Net / unit"
        value={formatInvoiceMoney(line.netAmountPerUnit, currency)}
      />
      <Field
        label="VAT %"
        value={
          line.vatPercentage != null ? (
            <span className="font-mono text-xs">{line.vatPercentage}%</span>
          ) : undefined
        }
      />
    </CardContent>
  </Card>
);

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [retryOpen, setRetryOpen] = useState(false);
  const {
    data: invoice,
    isLoading,
    isError,
  } = useGetInvoice(id ?? "", { enabled: Boolean(id) });

  if (isLoading) {
    return (
      <AppShell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/invoices")}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Button>
        <PageLoader label="Loading invoice…" />
      </AppShell>
    );
  }

  if (isError || !invoice) {
    return (
      <AppShell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/invoices")}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Button>
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">
            This invoice could not be loaded.
          </p>
          <Button asChild className="mt-4">
            <Link to="/invoices">Back to invoices</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const lines = invoice.lines ?? [];
  const currency = invoice.currency;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/invoices")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Invoice
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {invoice.number != null
                ? `#${invoice.number}`
                : shortInvoiceId(invoice.id ?? "")}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${invoiceTypeClass(invoice.type)}`}
            >
              {invoiceTypeLabel(invoice.type)}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${invoiceStatusClass(invoice.status)}`}
            >
              {invoiceStatusLabel(invoice.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {invoice.customerName?.trim() || "Invoice"}
            {invoice.issuedOn
              ? ` · issued ${formatInvoiceDateTime(invoice.issuedOn)}`
              : ""}
          </p>
        </div>
        <div className="flex ml-auto items-center gap-2 ">
          {invoice.qrUrl ? (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <a href={invoice.qrUrl} target="_blank" rel="noopener noreferrer">
                Open fiscal verification <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-2" disabled>
              Open fiscal verification <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {invoice.policyId ? (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link to={`/policies/${invoice.policyId}`}>
                <ShieldCheck className="h-4 w-4" /> Open policy
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-2" disabled>
              <ShieldCheck className="h-4 w-4" /> Open policy
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 ml-auto"
            onClick={() => setRetryOpen(true)}
            disabled={!invoice.id}
          >
            <RotateCcw className="h-4 w-4" /> Retry fiscalization
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Net</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatInvoiceMoney(invoice.totalNetAmount, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>VAT</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatInvoiceMoney(invoice.totalVatAmount, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Gross</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">
              {formatInvoiceMoney(invoice.totalGrossAmount, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription>Due date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold font-mono">
              {formatInvoiceDate(invoice.dueDate)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field
              label="Invoice ID"
              value={<span className="font-mono text-xs">{invoice.id}</span>}
            />
            <Field
              label="Number"
              value={
                invoice.number != null ? (
                  <span className="font-mono">{invoice.number}</span>
                ) : undefined
              }
            />
            <Field
              label="Type"
              value={
                invoice.type ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoiceTypeClass(invoice.type)}`}
                  >
                    {invoiceTypeLabel(invoice.type)}
                  </span>
                ) : undefined
              }
            />
            <Field
              label="Status"
              value={
                invoice.status ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoiceStatusClass(invoice.status)}`}
                  >
                    {invoiceStatusLabel(invoice.status)}
                  </span>
                ) : undefined
              }
            />
            <Field
              label="Policy serial"
              value={
                invoice.policySerial != null ? (
                  <span className="font-mono">{invoice.policySerial}</span>
                ) : undefined
              }
            />
            <Field
              label="Policy ID"
              value={
                invoice.policyId ? (
                  <span className="font-mono text-xs">{invoice.policyId}</span>
                ) : undefined
              }
            />
            <Field
              label="Premium installment ID"
              value={
                invoice.premiumInstallmentId ? (
                  <span className="font-mono text-xs">
                    {invoice.premiumInstallmentId}
                  </span>
                ) : undefined
              }
            />
            <Field label="Customer" value={invoice.customerName} />
            <Field
              label="Provider"
              value={
                invoice.provider ? (
                  <Badge variant="outline">{invoice.provider}</Badge>
                ) : undefined
              }
            />
            <Field
              label="Currency"
              value={
                currency ? (
                  <Badge variant="outline">{currency}</Badge>
                ) : undefined
              }
            />
            <Field
              label="Service period start"
              value={
                <span className="font-mono text-xs">
                  {formatInvoiceDate(invoice.servicePeriod?.startDate)}
                </span>
              }
            />
            <Field
              label="Service period end"
              value={
                <span className="font-mono text-xs">
                  {formatInvoiceDate(invoice.servicePeriod?.endDate)}
                </span>
              }
            />
            <Field
              label="Due date"
              value={
                <span className="font-mono text-xs">
                  {formatInvoiceDate(invoice.dueDate)}
                </span>
              }
            />
            <Field
              label="Issued on"
              value={
                <span className="font-mono text-xs">
                  {formatInvoiceDateTime(invoice.issuedOn)}
                </span>
              }
            />
            <Field
              label="Total net"
              value={formatInvoiceMoney(invoice.totalNetAmount, currency)}
            />
            <Field
              label="Total VAT"
              value={formatInvoiceMoney(invoice.totalVatAmount, currency)}
            />
            <Field
              label="Total gross"
              value={formatInvoiceMoney(invoice.totalGrossAmount, currency)}
            />
            <Field
              label="Lines"
              value={
                invoice.lineCount != null
                  ? String(invoice.lineCount)
                  : String(lines.length)
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fiscalization</CardTitle>
            <CardDescription>
              IIC, FIC and verification QR from the fiscal provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="IIC"
                value={
                  invoice.iic ? (
                    <span className="font-mono text-xs">{invoice.iic}</span>
                  ) : undefined
                }
              />
              <Field
                label="FIC"
                value={
                  invoice.fic ? (
                    <span className="font-mono text-xs">{invoice.fic}</span>
                  ) : undefined
                }
              />
              <Field
                label="QR URL"
                value={
                  invoice.qrUrl ? (
                    <span className="font-mono text-[11px] text-muted-foreground break-all font-normal">
                      {invoice.qrUrl}
                    </span>
                  ) : undefined
                }
              />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Lines
                <span className="ml-1.5 normal-case tracking-normal text-muted-foreground/80">
                  ({lines.length})
                </span>
              </div>
              {lines.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No lines on this invoice.
                </span>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {lines.map((line) => (
                    <InvoiceLineCard
                      key={line.id ?? line.lineNumber}
                      line={line}
                      currency={currency}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <FiscalizationRetryDialog
        invoice={invoice}
        open={retryOpen}
        onOpenChange={setRetryOpen}
      />
    </AppShell>
  );
};

export default InvoiceDetail;
