import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProduct, updateProductFlags, updateProduct, ProductStatus, Product } from "@/data/products";
import { Check, AlertCircle, ScrollText, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import VersionsTab from "./VersionsTab";
import CoveragesTab from "./CoveragesTab";
import PremiumRulesTab from "./PremiumRulesTab";
import TemplatesTab from "./TemplatesTab";
import DocumentsTab from "./DocumentsTab";

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const ALL_CURRENCIES = ["EUR", "ALL", "USD", "GBP", "CHF"];

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const SectionEmpty = ({ icon: Icon, title, hint, cta }: { icon: any; title: string; hint: string; cta: string }) => (
  <Card className="p-12 shadow-card border-border border-dashed flex flex-col items-center text-center">
    <div className="h-12 w-12 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
      <Icon className="h-6 w-6" />
    </div>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    <p className="text-xs text-muted-foreground mt-1 max-w-md">{hint}</p>
    <Button size="sm" className="mt-4 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
      <Plus className="h-4 w-4" />{cta}
    </Button>
  </Card>
);

const FLAG_DEFS: { key: keyof Product["flags"]; label: string; hint: string }[] = [
  { key: "pep", label: "PEP check required", hint: "Politically Exposed Persons trigger enhanced due-diligence." },
  { key: "highInsuredAmount", label: "High insured amount requires review", hint: "Sum insured above the product threshold goes to manual review." },
  { key: "totalExposure", label: "Total customer exposure requires review", hint: "If the customer's combined exposure across policies exceeds the limit." },
  { key: "manualUnderwriting", label: "Manual underwriting required", hint: "Every application is routed to an underwriter regardless of other rules." },
  { key: "compliance", label: "Compliance review required", hint: "An additional compliance officer sign-off is mandatory before issuance." },
];

const ProductDetail = () => {
  const { id } = useParams();
  const product = id ? getProduct(id) : undefined;

  const [flags, setFlags] = useState<Product["flags"] | null>(product?.flags ?? null);

  if (!product || !flags) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Not found" }]}
          title="Product not found"
        />
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This product no longer exists.</p>
          <Button asChild className="mt-4"><Link to="/products">Back to products</Link></Button>
        </Card>
      </AppShell>
    );
  }

  const dirty = JSON.stringify(flags) !== JSON.stringify(product.flags);

  const toggleFlag = (key: keyof Product["flags"]) =>
    setFlags((f) => (f ? { ...f, [key]: !f[key] } : f));

  const saveFlags = () => {
    updateProductFlags(product.id, flags);
    toast.success("Verification rules saved");
  };

  const flagList = FLAG_DEFS.map((f) => ({ ...f, on: flags[f.key] }));

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.name}
        description={product.description}
      />

      {/* Summary strip */}
      <Card className="p-5 mb-6 shadow-card border-border">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Code</div>
            <div className="font-mono text-sm text-accent mt-0.5">{product.code}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</div>
            <Badge className={`mt-0.5 font-medium border-0 ${statusClass[product.status]}`}>{product.status}</Badge>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</div>
            <div className="text-sm mt-0.5">{product.type}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Version</div>
            <div className="font-mono text-sm mt-0.5">{product.activeVersion}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Currencies</div>
            <div className="flex gap-1 mt-0.5">
              {product.currencies.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Created</div>
            <div className="text-sm mt-0.5">{product.createdDate}</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="coverages">Coverages</TabsTrigger>
          <TabsTrigger value="templates">Templates / Packages</TabsTrigger>
          <TabsTrigger value="premium">Premium Rules</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="verification">Verification Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 shadow-card border-border md:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-3">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || "No description provided."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Required documents</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.requiredDocuments.map((d) => (
                      <Badge key={d} className="bg-accent-soft text-accent-soft-foreground border-0">{d}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Currencies</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.currencies.map((c) => (
                      <Badge key={c} variant="outline" className="font-mono">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-card border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" /> Verification flags
              </h3>
              <ul className="space-y-2.5">
                {flagList.map((f) => (
                  <li key={f.key} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 h-4 w-4 rounded-sm flex items-center justify-center ${f.on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {f.on && <Check className="h-3 w-3" />}
                    </span>
                    <span className={f.on ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <VersionsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="coverages">
          <CoveragesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="premium">
          <PremiumRulesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="verification">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-accent" /> Verification rules
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle the conditions that route an application to manual review.
                </p>
              </div>
              <Button
                size="sm"
                onClick={saveFlags}
                disabled={!dirty}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
            <div className="divide-y divide-border">
              {flagList.map((f) => (
                <label
                  key={f.key}
                  htmlFor={`flag-${f.key}`}
                  className="flex items-center justify-between px-5 py-4 gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${
                        f.on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{f.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.hint}</div>
                    </div>
                  </div>
                  <Switch
                    id={`flag-${f.key}`}
                    checked={f.on}
                    onCheckedChange={() => toggleFlag(f.key)}
                  />
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default ProductDetail;
