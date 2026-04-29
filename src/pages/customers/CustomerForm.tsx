import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
  Customer, customerSchema, getCustomer, newCustomerId, upsertCustomer, Gender, PEPStatus,
} from "@/data/customers";

const blank = (): Customer => ({
  id: newCustomerId(),
  firstName: "", lastName: "", personalId: "",
  dateOfBirth: "", gender: "Male",
  address: "", city: "", country: "",
  phone: "", email: "", occupation: "",
  pepStatus: "Unknown", notes: "",
  totalExposure: 0,
  createdDate: new Date().toISOString().slice(0, 10),
});

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getCustomer(id) : undefined;
  const isEdit = !!existing;
  const initial = useMemo(() => existing ?? blank(), [existing]);

  const [c, setC] = useState<Customer>(initial);
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setC((s) => ({ ...s, [k]: v }));

  const handleSave = () => {
    const result = customerSchema.safeParse(c);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    upsertCustomer(c);
    toast.success(isEdit ? "Customer updated" : "Customer created");
    navigate(`/customers/${c.id}`);
  };

  const dob = c.dateOfBirth ? parseISO(c.dateOfBirth) : undefined;

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Customers", to: "/customers" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        title={isEdit ? `Edit ${c.firstName} ${c.lastName}`.trim() : "New Customer"}
        description={isEdit ? "Update the customer's profile and contact details." : "Onboard a new individual or business client."}
        actions={
          <>
            <Button variant="outline" asChild><Link to={isEdit ? `/customers/${c.id}` : "/customers"}>Cancel</Link></Button>
            <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isEdit ? "Save changes" : "Create customer"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Identity</h3>
            <p className="text-xs text-muted-foreground mb-5">Legal identification details for KYC.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fn">First Name *</Label>
                <Input id="fn" value={c.firstName} maxLength={80} onChange={(e) => set("firstName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ln">Last Name *</Label>
                <Input id="ln" value={c.lastName} maxLength={80} onChange={(e) => set("lastName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pid">Personal ID / National ID *</Label>
                <Input id="pid" className="font-mono" value={c.personalId} maxLength={40} onChange={(e) => set("personalId", e.target.value)} />
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
                <Label>Gender</Label>
                <Select value={c.gender} onValueChange={(v) => set("gender", v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occ">Occupation</Label>
                <Input id="occ" value={c.occupation ?? ""} maxLength={100} onChange={(e) => set("occupation", e.target.value)} />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Contact</h3>
            <p className="text-xs text-muted-foreground mb-5">How to reach the customer.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={c.phone ?? ""} maxLength={40} onChange={(e) => set("phone", e.target.value)} placeholder="+49 170 555 0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={c.email ?? ""} maxLength={255} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="addr">Address</Label>
                <Input id="addr" value={c.address ?? ""} maxLength={200} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={c.city ?? ""} maxLength={80} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={c.country ?? ""} maxLength={80} onChange={(e) => set("country", e.target.value)} />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Notes</h3>
            <p className="text-xs text-muted-foreground mb-4">Internal notes — visible to operators only.</p>
            <Textarea rows={4} maxLength={1000} value={c.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Any internal context about the customer…" />
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
