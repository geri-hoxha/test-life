import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
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
import { Calculator, Eye, RefreshCw } from "lucide-react";
import {
  useCalculateOfferYears,
  useListRenewalsDue,
  useRenewOffer,
} from "@/api/offers";
import { mapApiProduct, useListProducts } from "@/api/products";
import { ApiError } from "@/api/client";
import { getApiErrorMessage, toastApiError } from "@/lib/api-error";

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

const fmtDate = (utc?: string) => utc?.slice(0, 10) ?? "—";

const RenewalsDue = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const { data: renewalsPage, isLoading } = useListRenewalsDue({
    pageNumber: page,
    pageSize,
  });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });

  const calculateYears = useCalculateOfferYears();
  const renewOffer = useRenewOffer();

  const rows = renewalsPage?.items ?? [];
  const totalCount = renewalsPage?.totalCount ?? 0;
  const totalPages = Math.max(1, renewalsPage?.totalPages ?? renewalsPage?.pageCount ?? 1);

  const productNameById = useMemo(() => {
    const products = (productsPage?.items ?? []).map(mapApiProduct);
    return Object.fromEntries(products.map((p) => [p.id, p.name]));
  }, [productsPage?.items]);

  /** Unpriced offers need their next year calculated before the renewal can be issued. */
  const handlePriceNextYear = async (offerId: string) => {
    setPendingOfferId(offerId);
    try {
      await calculateYears.mutateAsync(offerId);
      toast.success("Next year priced — the offer is now ready to renew");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        toast.warning(getApiErrorMessage(err, "The next year cannot be priced yet."));
        return;
      }
      toastApiError(err, "Failed to price the next year");
    } finally {
      setPendingOfferId(null);
    }
  };

  const handleRenew = async (offerId: string) => {
    setPendingOfferId(offerId);
    try {
      await renewOffer.mutateAsync(offerId);
      toast.success("Renewal issued");
    } catch (err) {
      toastApiError(err, "Failed to renew");
    } finally {
      setPendingOfferId(null);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Offers
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Renewals Due</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Offers whose next covered year is due. Priced years can be renewed directly;
          the rest need the next year calculated first.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Worklist</CardTitle>
          <CardDescription>
            {totalCount} {totalCount === 1 ? "offer" : "offers"} awaiting renewal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[90px]">Next Year</TableHead>
                  <TableHead>Current Cover Ends</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      No renewals are due right now.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const offerId = r.offerId ?? "";
                    const busy = pendingOfferId === offerId;
                    return (
                      <TableRow key={offerId}>
                        <TableCell>
                          <Link
                            to={`/offers/${offerId}`}
                            className="font-mono text-xs font-medium text-primary hover:underline"
                            title={offerId}
                          >
                            {shortId(offerId)}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {productNameById[r.productId ?? ""] ?? r.productId ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{r.nextYear ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {fmtDate(r.currentPolicyEffectiveToUtc)}
                        </TableCell>
                        <TableCell>
                          {r.readyToRenew ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            >
                              Priced
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-700 dark:text-amber-300"
                            >
                              Needs pricing
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {r.readyToRenew ? (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5"
                                disabled={busy}
                                onClick={() => void handleRenew(offerId)}
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                                {busy ? "Renewing…" : "Renew"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                disabled={busy}
                                onClick={() => void handlePriceNextYear(offerId)}
                              >
                                <Calculator className="h-3.5 w-3.5" />
                                {busy ? "Pricing…" : "Price Next Year"}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={() => navigate(`/offers/${offerId}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
    </AppShell>
  );
};

export default RenewalsDue;
