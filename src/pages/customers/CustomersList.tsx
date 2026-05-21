import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { seedProducts } from "@/data/products";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, FileText, Filter } from "lucide-react";
import { listCustomers, fullName, PEPStatus } from "@/data/customers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const pepClass: Record<PEPStatus, string> = {
  Yes: "bg-warning/20 text-warning-foreground",
  No: "bg-success/15 text-success",
  Unknown: "bg-muted text-muted-foreground",
};

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// Deterministic pseudo-random exposure breakdown by product, derived from customer id.
const exposureBreakdown = (customerId: string, total: number) => {
  if (total <= 0) return [] as { product: string; amount: number }[];
  let seed = 0;
  for (let i = 0; i < customerId.length; i++) seed = (seed * 31 + customerId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const count = 2 + Math.floor(rand() * Math.min(3, seedProducts.length - 1));
  const picks: typeof seedProducts = [];
  const pool = [...seedProducts];
  for (let i = 0; i < count && pool.length; i++) {
    picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  const weights = picks.map(() => 0.3 + rand());
  const sum = weights.reduce((a, b) => a + b, 0);
  const rows = picks.map((p, i) => ({
    product: p.name,
    amount: Math.round((weights[i] / sum) * total),
  }));
  // fix rounding drift
  const drift = total - rows.reduce((a, r) => a + r.amount, 0);
  if (rows.length) rows[0].amount += drift;
  return rows;
};

const CustomersList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const customers = listCustomers().filter((c) => {
    const q = query.toLowerCase();
    return (
      fullName(c).toLowerCase().includes(q) ||
      c.personalId.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Customers" }]}
        title="Customers"
        description="Manage individuals and organizations covered by your policies."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button asChild className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/customers/new">
                <Plus className="h-4 w-4" /> New Customer
              </Link>
            </Button>
          </>
        }
      />

      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, personal ID or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="text-xs text-muted-foreground">{customers.length} customer(s)</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Full Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Personal ID / NIPT</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date of Birth</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Gender</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Phone</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">PEP</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Total Exposure</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => {
              const isCompany = c.customerType === "Company";
              const avatarInitials = isCompany
                ? (c.companyName ?? "C").slice(0, 2).toUpperCase()
                : initials(c.firstName, c.lastName);
              return (
              <TableRow key={c.id} className="hover:bg-accent-soft/40 cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent-soft text-accent text-xs font-semibold">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{fullName(c)}</div>
                      <div className="text-[11px] text-muted-foreground">{c.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={isCompany ? "border-accent/40 text-accent" : "border-border text-muted-foreground"}>
                    {isCompany ? "Company" : "Individual"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{isCompany ? (c.nipt ?? "—") : c.personalId}</TableCell>
                <TableCell className="text-muted-foreground">{!isCompany && c.dateOfBirth ? format(parseISO(c.dateOfBirth), "MMM dd, yyyy") : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{isCompany ? "—" : c.gender}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">{c.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={`border-0 ${pepClass[c.pepStatus]}`}>{c.pepStatus}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {c.totalExposure > 0 ? fmtMoney(c.totalExposure) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to={`/customers/${c.id}`}><Eye className="h-3.5 w-3.5 mr-1" /> View</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to={`/customers/${c.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-accent hover:text-accent hover:bg-accent-soft">
                      <FileText className="h-3.5 w-3.5 mr-1" /> New Offer
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Run KYC check</DropdownMenuItem>
                        <DropdownMenuItem>Send communication</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
};

export default CustomersList;
