import { Link, useParams } from "react-router-dom";
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
import { Pencil, FileText, Mail, Phone, MapPin, Briefcase, Calendar, BadgeCheck, ShieldCheck, FileSignature, Plus, AlertCircle } from "lucide-react";
import { ageFromDob, fullName, getCustomer, PEPStatus } from "@/data/customers";

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
  const customer = id ? getCustomer(id) : undefined;

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

  const age = ageFromDob(customer.dateOfBirth);

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: fullName(customer) }]}
        title={fullName(customer)}
        description={`${customer.id} · Customer since ${format(parseISO(customer.createdDate), "MMM yyyy")}`}
        actions={
          <>
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/customers/${customer.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link>
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
              {initials(customer.firstName, customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{fullName(customer)}</h2>
              <Badge className={`border-0 ${pepClass[customer.pepStatus]}`}>PEP: {customer.pepStatus}</Badge>
              {customer.totalExposure > 0 && (
                <Badge variant="outline" className="font-mono">Exposure {fmtMoney(customer.totalExposure)}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {customer.gender} · {age} years old · {customer.occupation || "Occupation not specified"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {customer.phone || "—"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {customer.email || "—"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {customer.city || "—"}{customer.country ? `, ${customer.country}` : ""}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><BadgeCheck className="h-4 w-4" /> <span className="font-mono">{customer.personalId}</span></div>
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
                <Field icon={BadgeCheck} label="Personal ID" value={<span className="font-mono">{customer.personalId}</span>} />
                <Field icon={Calendar} label="Date of Birth" value={customer.dateOfBirth ? `${format(parseISO(customer.dateOfBirth), "PPP")} (${age} y/o)` : "—"} />
                <Field icon={Briefcase} label="Occupation" value={customer.occupation} />
                <Field icon={MapPin} label="Address" value={[customer.address, customer.city, customer.country].filter(Boolean).join(", ")} />
                <Field icon={Phone} label="Phone" value={customer.phone} />
                <Field icon={Mail} label="Email" value={customer.email} />
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
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">PEP Status</div>
                  <Badge className={`mt-1 border-0 ${pepClass[customer.pepStatus]}`}>{customer.pepStatus}</Badge>
                </div>
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
