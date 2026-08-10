import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { User, Building2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Customer, customerSchema, ageFromDob,
  Gender, PEPStatus, CustomerType, CompanyType, COMPANY_TYPE_OPTIONS,
  SSN_ISSUING_COUNTRIES,
} from "@/data/customers";
import { useCreatePerson, useGetPerson, useUpdatePerson } from "@/api/people";
import { useCountryEnum } from "@/api/smart-enums";
import {
  useAddCompanyAddress,
  useCreateCompany,
  useGetCompany,
  useRemoveCompanyAddress,
  useUpdateCompany,
} from "@/api/companies";
import type { CompaniesAddCompanyAddressRequest, CompaniesCompanyAddressResponse } from "@/api/types";
import {
  customerPath,
  customerToCreateCompany,
  customerToCreatePerson,
  customerToUpdateCompany,
  customerToUpdatePerson,
  fromCountryCode,
  mapCompanyToCustomer,
  mapPersonToCustomer,
  parseCustomerPartyType,
  toCountryCode,
} from "@/api/adapters/customers";

const NA = "N/A";

type AddressRow = {
  /** Client key for drafts; server id string when persisted. */
  key: string;
  entryId?: number;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isMain: boolean;
  persisted: boolean;
};

const blankAddress = (overrides?: Partial<AddressRow>): AddressRow => ({
  key: `draft-${crypto.randomUUID()}`,
  street: "",
  city: "",
  country: "Albania",
  postalCode: "",
  isMain: false,
  persisted: false,
  ...overrides,
});

const fromApiAddress = (a: CompaniesCompanyAddressResponse): AddressRow =>
  blankAddress({
    key: a.id != null ? `addr-${a.id}` : `draft-${crypto.randomUUID()}`,
    entryId: a.id,
    street: a.street ?? "",
    city: a.city ?? "",
    country: fromCountryCode(a.countryCode) === NA ? "Albania" : fromCountryCode(a.countryCode),
    postalCode: a.postalCode ?? "",
    isMain: Boolean(a.isMain),
    persisted: a.id != null,
  });

const toAddressBody = (a: AddressRow): CompaniesAddCompanyAddressRequest => ({
  street: a.street.trim(),
  city: a.city.trim(),
  countryCode: toCountryCode(a.country),
  isMain: a.isMain,
  postalCode: a.postalCode.trim() || null,
});

const blank = (): Customer => ({
  id: "",
  customerType: "Individual",
  firstName: "", lastName: "", fatherName: "", personalId: "",
  ssnIssuingCountry: NA,
  dateOfBirth: "", gender: "Other",
  nationality: "", placeOfBirth: "",
  companyName: "", tradeName: "", nipt: "", companyType: undefined,
  registrationDate: "", legalRepresentative: "",
  f5Location: NA,
  address: "", city: "", country: "Albania",
  phone: "", email: "", occupation: "",
  pepStatus: "Unknown", notes: "",
  totalExposure: 0,
  createdDate: new Date().toISOString().slice(0, 10),
});

export type CustomerFormProps = {
  /** Render without AppShell — for use inside a dialog. */
  embedded?: boolean;
  onSuccess?: (created: { id: string; customerType: CustomerType }) => void;
  onCancel?: () => void;
};

