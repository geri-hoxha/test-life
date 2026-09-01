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
import { Label } from "@/components/ui/label";
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
import { useCountryEnum } from "@/api/smart-enums";
import { customerPath, mapCompanyToCustomer, mapPersonToCustomer, newOfferPath, countryDisplayName } from "@/api/adapters/customers";
import { Plus, Pencil, FileText } from "lucide-react";
import { fullName, COMPANY_TYPE_OPTIONS, companyTypeLabel } from "@/data/customers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

type CustomerTypeFilter = "person" | "company";

const CustomersList = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<CustomerTypeFilter | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // People filters
  const [personalIdentifier, setPersonalIdentifier] = useState("");
  const [nationality, setNationality] = useState("ALL");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("ALL");

  // Company filters
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [countryCode, setCountryCode] = useState("ALL");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [companyType, setCompanyType] = useState("ALL");

  const { data: nationalityOptions = [] } = useCountryEnum();

  const nationalityLabel = (code?: string) =>
    countryDisplayName(code, nationalityOptions) ?? "—";

  const loadPeople = typeFilter === "person";
  const loadCompanies = typeFilter === "company";

  const clearPeopleFilters = () => {
    setPersonalIdentifier("");
    setNationality("ALL");
    setFirstName("");
    setLastName("");
    setGender("ALL");
  };

  const clearCompanyFilters = () => {
    setRegistrationNumber("");
    setCountryCode("ALL");
    setLegalName("");
    setTradeName("");
    setCompanyType("ALL");
  };

  const handleTypeChange = (value: CustomerTypeFilter) => {
    setTypeFilter(value);
    setPage(1);
    clearPeopleFilters();
    clearCompanyFilters();
  };

  const peopleFilters = useMemo(
    () =>
      compactQuery({
        personalIdentifier: personalIdentifier.trim() || undefined,
        ...(nationality !== "ALL" ? { nationality } : {}),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        ...(gender !== "ALL" ? { gender } : {}),
      }),
    [personalIdentifier, nationality, firstName, lastName, gender]
  );
  const companiesFilters = useMemo(
    () =>
      compactQuery({
        registrationNumber: registrationNumber.trim() || undefined,
        ...(countryCode !== "ALL" ? { countryCode } : {}),
        legalName: legalName.trim() || undefined,
        tradeName: tradeName.trim() || undefined,
        ...(companyType !== "ALL" ? { companyType } : {}),
      }),
    [registrationNumber, countryCode, legalName, tradeName, companyType]
  );
  const debouncedPeopleFilters = useDebouncedValue(peopleFilters);
  const debouncedCompaniesFilters = useDebouncedValue(companiesFilters);

  useEffect(() => {
    setPage(1);
  }, [pageSize, debouncedPeopleFilters, debouncedCompaniesFilters]);

  const peopleQuery = { ...debouncedPeopleFilters, pageNumber: page, pageSize };
  const companiesQuery = { ...debouncedCompaniesFilters, pageNumber: page, pageSize };

  const { data: peoplePage, isLoading: peopleLoading } = useListPeople(peopleQuery, {
    enabled: loadPeople,
  });
  const { data: companiesPage, isLoading: companiesLoading } = useListCompanies(companiesQuery, {
    enabled: loadCompanies,
  });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 100 });

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const customers = useMemo(() => {
    if (typeFilter === "person") return (peoplePage?.items ?? []).map(mapPersonToCustomer);
    if (typeFilter === "company") return (companiesPage?.items ?? []).map(mapCompanyToCustomer);
    return [];
  }, [companiesPage?.items, peoplePage?.items, typeFilter]);

  const totalCount =
    typeFilter === "person"
      ? (peoplePage?.totalCount ?? 0)
      : typeFilter === "company"
        ? (companiesPage?.totalCount ?? 0)
        : 0;

  const totalPages = Math.max(
    1,
    typeFilter === "person"
      ? (peoplePage?.totalPages ?? peoplePage?.pageCount ?? 1)
      : typeFilter === "company"
        ? (companiesPage?.totalPages ?? companiesPage?.pageCount ?? 1)
        : 1
  );

  const isLoading =
    (loadPeople && peopleLoading) || (loadCompanies && companiesLoading);

  const hasPeopleFilters =
    personalIdentifier || nationality !== "ALL" || firstName || lastName || gender !== "ALL";
  const hasCompanyFilters =
    registrationNumber || countryCode !== "ALL" || legalName || tradeName || companyType !== "ALL";

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Customers" }]}
        title="Customers"
        description="Manage individuals and organizations covered by your policies."
        actions={
          <Button asChild className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/customers/new">
              <Plus className="h-4 w-4" /> New Customer
            </Link>
          </Button>
        }
      />

      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Customer type</Label>
              <Select value={typeFilter || undefined} onValueChange={(v) => handleTypeChange(v as CustomerTypeFilter)}>
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue placeholder="Select type first…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Individuals</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {!typeFilter
                ? "Select a type to list and filter customers"
                : isLoading
                  ? "Loading…"
                  : `${totalCount} customer(s)`}
            </div>
          </div>

          {typeFilter === "person" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  People filters
                </div>
                {hasPeopleFilters && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearPeopleFilters}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Personal ID</Label>
                  <Input
                    className="h-9 font-mono text-xs"
                    value={personalIdentifier}
                    onChange={(e) => setPersonalIdentifier(e.target.value)}
                    placeholder="personalIdentifier"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">First name</Label>
                  <Input className="h-9" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last name</Label>
                  <Input className="h-9" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All countries</SelectItem>
                      {nationalityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {typeFilter === "company" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company filters
                </div>
                {hasCompanyFilters && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearCompanyFilters}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Registration #</Label>
                  <Input
                    className="h-9 font-mono text-xs"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="registrationNumber"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Legal name</Label>
                  <Input className="h-9" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Trade name</Label>
                  <Input className="h-9" value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All countries</SelectItem>
                      {nationalityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Company type</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      {COMPANY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Full Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Personal ID / NIPT</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Nationality</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Company type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date of Birth</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Gender</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Phone</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Total Exposure</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <td colSpan={11} className="p-8 text-center text-muted-foreground text-sm">Loading customers…</td>
              </TableRow>
            )}
            {!isLoading && customers.length === 0 && (
              <TableRow>
                <td colSpan={11} className="p-8 text-center text-muted-foreground text-sm">
                  {!typeFilter
                    ? "Select Individuals or Companies to view and filter customers."
                    : "No customers found."}
                </td>
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
                  <div className="flex items-center gap-2.5 min-w-40">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent-soft text-accent text-xs font-semibold">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{fullName(c)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={isCompany ? "border-accent/40 text-accent" : "border-border text-muted-foreground"}>
                    {isCompany ? "Company" : "Individual"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{isCompany ? (c.nipt ?? "—") : c.personalId}</TableCell>
                <TableCell className="text-muted-foreground">{nationalityLabel(c.nationality)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {isCompany ? (companyTypeLabel(c.companyType) || "—") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground min-w-28">{!isCompany && c.dateOfBirth ? format(parseISO(c.dateOfBirth), "MMM dd, yyyy") : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{isCompany ? "—" : c.gender}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">{c.email ?? "—"}</TableCell>
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
                      <Link to={customerPath(c.id, c.customerType, { edit: true })}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-accent hover:text-accent hover:bg-accent-soft">
                      <Link to={newOfferPath(c.id, c.customerType)}><FileText className="h-3.5 w-3.5 mr-1" /> New Offer</Link>
                    </Button>
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
