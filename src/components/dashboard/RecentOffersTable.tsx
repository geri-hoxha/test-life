import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
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
import { useListOffers } from "@/api/offers";
import { mapApiOffer } from "@/api/adapters/offers";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { mergeCustomers } from "@/api/adapters/customers";
import { fullName } from "@/data/customers";
import { statusColor } from "@/data/offers";

const fmtMoney = (v: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const RecentOffersTable = () => {
  const { data: offersPage, isLoading } = useListOffers({ pageNumber: 1, pageSize: 10 });
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });

  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  const offers = useMemo(
    () =>
      (offersPage?.items ?? [])
        .map(mapApiOffer)
        .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
        .slice(0, 5),
    [offersPage?.items]
  );

  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Offers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest activity across the book</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/offers">View all</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Offer</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Customer</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Premium</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                Loading offers…
              </TableCell>
            </TableRow>
          ) : offers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                No offers yet.
              </TableCell>
            </TableRow>
          ) : (
            offers.map((o) => {
              const holder = customers.find((c) => c.id === o.policyHolderId);
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link to={`/offers/${o.id}`} className="font-mono text-xs text-accent hover:underline">
                      {o.number}
                    </Link>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{o.createdDate}</div>
                  </TableCell>
                  <TableCell className="text-sm">{holder ? fullName(holder) : "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{fmtMoney(o.premium, o.currency)}</TableCell>
                  <TableCell>
                    <Badge className={`border-0 ${statusColor[o.status]}`}>{o.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default RecentOffersTable;
