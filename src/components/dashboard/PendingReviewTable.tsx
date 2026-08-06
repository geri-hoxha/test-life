import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
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

const PendingReviewTable = () => {
  const { data: offersPage, isLoading } = useListOffers({ pageNumber: 1, pageSize: 50 });
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });

  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  
  const items = useMemo(
    () =>
      (offersPage?.items ?? [])
        .map(mapApiOffer)
        .filter((o) => o.status === "Partially Bound" || o.status === "Quoted")
        .slice(0, 5),
    [offersPage?.items]
  );

  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pending Review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Offers awaiting underwriter action</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/offers">View all</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Offer</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Holder</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Created</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                Nothing pending review.
              </TableCell>
            </TableRow>
          ) : (
            items.map((o) => {
              const holder = customers.find((c) => c.id === o.policyHolderId);
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link to={`/offers/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                      {o.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{holder ? fullName(holder) : "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{o.createdDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.status}</Badge>
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

export default PendingReviewTable;
