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

type Offer = {
  id: string;
  customer: string;
  product: string;
  premium: string;
  created: string;
  status: "Draft" | "Sent" | "Accepted" | "Expired";
};

const offers: Offer[] = [
  { id: "OFR-2026-0418", customer: "Markus Weber", product: "TermLife Plus 20Y", premium: "€ 84.20 / mo", created: "Apr 28, 2026", status: "Sent" },
  { id: "OFR-2026-0417", customer: "Sofia Romano", product: "WholeLife Premium", premium: "€ 162.00 / mo", created: "Apr 28, 2026", status: "Draft" },
  { id: "OFR-2026-0416", customer: "Jonas Lindqvist", product: "TermLife Basic 10Y", premium: "€ 38.50 / mo", created: "Apr 27, 2026", status: "Accepted" },
  { id: "OFR-2026-0415", customer: "Helena Novak", product: "Endowment 15Y", premium: "€ 210.00 / mo", created: "Apr 27, 2026", status: "Sent" },
  { id: "OFR-2026-0414", customer: "Tomáš Dvořák", product: "TermLife Plus 30Y", premium: "€ 121.75 / mo", created: "Apr 26, 2026", status: "Expired" },
];

const statusVariant: Record<Offer["status"], string> = {
  Draft: "bg-muted text-muted-foreground hover:bg-muted",
  Sent: "bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft",
  Accepted: "bg-success/15 text-success hover:bg-success/15",
  Expired: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

const RecentOffersTable = () => {
  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Offers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · 24 total</p>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent-soft">
          View all
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Offer ID</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Customer</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Product</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Premium</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Created</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((o) => (
            <TableRow key={o.id} className="hover:bg-accent-soft/40">
              <TableCell className="font-mono text-xs text-accent">{o.id}</TableCell>
              <TableCell className="font-medium">{o.customer}</TableCell>
              <TableCell className="text-muted-foreground">{o.product}</TableCell>
              <TableCell className="font-medium">{o.premium}</TableCell>
              <TableCell className="text-muted-foreground">{o.created}</TableCell>
              <TableCell>
                <Badge className={`font-medium border-0 ${statusVariant[o.status]}`}>{o.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default RecentOffersTable;
