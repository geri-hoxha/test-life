import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { AccessDeniedOr } from "@/components/AccessDeniedNotice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { useCountryEnum } from "@/api/smart-enums";
import {
  customerPath,
  mapCompanyToCustomer,
  mapPersonToCustomer,
  newOfferPath,
  countryDisplayName,
  toCompanyCountryCode,
  type CustomerPartyType,
} from "@/api/adapters/customers";
import { Plus, Pencil, FileText } from "lucide-react";
import { fullName, COMPANY_TYPE_OPTIONS, companyTypeLabel } from "@/data/customers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isApiForbidden } from "@/lib/api-error";

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

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

const copy = {
  person: {
    newPath: "/people/new",
    title: "People",
    description: "Manage individuals covered by your policies.",
    newLabel: "New Person",
    empty: "No people match the current filters.",
    loading: "Loading data, please wait…",
    cardTitle: "People",
  },
  company: {
    newPath: "/companies/new",
    title: "Companies",
    description: "Manage organizations covered by your policies.",
    newLabel: "New Company",
    empty: "No companies match the current filters.",
    loading: "Loading data, please wait…",
    cardTitle: "Companies",
  },
} as const;

type PartyListProps = {
  partyType: CustomerPartyType;
};

export const PartyList = ({ partyType }: PartyListProps) => {
  const navigate = useNavigate();
  const isCompany = partyType === "company";
  const ui = copy[partyType];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [personalIdentifier, setPersonalIdentifier] = useState("");
  const [nationality, setNationality] = useState("ALL");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("ALL");

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [countryCode, setCountryCode] = useState("ALL");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [companyType, setCompanyType] = useState("ALL");
  const [countryFilterOpen, setCountryFilterOpen] = useState(false);

  const { data: nationalityOptions = [], isFetching: countriesLoading } = useCountryEnum({
    enabled: countryFilterOpen,
  });

  const nationalityLabel = (code?: string) =>
    countryDisplayName(code, nationalityOptions) ?? "—";

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
        ...(countryCode !== "ALL" ? { countryCode: toCompanyCountryCode(countryCode) } : {}),
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

  const {
    data: peoplePage,
    isLoading: peopleLoading,
    isFetching: peopleFetching,
    error: peopleError,
  } = useListPeople(peopleQuery, {
    enabled: !isCompany,
  });
  const {
    data: companiesPage,
    isLoading: companiesLoading,
    isFetching: companiesFetching,
    error: companiesError,
  } = useListCompanies(companiesQuery, {
    enabled: isCompany,
  });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 100 });

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const customers = useMemo(() => {
    if (isCompany) return (companiesPage?.items ?? []).map(mapCompanyToCustomer);
    return (peoplePage?.items ?? []).map(mapPersonToCustomer);
  }, [companiesPage?.items, isCompany, peoplePage?.items]);

  const totalCount = isCompany
    ? (companiesPage?.totalCount ?? 0)
    : (peoplePage?.totalCount ?? 0);

  const totalPages = Math.max(
    1,
    isCompany
      ? (companiesPage?.totalPages ?? companiesPage?.pageCount ?? 1)
      : (peoplePage?.totalPages ?? peoplePage?.pageCount ?? 1)
  );

  const isLoading = isCompany ? companiesLoading : peopleLoading;
  const isFetching = isCompany ? companiesFetching : peopleFetching;
  const error = isCompany ? companiesError : peopleError;
  const accessDenied = isApiForbidden(error);

  const hasPeopleFilters =
    personalIdentifier || nationality !== "ALL" || firstName || lastName || gender !== "ALL";
  const hasCompanyFilters =
    registrationNumber || countryCode !== "ALL" || legalName || tradeName || companyType !== "ALL";
  const hasFilters = isCompany ? hasCompanyFilters : hasPeopleFilters;
  const clearFilters = isCompany ? clearCompanyFilters : clearPeopleFilters;

  const colSpan = isCompany ? 9 : 10;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Clients
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{ui.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ui.description}</p>
        </div>
        {!accessDenied && (
          <Button asChild className="gap-2">
            <Link to={ui.newPath}>
              <Plus className="h-4 w-4" />
              {ui.newLabel}
            </Link>
          </Button>
        )}
      </div>

      <AccessDeniedOr error={error}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">{ui.cardTitle}</CardTitle>
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
            {!isCompany && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Personal ID</Label>
                  <Input
                    className="h-9 font-mono text-xs"
                    value={personalIdentifier}
                    onChange={(e) => setPersonalIdentifier(e.target.value)}
                    placeholder="Personal identifier"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">First name</Label>
                  <Input
                    className="h-9"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last name</Label>
                  <Input
                    className="h-9"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <Select
                    value={nationality}
                    onValueChange={setNationality}
                    onOpenChange={setCountryFilterOpen}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All countries</SelectItem>
                      {countriesLoading && nationalityOptions.length === 0 ? (
                        <SelectItem value="__loading__" disabled>
                          Loading…
                        </SelectItem>
                      ) : (
                        nationalityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.text}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {isCompany && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Registration #</Label>
                  <Input
                    className="h-9 font-mono text-xs"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Registration number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Legal name</Label>
                  <Input
                    className="h-9"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Legal name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Trade name</Label>
                  <Input
                    className="h-9"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Trade name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Select
                    value={countryCode}
                    onValueChange={setCountryCode}
                    onOpenChange={setCountryFilterOpen}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All countries</SelectItem>
                      {countriesLoading && nationalityOptions.length === 0 ? (
                        <SelectItem value="__loading__" disabled>
                          Loading…
                        </SelectItem>
                      ) : (
                        nationalityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.text}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Company type</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      {COMPANY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isCompany ? "Legal name" : "Full name"}</TableHead>
                  <TableHead>{isCompany ? "Registration # / NIPT" : "Personal ID"}</TableHead>
                  <TableHead>{isCompany ? "Country" : "Nationality"}</TableHead>
                  {isCompany ? (
                    <TableHead>Company type</TableHead>
                  ) : (
                    <>
                      <TableHead>Date of birth</TableHead>
                      <TableHead>Gender</TableHead>
                    </>
                  )}
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total exposure</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={colSpan} label={ui.loading} />
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="text-center py-10 text-sm text-muted-foreground">
                      {ui.empty}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => {
                    const avatarInitials = isCompany
                      ? (c.companyName ?? "C").slice(0, 2).toUpperCase()
                      : initials(c.firstName, c.lastName);
                    return (
                      <TableRow
                        key={`${c.customerType}-${c.id}`}
                        className="hover:bg-muted/40 cursor-pointer"
                        onClick={() => navigate(customerPath(c.id, c.customerType))}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5 min-w-40">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-accent-soft text-accent text-xs font-semibold">
                                {avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{fullName(c)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {isCompany ? (c.nipt ?? "—") : c.personalId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {isCompany ? (nationalityLabel(c.country) || "—") : nationalityLabel(c.nationality)}
                        </TableCell>
                        {isCompany ? (
                          <TableCell className="text-muted-foreground">
                            {companyTypeLabel(c.companyType) || "—"}
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className="text-muted-foreground min-w-28">
                              {c.dateOfBirth ? format(parseISO(c.dateOfBirth), "MMM dd, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.gender}</TableCell>
                          </>
                        )}
                        <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[200px]">
                          {c.email ?? "—"}
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
                              <Link to={customerPath(c.id, c.customerType, { edit: true })}>
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              <Link to={newOfferPath(c.id, c.customerType)}>
                                <FileText className="h-3.5 w-3.5 mr-1" /> New Offer
                              </Link>
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
      </AccessDeniedOr>
    </AppShell>
  );
};

export default PartyList;
