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
import { FileText } from "lucide-react";
import { useListOffers } from "@/api/offers";
import {
  formatOfferDate,
  formatOfferMoney,
  offerStatusClass,
  offerStatusLabel,
  shortOfferId,
} from "@/pages/offers/offer-ui";

const COL_COUNT = 5;

const RecentOffersTable = () => {
  const navigate = useNavigate();
  const { data: offersPage, isLoading } = useListOffers({
    pageNumber: 1,
    pageSize: 10,
  });

  const offers = useMemo(
    () =>
      [...(offersPage?.items ?? [])]
        .sort((a, b) =>
          (b.createdOnUtc ?? "").localeCompare(a.createdOnUtc ?? ""),
        )
        .slice(0, 6),
    [offersPage?.items],
  );

  return (
    <Card className="shadow-card border-border overflow-hidden h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-md bg-accent-soft text-accent flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Offers
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest quotes across the book
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/offers">View all</Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Offer
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
              <TableLoadingRow colSpan={COL_COUNT} label="Loading offers…" />
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COL_COUNT}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  No offers yet.
                </TableCell>
              </TableRow>
            ) : (
              offers.map((o) => (
                <TableRow
                  key={o.id ?? `${o.createdOnUtc}-${o.policyHolderName}`}
                  className={o.id ? "cursor-pointer" : undefined}
                  onClick={() => o.id && navigate(`/offers/${o.id}`)}
                >
                  <TableCell className="py-2 px-3">
                    {o.id ? (
                      <Link
                        to={`/offers/${o.id}`}
                        className="font-mono text-xs text-accent hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {shortOfferId(o.id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatOfferDate(o.createdOnUtc)}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm max-w-[10rem] truncate">
                    {o.policyHolderName?.trim() || "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm max-w-[10rem] truncate">
                    {o.productName?.trim() || o.productId || "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3 font-mono text-sm font-bold text-right tabular-nums text-success">
                    {formatOfferMoney(o.firstPeriodChargePremium, o.currency)}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge variant="secondary" className={`border-0 ${offerStatusClass(o.status)}`}>
                      {offerStatusLabel(o.status)}
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

export default RecentOffersTable;
