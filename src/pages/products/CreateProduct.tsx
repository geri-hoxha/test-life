import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { addProduct, ProductStatus } from "@/data/products";
import { toast } from "sonner";
import { X } from "lucide-react";

const ALL_CURRENCIES = ["EUR", "ALL", "USD"] as const;

const DOC_OPTIONS = [
  "ID document",
  "Medical questionnaire",
  "Medical report",
  "Proof of income",
  "Proof of address",
  "Beneficiary declaration",
];

const FLAGS = [
  { key: "pep", label: "PEP check required", desc: "Politically Exposed Person screening before issuance." },
  { key: "highInsuredAmount", label: "High insured amount requires review", desc: "Trigger underwriter review above threshold." },
  { key: "totalExposure", label: "Total customer exposure requires review", desc: "Aggregate exposure across all policies." },
  { key: "manualUnderwriting", label: "Manual underwriting required", desc: "Always route to underwriter, skip auto-approval." },
  { key: "compliance", label: "Compliance review required", desc: "AML / regulatory compliance officer sign-off." },
] as const;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const type = "Life Insurance";
  const [status, setStatus] = useState<ProductStatus>("Draft");
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [docs, setDocs] = useState<string[]>(["ID document"]);
  const [newDoc, setNewDoc] = useState("");
  const [flags, setFlags] = useState({
    pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false,
  });
  const [agentCommissionPct, setAgentCommissionPct] = useState<string>("0");
  const [bankCommissionPct, setBankCommissionPct] = useState<string>("0");

  const toggleCurrency = (c: string) =>
    setCurrencies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addDoc = (d: string) => {
    const v = d.trim();
    if (!v || docs.includes(v)) return;
    setDocs([...docs, v]);
    setNewDoc("");
  };

  const handleSave = () => {
    if (!name || !code) {
      toast.error("Name and code are required");
      return;
    }
    const created = addProduct({
      name, code, description, type, status,
      currencies, requiredDocuments: docs, flags,
      agentCommission: (parseFloat(agentCommissionPct) || 0) / 100,
      bankCommission: (parseFloat(bankCommissionPct) || 0) / 100,
    });
    toast.success(`Product ${created.code} created`);
    navigate(`/products/${created.id}`);
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Create" }]}
        title="Create Product"
        description="Define a new life-insurance product. You can refine versions, coverages and rules afterwards."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/products">Cancel</Link></Button>
            <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Save Product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">General information</h3>
            <p className="text-xs text-muted-foreground mb-5">Basic identity of the product.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TermLife Plus 20Y" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Product Code *</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. TL-PLUS-20" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent-comm">Agent Commission (%)</Label>
                <div className="relative">
                  <Input id="agent-comm" type="number" min="0" max="100" step="0.01" value={agentCommissionPct} onChange={(e) => setAgentCommissionPct(e.target.value)} className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank-comm">Bank Commission (%)</Label>
                <div className="relative">
                  <Input id="bank-comm" type="number" min="0" max="100" step="0.01" value={bankCommissionPct} onChange={(e) => setBankCommissionPct(e.target.value)} className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short marketing or internal description" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Available currencies</h3>
            <p className="text-xs text-muted-foreground mb-4">Select all currencies in which premiums and benefits can be quoted.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CURRENCIES.map((c) => {
                const active = currencies.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCurrency(c)}
                    className={`px-4 py-2 rounded-md border text-sm font-mono font-medium transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Required documents</h3>
            <p className="text-xs text-muted-foreground mb-4">Documents the customer must submit when applying.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {docs.map((d) => (
                <Badge key={d} className="bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft border-0 gap-1 pl-2.5 pr-1 py-1">
                  {d}
                  <button onClick={() => setDocs(docs.filter((x) => x !== d))} className="rounded hover:bg-accent/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {docs.length === 0 && <span className="text-xs text-muted-foreground">No documents added.</span>}
            </div>
            <div className="flex gap-2">
              <Input
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc(newDoc))}
                placeholder="Add custom document…"
              />
              <Button type="button" variant="outline" onClick={() => addDoc(newDoc)}>Add</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
              {DOC_OPTIONS.filter((d) => !docs.includes(d)).map((d) => (
                <button key={d} onClick={() => addDoc(d)} className="text-xs px-2 py-0.5 rounded border border-dashed border-border hover:border-accent hover:text-accent">
                  + {d}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Manual verification flags</h3>
            <p className="text-xs text-muted-foreground mb-4">Trigger manual review for sensitive cases.</p>
            <div className="space-y-3">
              {FLAGS.map((f) => (
                <label key={f.key} className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-accent/40 hover:bg-accent-soft/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={flags[f.key]}
                    onCheckedChange={(v) => setFlags((s) => ({ ...s, [f.key]: !!v }))}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">{f.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateProduct;