const CustomerForm = ({ embedded = false, onSuccess, onCancel }: CustomerFormProps = {}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  // Embedded create modal never edits by route params.
  const isEdit = !embedded && Boolean(id);
  const partyType = embedded ? null : parseCustomerPartyType(searchParams.get("type"));

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
  const removeCompanyAddress = useRemoveCompanyAddress();
  const { data: nationalityOptions = [] } = useCountryEnum();

  const [c, setC] = useState<Customer>(blank());
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setC((s) => ({ ...s, [k]: v }));
  const isCompany = c.customerType === "Company";

  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [draft, setDraft] = useState<AddressRow>(blankAddress({ isMain: true }));
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [addressBusy, setAddressBusy] = useState(false);

  useEffect(() => {
    if (existing) setC(existing);
  }, [existing]);

  useEffect(() => {
    if (!isEdit || !companyQ.data) return;
    const rows = (companyQ.data.addresses ?? []).map(fromApiAddress);
    setAddresses(rows);
    setDraft(blankAddress({ isMain: rows.length === 0 }));
  }, [isEdit, companyQ.data]);

  const setMainExclusive = (rows: AddressRow[], mainKey: string) =>
    rows.map((r) => ({ ...r, isMain: r.key === mainKey }));

  const saving =
    createPerson.isPending ||
    updatePerson.isPending ||
    createCompany.isPending ||
    updateCompany.isPending ||
    addCompanyAddress.isPending ||
    removeCompanyAddress.isPending ||
    addressBusy;

  const finishCreate = (createdId: string, customerType: CustomerType) => {
    toast.success(isEdit ? "Customer updated" : "Customer created");
    if (onSuccess) {
      onSuccess({ id: createdId, customerType });
      return;
    }
    navigate(customerPath(createdId, customerType === "Company" ? "company" : "person"));
  };

  const validateDraftAddress = (row: AddressRow) => {
    if (!row.street.trim()) {
      toast.error("Street is required");
      return false;
    }
    if (!row.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!row.country || row.country === NA) {
      toast.error("Address country is required");
      return false;
    }
    return true;
  };

  const handleAddDraftAddress = () => {
    if (!validateDraftAddress(draft)) return;
    setAddresses((prev) => {
      const next = [...prev, { ...draft, key: `draft-${crypto.randomUUID()}`, persisted: false }];
      return draft.isMain ? setMainExclusive(next, next[next.length - 1].key) : next;
    });
    setDraft(blankAddress({ isMain: false }));
  };

  const handleAddPersistedAddress = async () => {
    if (!c.id) return;
    if (!validateDraftAddress(draft)) return;
    setAddressBusy(true);
    try {
      await addCompanyAddress.mutateAsync({
        companyId: c.id,
        body: toAddressBody(draft),
      });
      toast.success("Address added");
      setDraft(blankAddress({ isMain: false }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add address");
    } finally {
      setAddressBusy(false);
    }
  };

  const handleToggleMain = (key: string, checked: boolean) => {
    if (!checked) return; // only one may be main — turning off is done by selecting another
    setAddresses((prev) => setMainExclusive(prev, key));
  };

  const confirmDeleteAddress = async () => {
    if (!deleteKey) return;
    const row = addresses.find((a) => a.key === deleteKey);
    if (!row) {
      setDeleteKey(null);
      return;
    }

    if (row.persisted && c.id && row.entryId != null) {
      setAddressBusy(true);
      try {
        await removeCompanyAddress.mutateAsync({
          companyId: c.id,
          addressEntryId: String(row.entryId),
        });
        toast.success("Address removed");
        setDeleteKey(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove address");
      } finally {
        setAddressBusy(false);
      }
      return;
    }

    setAddresses((prev) => {
      const next = prev.filter((a) => a.key !== deleteKey);
      if (row.isMain && next.length > 0 && !next.some((a) => a.isMain)) {
        next[0] = { ...next[0], isMain: true };
      }
      return next;
    });
    setDeleteKey(null);
  };

  const persistDraftAddresses = async (companyId: string, rows: AddressRow[]) => {
    const withMain =
      rows.length > 0 && !rows.some((r) => r.isMain)
        ? setMainExclusive(rows, rows[0].key)
        : rows;
    for (const row of withMain) {
      await addCompanyAddress.mutateAsync({
        companyId,
        body: toAddressBody(row),
      });
    }
  };

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
              finishCreate(res.id ?? c.id, "Individual");
            },
            onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
          }
        );
      } else {
        if (ageFromDob(c.dateOfBirth) < 18) {
          toast.error("Person must be at least 18 years old");
          return;
        }
        createPerson.mutate(customerToCreatePerson(c), {
          onSuccess: (res) => {
            if (!res.id) {
              toast.error("Customer created without id");
              return;
            }
            finishCreate(res.id, "Individual");
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
            finishCreate(res.id ?? c.id, "Company");
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
        }
      );
    } else {
      createCompany.mutate(customerToCreateCompany(c), {
        onSuccess: async (res) => {
          const companyId = res.id;
          if (!companyId) {
            toast.error("Customer created without id");
            return;
          }
          setAddressBusy(true);
          try {
            if (addresses.length > 0) {
              await persistDraftAddresses(companyId, addresses);
            }
            finishCreate(companyId, "Company");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Company created, but saving addresses failed");
            finishCreate(companyId, "Company");
          } finally {
            setAddressBusy(false);
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
    if (embedded) {
      return <div className="py-8 text-sm text-muted-foreground text-center">Loading…</div>;
    }
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

  const headerTitle = isEdit
    ? (isCompany ? `Edit ${c.companyName || ""}`.trim() : `Edit ${c.firstName} ${c.lastName}`.trim())
    : "New Customer";

  const countryOptions = SSN_ISSUING_COUNTRIES.filter((x) => x !== "Other");

  const addressesSection = (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Addresses</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isEdit
            ? "Add or remove addresses. Only one can be main."
            : "Saved after the company is created. Only one can be main."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Address</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Main</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                  No addresses yet.
                </TableCell>
              </TableRow>
            )}
            {addresses.map((row) => (
              <TableRow key={row.key} className="hover:bg-accent-soft/40">
                <TableCell className="text-sm align-top">
                  <div className="font-medium text-foreground">{row.street}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[row.city, row.postalCode, row.country].filter(Boolean).join(", ")}
                  </div>
                </TableCell>
                <TableCell className="align-top ">
                  <Checkbox
                    checked={row.isMain}
                    disabled={row.persisted}
                    onCheckedChange={(v) => handleToggleMain(row.key, v === true)}
                    aria-label="Main address"
                    className="h-4 w-4 mt-2 border-success data-[state=checked]:bg-success data-[state=checked]:border-success data-[state=checked]:text-success-foreground"
                  />
                </TableCell>
                <TableCell className="align-top text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    disabled={addressBusy}
                    onClick={() => setDeleteKey(row.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-6 border-t border-border bg-muted/20 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add address</div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-street">Street *</Label>
          <Input
            id="addr-street"
            value={draft.street}
            maxLength={200}
            onChange={(e) => setDraft((s) => ({ ...s, street: e.target.value }))}
            placeholder="Rruga e Durrësit 12"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="addr-city">City *</Label>
            <Input
              id="addr-city"
              value={draft.city}
              maxLength={80}
              onChange={(e) => setDraft((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-postal">Postal code</Label>
            <Input
              id="addr-postal"
              value={draft.postalCode}
              maxLength={20}
              onChange={(e) => setDraft((s) => ({ ...s, postalCode: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Country *</Label>
          <Select
            value={draft.country}
            onValueChange={(v) => setDraft((s) => ({ ...s, country: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {countryOptions.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="addr-main"
              checked={draft.isMain}
              onCheckedChange={(v) => setDraft((s) => ({ ...s, isMain: v === true }))}
              className="h-4 w-4 border-success data-[state=checked]:bg-success data-[state=checked]:border-success data-[state=checked]:text-success-foreground"
            />
            <Label htmlFor="addr-main" className="text-sm">Main</Label>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={addressBusy}
            onClick={() => {
              if (isEdit && c.id) void handleAddPersistedAddress();
              else handleAddDraftAddress();
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </Card>
  );

  const formBody = (
      <div className={cn(
        "grid grid-cols-1 gap-6",
        !embedded && "lg:grid-cols-3",
      )}>
        <div className={cn("space-y-6", !embedded && "lg:col-span-2")}>
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
                    onClick={() => {
                      set("customerType", opt.v);
                      if (opt.v === "Company" && addresses.length === 0) {
                        setDraft(blankAddress({ isMain: true }));
                      }
                    }}
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
                  <Label htmlFor="cname">Legal name *</Label>
                  <Input id="cname" value={c.companyName ?? ""} maxLength={160} onChange={(e) => set("companyName", e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="tname">Trade name</Label>
                  <Input id="tname" value={c.tradeName ?? ""} maxLength={160} onChange={(e) => set("tradeName", e.target.value)} placeholder="Optional commercial name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nipt">Registration number / NIPT *</Label>
                  <Input id="nipt" className="font-mono" value={c.nipt ?? ""} maxLength={30} onChange={(e) => set("nipt", e.target.value)} placeholder="L72416502K" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company type</Label>
                  <Select value={c.companyType ?? NA} onValueChange={(v) => set("companyType", v === NA ? undefined : v as CompanyType)}>
                    <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NA}>N/A</SelectItem>
                      {COMPANY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Country *</Label>
                  <Select value={c.country && c.country !== NA ? c.country : "Albania"} onValueChange={(v) => set("country", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nationality *</Label>
                  <Select
                    value={c.nationality || undefined}
                    onValueChange={(v) => set("nationality", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label>Country *</Label>
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
                  <Label>Date of Birth *</Label>
                  <DatePicker
                    value={dob}
                    onChange={(d) => set("dateOfBirth", d ? format(d, "yyyy-MM-dd") : "")}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
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
                  <Label>Nationality *</Label>
                  <Select
                    value={c.nationality || undefined}
                    onValueChange={(v) => set("nationality", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {isCompany ? (
            addressesSection
          ) : (
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
          )}
        </div>
      </div>
  );

  const deleteDialog = (
    <AlertDialog open={!!deleteKey} onOpenChange={(o) => !o && setDeleteKey(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this address?</AlertDialogTitle>
          <AlertDialogDescription>
            {isEdit
              ? "The address will be removed from this company."
              : "This draft address will be removed before the company is created."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void confirmDeleteAddress()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        {formBody}
        <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-background pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {saving ? "Saving…" : "Create customer"}
          </Button>
        </div>
        {deleteDialog}
      </div>
    );
  }

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

      {formBody}
      {deleteDialog}
    </AppShell>
  );
};

export default CustomerForm;
