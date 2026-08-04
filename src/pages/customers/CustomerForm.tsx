import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CalendarIcon, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Customer, customerSchema,
  Gender, PEPStatus, CustomerType, CompanyType, COMPANY_TYPES, F5_LOCATIONS,
  SSN_ISSUING_COUNTRIES,
} from "@/data/customers";
import { useCreatePerson, useGetPerson, useUpdatePerson } from "@/api/people";
import { useAddCompanyAddress, useCreateCompany, useGetCompany, useUpdateCompany } from "@/api/companies";
import {
  customerPath,
  customerToCreateCompany,
  customerToCreatePerson,
  customerToUpdateCompany,
  customerToUpdatePerson,
  mapCompanyToCustomer,
  mapPersonToCustomer,
  parseCustomerPartyType,
  toCountryCode,
} from "@/api/adapters/customers";

const NA = "N/A";

const blank = (): Customer => ({
  id: "",
  customerType: "Individual",
  firstName: "", lastName: "", fatherName: "", personalId: "",
  ssnIssuingCountry: NA,
  dateOfBirth: "", gender: "Other",
  nationality: NA, placeOfBirth: "",
  companyName: "", nipt: "", companyType: undefined,
  registrationDate: "", legalRepresentative: "",
  f5Location: NA,
  address: "", city: "", country: NA,
  phone: "", email: "", occupation: "",
  pepStatus: "Unknown", notes: "",
  totalExposure: 0,
  createdDate: new Date().toISOString().slice(0, 10),
});

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const partyType = parseCustomerPartyType(searchParams.get("type"));

  const personQ = useGetPerson(id ?? "", {
    enabled: isEdit && (partyType === "person" || partyType === null),
  });
  const companyQ = useGetCompany(id ?? "", {
    enabled:
      isEdit &&
      (partyType === "company" ||
        (partyType === null && personQ.isFetched && personQ.isError)),
  });

  const existing = useMemo(() => {
    if (partyType !== "company" && personQ.data) return mapPersonToCustomer(personQ.data);
    if (partyType !== "person" && companyQ.data) return mapCompanyToCustomer(companyQ.data);
    return undefined;
  }, [partyType, personQ.data, companyQ.data]);

  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const addCompanyAddress = useAddCompanyAddress();

  const [c, setC] = useState<Customer>(blank());
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setC((s) => ({ ...s, [k]: v }));
  const isCompany = c.customerType === "Company";

  useEffect(() => {
    if (existing) setC(existing);
  }, [existing]);

  const saving =
    createPerson.isPending ||
    updatePerson.isPending ||
    createCompany.isPending ||
    updateCompany.isPending ||
    addCompanyAddress.isPending;

  const handleSave = () => {
    const result = customerSchema.safeParse(c);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (c.customerType === "Individual") {
      if (isEdit && c.id) {
        updatePerson.mutate(
          { id: c.id, body: customerToUpdatePerson(c) },
          {
            onSuccess: (res) => {
              toast.success("Customer updated");
              navigate(customerPath(res.id ?? c.id, "person"));
            },
            onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
          }
        );
      } else {
        createPerson.mutate(customerToCreatePerson(c), {
          onSuccess: (res) => {
            toast.success("Customer created");
            navigate(customerPath(res.id!, "person"));
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
        });
      }
      return;
    }

    // Company
    if (isEdit && c.id) {
      updateCompany.mutate(
        { id: c.id, body: customerToUpdateCompany(c) },
        {
          onSuccess: (res) => {
            toast.success("Customer updated");
            navigate(customerPath(res.id ?? c.id, "company"));
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
        }
      );
    } else {
      createCompany.mutate(customerToCreateCompany(c), {
        onSuccess: (res) => {
          const companyId = res.id;
          const street = c.address?.trim();
          const city = c.city?.trim();
          if (companyId && street && city && c.country && c.country !== NA) {
            addCompanyAddress.mutate(
              {
                companyId,
                body: {
                  street,
                  city,
                  countryCode: toCountryCode(c.country),
                  isMain: true,
                },
              },
              {
                onSettled: () => {
                  toast.success("Customer created");
                  navigate(customerPath(companyId, "company"));
                },
              }
            );
          } else {
            toast.success("Customer created");
            navigate(customerPath(companyId!, "company"));
          }
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
      });
    }
  };

  const isLoadingExisting =
    isEdit &&
    !existing &&
    (partyType === "company"
      ? companyQ.isLoading
      : partyType === "person"
        ? personQ.isLoading
        : personQ.isLoading ||
          (personQ.isError && !companyQ.isFetched) ||
          companyQ.isLoading);

  if (isLoadingExisting) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: "Edit" }]}
          title="Loading…"
          description="Fetching customer."
        />
      </AppShell>
    );
  }

  const dob = c.dateOfBirth ? parseISO(c.dateOfBirth) : undefined;
  const regDate = c.registrationDate ? parseISO(c.registrationDate) : undefined;

  const headerTitle = isEdit
    ? (isCompany ? `Edit ${c.companyName || ""}`.trim() : `Edit ${c.firstName} ${c.lastName}`.trim())
    : "New Customer";

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Customers", to: "/customers" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        title={headerTitle}
        description={isEdit ? "Update the customer's profile and contact details." : "Onboard a new individual or company client."}
        actions={
          <>
            <Button variant="outline" asChild><Link to={isEdit && c.id ? customerPath(c.id, c.customerType) : "/customers"}>Cancel</Link></Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer type switch */}
          <Card className="p-4 shadow-card border-border">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Customer type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {([
                { v: "Individual" as CustomerType, icon: User, label: "Individual", desc: "Personal client (KYC)" },
                { v: "Company" as CustomerType, icon: Building2, label: "Company", desc: "Legal entity (NIPT)" },
              ]).map((opt) => {
                const Icon = opt.icon;
                const active = c.customerType === opt.v;
                return (
                  <button
                    type="button"
                    key={opt.v}
                    onClick={() => set("customerType", opt.v)}
                    disabled={isEdit}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
                      active
                        ? "border-accent bg-accent-soft/40 text-foreground"
                        : "border-border hover:border-accent/60",
                      isEdit && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-accent" : "text-muted-foreground")} />
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Identity */}
          {isCompany ? (
            <Card className="p-6 shadow-card border-border">
              <h3 className="text-sm font-semibold text-foreground mb-1">Company details</h3>
              <p className="text-xs text-muted-foreground mb-5">Legal entity registration and identification.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="cname">Company Name *</Label>
                  <Input id="cname" value={c.companyName ?? ""} maxLength={160} onChange={(e) => set("companyName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nipt">NIPT *</Label>
                  <Input id="nipt" className="font-mono" value={c.nipt ?? ""} maxLength={30} onChange={(e) => set("nipt", e.target.value)} placeholder="L72416502K" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={c.companyType ?? NA} onValueChange={(v) => set("companyType", v === NA ? undefined : v as CompanyType)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NA}>N/A</SelectItem>
                      {COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={c.city ?? ""} maxLength={80} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={c.country ?? ""} maxLength={80} onChange={(e) => set("country", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>F5 Location</Label>
                  <Select value={c.f5Location || NA} onValueChange={(v) => set("f5Location", v)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NA}>N/A</SelectItem>
                      {F5_LOCATIONS.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          <span className="font-mono text-xs text-accent mr-2">{l.code}</span>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !regDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {regDate ? format(regDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single" selected={regDate}
                        onSelect={(d) => set("registrationDate", d ? format(d, "yyyy-MM-dd") : "")}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="legalrep">Legal Representative</Label>
                  <Input id="legalrep" value={c.legalRepresentative ?? ""} maxLength={120} onChange={(e) => set("legalRepresentative", e.target.value)} placeholder="Full name of the authorized signatory" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 shadow-card border-border">
              <h3 className="text-sm font-semibold text-foreground mb-1">Identity</h3>
              <p className="text-xs text-muted-foreground mb-5">Personal identification details for KYC.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pid">SSN / Personal ID *</Label>
                  <Input id="pid" className="font-mono" value={c.personalId} maxLength={40} onChange={(e) => set("personalId", e.target.value)} placeholder="AL-TR-J70412900A" />
                </div>
                <div className="space-y-1.5">
                  <Label>Issuing Country</Label>
                  <Select value={c.ssnIssuingCountry || NA} onValueChange={(v) => set("ssnIssuingCountry", v)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NA}>N/A</SelectItem>
                      {SSN_ISSUING_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fn">First Name *</Label>
                  <Input id="fn" value={c.firstName} maxLength={80} onChange={(e) => set("firstName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ln">Last Name *</Label>
                  <Input id="ln" value={c.lastName} maxLength={80} onChange={(e) => set("lastName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fath">Father's Name</Label>
                  <Input id="fath" value={c.fatherName ?? ""} maxLength={80} onChange={(e) => set("fatherName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single" selected={dob}
                        onSelect={(d) => set("dateOfBirth", d ? format(d, "yyyy-MM-dd") : "")}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>F5 Location</Label>
                  <Select value={c.f5Location || NA} onValueChange={(v) => set("f5Location", v)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NA}>N/A</SelectItem>
                      {F5_LOCATIONS.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          <span className="font-mono text-xs text-accent mr-2">{l.code}</span>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nat">Nationality</Label>
                  <Input id="nat" value={c.nationality ?? ""} maxLength={80} onChange={(e) => set("nationality", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={c.gender || "Other"} onValueChange={(v) => set("gender", v as Gender)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Other">N/A</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pob">Place of Birth</Label>
                  <Input id="pob" value={c.placeOfBirth ?? ""} maxLength={120} onChange={(e) => set("placeOfBirth", e.target.value)} />
                </div>
              </div>
            </Card>
          )}

          {/* Contact */}
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Contact</h3>
            <p className="text-xs text-muted-foreground mb-5">How to reach the {isCompany ? "company" : "customer"}.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={c.phone ?? ""} maxLength={40} onChange={(e) => set("phone", e.target.value)} placeholder="+355 69 ..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={c.email ?? ""} maxLength={255} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="addr">Address</Label>
                <Input id="addr" value={c.address ?? ""} maxLength={200} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={4} maxLength={1000} value={c.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes — visible to operators only." />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Compliance</h3>
            <p className="text-xs text-muted-foreground mb-4">PEP status drives manual review on offers.</p>
            <div className="space-y-1.5">
              <Label>PEP Status</Label>
              <Select value={c.pepStatus} onValueChange={(v) => set("pepStatus", v as PEPStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Politically Exposed Persons require enhanced due diligence and trigger compliance review on every new offer.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default CustomerForm;
