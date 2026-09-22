import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { FilterGrid } from "@/components/FilterGrid";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { ProductCombobox } from "@/components/ProductCombobox";
import { PersonCombobox } from "@/components/PersonCombobox";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { OfferCombobox } from "@/components/OfferCombobox";
import { AccessDeniedOr } from "@/components/AccessDeniedNotice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Eye, Loader2, Printer, ShieldCheck } from "lucide-react";
import { getCurrencies } from "@/config/currencies";
import { openPolicyPrint, openPolicyPrintWindow, useListPolicies } from "@/api/policies";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  formatCoverageTerm,
  formatPolicyDate,
  formatPolicyMoney,
  policyNumberLabel,
  policyStatusClass,
  policyStatusLabel,
} from "./policy-ui";

const COL_COUNT = 8;

const toDate = (isoDay: string) => {
  if (!isoDay) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const PoliciesList = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [currency, setCurrency] = useState("__all__");
  const [issuedFrom, setIssuedFrom] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [coverageOn, setCoverageOn] = useState("");
  const [partyId, setPartyId] = useState("");
  const [personId, setPersonId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const filters = useMemo(
    () =>
      compactQuery({
        productId: productId.trim() || undefined,
        offerId: offerId.trim() || undefined,
        ...(currency !== "__all__" ? { currency } : {}),
        issuedFromUtc: dateToUtcStart(issuedFrom),
        issuedToUtc: dateToUtcEnd(issuedTo),
        coverageOn: coverageOn.trim() || undefined,
        partyId: partyId.trim() || undefined,
        personId: personId.trim() || undefined,
      }),
    [productId, offerId, currency, issuedFrom, issuedTo, coverageOn, partyId, personId],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };

  const { data: policiesPage, isLoading, isFetching, isError, error } = useListPolicies(listQuery);

  const items = policiesPage?.items ?? [];

  const totalCount = policiesPage?.totalCount ?? 0;
  const totalPages = Math.max(1, policiesPage?.totalPages ?? policiesPage?.pageCount ?? 1);

  const clearFilters = () => {
    setProductId("");
    setOfferId("");
    setCurrency("__all__");
    setIssuedFrom("");
    setIssuedTo("");
    setCoverageOn("");
    setPartyId("");
    setPersonId("");
  };

  const handlePrint = (policyId?: string) => {
    if (!policyId) {
      toast.error("Policy id is missing");
      return;
    }
    const printWindow = openPolicyPrintWindow();
    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to print the policy.");
      return;
    }
    void (async () => {
      try {
        setPrintingId(policyId);
        await openPolicyPrint(policyId, printWindow);
      } catch (err) {
        printWindow.close();
        toast.error(err instanceof Error ? err.message : "Failed to print policy");
      } finally {
        setPrintingId(null);
      }
    })();
  };

  const hasFilters =
    productId ||
    offerId ||
    currency !== "__all__" ||
    issuedFrom ||
    issuedTo ||
    coverageOn ||
    partyId ||
    personId;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issued life insurance policies in force.
          </p>
        </div>
      </div>

      <AccessDeniedOr error={error}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> All Policies
                </CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading…"
                    : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
                </CardDescription>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <FilterGrid>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <ProductCombobox
                  value={productId}
                  onValueChange={setProductId}
                  placeholder="All products"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Offer</Label>
                <OfferCombobox
                  value={offerId}
                  onValueChange={setOfferId}
                  placeholder="All offers"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All currencies</SelectItem>
                    {getCurrencies().map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Party</Label>
                <CustomerCombobox
                  value={partyId}
                  onValueChange={setPartyId}
                  placeholder="All parties"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Insured person</Label>
                <PersonCombobox
                  value={personId}
                  onValueChange={setPersonId}
                  placeholder="All people"
                  allowClear
                  triggerClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Issued from</Label>
                <DatePicker
                  value={toDate(issuedFrom)}
                  onChange={(d) => setIssuedFrom(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="From date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Issued to</Label>
                <DatePicker
                  value={toDate(issuedTo)}
                  onChange={(d) => setIssuedTo(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="To date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Coverage on</Label>
                <DatePicker
                  value={toDate(coverageOn)}
                  onChange={(d) => setCoverageOn(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Coverage date"
                  buttonClassName="h-9"
                />
              </div>
            </FilterGrid>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sum Insured</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[88px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={COL_COUNT} label="Loading policies…" />
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={COL_COUNT}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Policies could not be loaded.
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COL_COUNT}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No policies match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((p) => (
                    <TableRow key={p.id ?? `${p.serial}-${p.issuedOnUtc}`}>
                      <TableCell className="font-mono text-sm font-medium">
                        {policyNumberLabel(p.serial, p.id)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.productName?.trim() || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatPolicyMoney(p.sumInsured, p.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPolicyMoney(p.firstPeriodChargePremium, p.currency)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatCoverageTerm(p.coverageTerm)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatPolicyDate(p.issuedOnUtc)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${policyStatusClass(p.status)}`}
                        >
                          {policyStatusLabel(p.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => p.id && navigate(`/policies/${p.id}`)}
                            disabled={!p.id}
                            title="View policy"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:text-emerald-300"
                            onClick={() => handlePrint(p.id)}
                            disabled={!p.id || printingId === p.id}
                            title="Print policy"
                          >
                            {printingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Printer className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
      </AccessDeniedOr>
    </AppShell>
  );
};

export default PoliciesList;
