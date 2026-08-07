import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import TablePagination from "@/components/TablePagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { customerPath, mapCompanyToCustomer, mapPersonToCustomer, newOfferPath } from "@/api/adapters/customers";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, FileText, Filter } from "lucide-react";
import { fullName, PEPStatus, type Customer } from "@/data/customers";
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
const exposureBreakdown = (
  customerId: string,
  total: number,
  products: { id: string; name: string }[]
) => {
  if (total <= 0 || products.length === 0) return [] as { product: string; amount: number }[];
  let seed = 0;
  for (let i = 0; i < customerId.length; i++) seed = (seed * 31 + customerId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const count = 2 + Math.floor(rand() * Math.min(3, Math.max(1, products.length - 1)));
  const picks: typeof products = [];
  const pool = [...products];
  for (let i = 0; i < count && pool.length; i++) {
    picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  const weights = picks.map(() => 0.3 + rand());
  const sum = weights.reduce((a, b) => a + b, 0);
  const rows = picks.map((p, i) => ({
    product: p.name,
    amount: Math.round((weights[i] / sum) * total),
  }));
  const drift = total - rows.reduce((a, r) => a + r.amount, 0);
  if (rows.length) rows[0].amount += drift;
  return rows;
};

type CustomerTypeFilter = "all" | "person" | "company";

const CustomersList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, pageSize]);

  const loadPeople = typeFilter === "all" || typeFilter === "person";
  const loadCompanies = typeFilter === "all" || typeFilter === "company";

  const { data: peoplePage, isLoading: peopleLoading } = useListPeople(
    { pageNumber: page, pageSize },
    { enabled: loadPeople }
  );
  const { data: companiesPage, isLoading: companiesLoading } = useListCompanies(
    { pageNumber: page, pageSize },
    { enabled: loadCompanies }
  );
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 100 });

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const customers = useMemo(() => {
    const people = loadPeople ? (peoplePage?.items ?? []).map(mapPersonToCustomer) : [];
    const companies = loadCompanies ? (companiesPage?.items ?? []).map(mapCompanyToCustomer) : [];
    let all: Customer[] = [];
    if (typeFilter === "person") all = people;
    else if (typeFilter === "company") all = companies;
    else all = [...people, ...companies];

    const q = query.toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        fullName(c).toLowerCase().includes(q) ||
        c.personalId.toLowerCase().includes(q) ||
        (c.nipt ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [
    companiesPage?.items,
    loadCompanies,
    loadPeople,
    peoplePage?.items,
    query,
    typeFilter,
  ]);

  const peopleTotal = peoplePage?.totalCount ?? 0;
  const companiesTotal = companiesPage?.totalCount ?? 0;
  const totalCount =
    typeFilter === "person"
      ? peopleTotal
      : typeFilter === "company"
        ? companiesTotal
        : peopleTotal + companiesTotal;

  const totalPages = Math.max(
    1,
    typeFilter === "person"
      ? (peoplePage?.totalPages ?? peoplePage?.pageCount ?? 1)
      : typeFilter === "company"
        ? (companiesPage?.totalPages ?? companiesPage?.pageCount ?? 1)
        : Math.max(
            peoplePage?.totalPages ?? peoplePage?.pageCount ?? 1,
            companiesPage?.totalPages ?? companiesPage?.pageCount ?? 1
          )
  );

  const isLoading =
    (loadPeople && peopleLoading) || (loadCompanies && companiesLoading);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search this page…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CustomerTypeFilter)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="person">Individuals</SelectItem>
                <SelectItem value="company">Companies</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${totalCount} customer(s)`}
          </div>
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
            {isLoading && (
              <TableRow>
                <td colSpan={10} className="p-8 text-center text-muted-foreground text-sm">Loading customers…</td>
              </TableRow>
            )}
            {!isLoading && customers.length === 0 && (
              <TableRow>
                <td colSpan={10} className="p-8 text-center text-muted-foreground text-sm">No customers found.</td>
              </TableRow>
            )}
            {customers.map((c) => {
              const isCompany = c.customerType === "Company";
              const avatarInitials = isCompany
                ? (c.companyName ?? "C").slice(0, 2).toUpperCase()
                : initials(c.firstName, c.lastName);
              return (
              <TableRow key={`${c.customerType}-${c.id}`} className="hover:bg-accent-soft/40 cursor-pointer" onClick={() => navigate(customerPath(c.id, c.customerType))}>
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
                <TableCell className="text-right font-medium" onClick={(e) => e.stopPropagation()}>
                  {c.totalExposure > 0 ? (
                    <div className="flex flex-col items-end leading-tight">
                      <span>{fmtMoney(c.totalExposure)}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-[11px] font-normal text-accent hover:underline">
                            Breakdown
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Exposure by Product
                          </div>
                          <div className="space-y-1.5">
                            {exposureBreakdown(c.id, c.totalExposure, products).map((r) => (
                              <div key={r.product} className="flex items-center justify-between gap-3 text-sm">
                                <span className="truncate text-foreground">{r.product}</span>
                                <span className="font-medium tabular-nums">{fmtMoney(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2 mt-2 border-t border-border text-sm">
                            <span className="font-semibold">Total</span>
                            <span className="font-semibold tabular-nums">{fmtMoney(c.totalExposure)}</span>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to={customerPath(c.id, c.customerType)}><Eye className="h-3.5 w-3.5 mr-1" /> View</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to={customerPath(c.id, c.customerType, { edit: true })}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-accent hover:text-accent hover:bg-accent-soft">
                      <Link to={newOfferPath(c.id, c.customerType)}><FileText className="h-3.5 w-3.5 mr-1" /> New Offer</Link>
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
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={isLoading}
        />
      </Card>
    </AppShell>
  );
};

export default CustomersList;
