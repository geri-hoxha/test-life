import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, FileText, MapPin, Briefcase, Calendar, BadgeCheck, ShieldCheck, FileSignature, Plus, AlertCircle } from "lucide-react";
import { ageFromDob, fullName, PEPStatus } from "@/data/customers";
import { useGetPerson } from "@/api/people";
import { useGetCompany } from "@/api/companies";
import {
  customerPath,
  mapCompanyToCustomer,
  mapPersonToCustomer,
  parseCustomerPartyType,
} from "@/api/adapters/customers";

const pepClass: Record<PEPStatus, string> = {
  Yes: "bg-warning/20 text-warning-foreground",
  No: "bg-success/15 text-success",
  Unknown: "bg-muted text-muted-foreground",
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const Field = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 text-accent mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm mt-0.5 break-words">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  </div>
);

const EmptyTab = ({ icon: Icon, title, hint, cta }: { icon: any; title: string; hint: string; cta?: string }) => (
  <Card className="p-12 shadow-card border-border border-dashed flex flex-col items-center text-center">
    <div className="h-12 w-12 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
      <Icon className="h-6 w-6" />
    </div>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    <p className="text-xs text-muted-foreground mt-1 max-w-md">{hint}</p>
    {cta && (
      <Button size="sm" className="mt-4 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
        <Plus className="h-4 w-4" />{cta}
      </Button>
    )}
  </Card>
);

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

const CustomerDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const partyType = parseCustomerPartyType(searchParams.get("type"));

  // People and companies use different GET endpoints — only call the matching one.
  const personQ = useGetPerson(id ?? "", {
    enabled: Boolean(id) && (partyType === "person" || partyType === null),
  });
  const companyQ = useGetCompany(id ?? "", {
    enabled:
      Boolean(id) &&
      (partyType === "company" ||
        (partyType === null && personQ.isFetched && personQ.isError)),
  });

  const customer = useMemo(() => {
    if (partyType !== "company" && personQ.data) return mapPersonToCustomer(personQ.data);
    if (partyType !== "person" && companyQ.data) return mapCompanyToCustomer(companyQ.data);
    return undefined;
  }, [partyType, personQ.data, companyQ.data]);

  const isLoading =
    partyType === "company"
      ? companyQ.isLoading
      : partyType === "person"
        ? personQ.isLoading
        : personQ.isLoading ||
          (personQ.isError && !companyQ.isFetched) ||
          companyQ.isLoading;

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: "…" }]}
          title="Loading…"
          description="Fetching customer."
        />
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: "Not found" }]}
          title="Customer not found"
        />
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This customer no longer exists.</p>
          <Button asChild className="mt-4"><Link to="/customers">Back to customers</Link></Button>
        </Card>
      </AppShell>
    );
  }

  const isCompany = customer.customerType === "Company";
  const age = customer.dateOfBirth ? ageFromDob(customer.dateOfBirth) : null;

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: fullName(customer) }]}
        title={fullName(customer)}
        description={
          customer.createdDate
            ? `${customer.id} · Customer since ${format(parseISO(customer.createdDate), "MMM yyyy")}`
            : customer.id
        }
        actions={
          <>
            <Button variant="outline" asChild className="gap-2">
              <Link to={customerPath(customer.id, customer.customerType, { edit: true })}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
            <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <FileText className="h-4 w-4" /> New Offer
            </Button>
          </>
        }
      />

      {/* Profile strip */}
      <Card className="p-5 mb-6 shadow-card border-border">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-accent text-accent-foreground text-lg font-semibold">
              {isCompany
                ? (customer.companyName ?? "C").slice(0, 2).toUpperCase()
                : initials(customer.firstName, customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{fullName(customer)}</h2>
              <Badge variant="outline" className={isCompany ? "border-accent/40 text-accent" : "border-border text-muted-foreground"}>
                {isCompany ? "Company" : "Individual"}
              </Badge>
              {!isCompany && (
                <Badge className={`border-0 ${pepClass[customer.pepStatus]}`}>PEP: {customer.pepStatus}</Badge>
              )}
              {customer.totalExposure > 0 && (
                <Badge variant="outline" className="font-mono">Exposure {fmtMoney(customer.totalExposure)}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {isCompany
                ? [customer.companyType, customer.nipt].filter(Boolean).join(" · ") || "Company"
                : [customer.gender, age != null ? `${age} years old` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {isCompany ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground"><BadgeCheck className="h-4 w-4" /> <span className="font-mono">{customer.nipt || "—"}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /> {customer.companyType || "—"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {customer.country || "—"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {[customer.address, customer.city, customer.postalCode].filter(Boolean).join(", ") || "—"}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground"><BadgeCheck className="h-4 w-4" /> <span className="font-mono">{customer.personalId || "—"}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {customer.ssnIssuingCountry || customer.country || "—"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {customer.dateOfBirth ? format(parseISO(customer.dateOfBirth), "MMM dd, yyyy") : "—"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" /> PEP: {customer.pepStatus}</div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="exposure">Exposure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 shadow-card border-border md:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-3">Profile details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0 divide-border">
                {isCompany ? (
                  <>
                    <Field icon={BadgeCheck} label="Registration no. / NIPT" value={<span className="font-mono">{customer.nipt}</span>} />
                    <Field icon={Briefcase} label="Company type" value={customer.companyType} />
                    <Field icon={MapPin} label="Country" value={customer.country} />
                    <Field
                      icon={MapPin}
                      label="Main address"
                      value={[customer.address, customer.city, customer.postalCode].filter(Boolean).join(", ") || undefined}
                    />
                  </>
                ) : (
                  <>
                    <Field icon={BadgeCheck} label="Personal ID" value={<span className="font-mono">{customer.personalId}</span>} />
                    <Field icon={MapPin} label="Country" value={customer.ssnIssuingCountry || customer.country} />
                    <Field icon={Calendar} label="Date of Birth" value={customer.dateOfBirth ? `${format(parseISO(customer.dateOfBirth), "PPP")}${age != null ? ` (${age} y/o)` : ""}` : "—"} />
                    <Field icon={ShieldCheck} label="Gender" value={customer.gender} />
                  </>
                )}
              </div>
              {customer.notes && (
                <>
                  <div className="border-t border-border mt-4 pt-4">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</div>
                    <p className="text-sm mt-1 leading-relaxed">{customer.notes}</p>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-5 shadow-card border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" /> Compliance
              </h3>
              <div className="space-y-3">
                {!isCompany && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">PEP Status</div>
                    <Badge className={`mt-1 border-0 ${pepClass[customer.pepStatus]}`}>{customer.pepStatus}</Badge>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Exposure</div>
                  <div className="text-2xl font-semibold mt-1">
                    {customer.totalExposure > 0 ? fmtMoney(customer.totalExposure) : <span className="text-muted-foreground text-base font-normal">No active exposure</span>}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">Run KYC check</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Offers</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Quotes and proposals issued to this customer.</p>
              </div>
              <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4" /> New Offer
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Offer ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                    No offers yet for this customer.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <EmptyTab icon={ShieldCheck} title="No active policies" hint="Once an offer is accepted and issued, it will appear here as a policy." />
        </TabsContent>

        <TabsContent value="documents">
          <EmptyTab icon={FileSignature} title="No documents on file" hint="Upload identification, medical declarations and other supporting documents." cta="Upload Document" />
        </TabsContent>

        <TabsContent value="exposure">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Aggregate exposure</h3>
            <p className="text-xs text-muted-foreground mb-5">Total sum insured across all active policies.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 shadow-none border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total exposure</div>
                <div className="text-2xl font-semibold mt-1">
                  {customer.totalExposure > 0 ? fmtMoney(customer.totalExposure) : "€ 0"}
                </div>
              </Card>
              <Card className="p-4 shadow-none border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Active policies</div>
                <div className="text-2xl font-semibold mt-1">{customer.totalExposure > 0 ? "1" : "0"}</div>
              </Card>
              <Card className="p-4 shadow-none border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Exposure limit</div>
                <div className="text-2xl font-semibold mt-1">€ 500,000</div>
              </Card>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">
              Note: exposures above the configured product threshold automatically trigger underwriter review.
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default CustomerDetail;
