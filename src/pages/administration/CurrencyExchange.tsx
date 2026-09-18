import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { useListCurrencyRates } from "@/api/currency-rates";
import { compactQuery } from "@/lib/list-query";
import { getCurrencies } from "@/config/currencies";

const RATE_CURRENCIES = getCurrencies().filter((code) => code !== "ALL");

const formatUtc = (iso?: string) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

const formatRate = (rate?: number) => {
  if (typeof rate !== "number") return "—";
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

const CurrencyExchange = () => {
  const [currency, setCurrency] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filters = useMemo(
    () => compactQuery({ currency: currency.trim() || undefined }),
    [currency],
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const listQuery = {
    ...filters,
    latestOnly: true,
    pageNumber: page,
    pageSize,
  };
  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useListCurrencyRates(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(
    1,
    pageData?.totalPages ?? pageData?.pageCount ?? 1,
  );
  const hasFilters = Boolean(currency.trim());

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Currency rates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Latest published rates to ALL from the currency feed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">FX rate history</CardTitle>
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
                  onClick={() => setCurrency("")}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Currency
                </Label>
                <Select
                  value={currency || "__any__"}
                  onValueChange={(v) => setCurrency(v === "__any__" ? "" : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">All currencies</SelectItem>
                    {RATE_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Rate to ALL</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Fetched</TableHead>
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
                      No currency rates match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow
                      key={row.id ?? `${row.currency}-${row.publishedAtUtc}`}
                    >
                      <TableCell className="font-medium">
                        {row.currency ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRate(row.rateToAll)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatUtc(row.publishedAtUtc)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatUtc(row.fetchedAtUtc)}
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
              pageSizeOptions={[10, 20, 50]}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default CurrencyExchange;
