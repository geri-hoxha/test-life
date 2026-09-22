import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { OverlayLoader } from "@/components/Loader";
import PageHeader from "@/components/layout/PageHeader";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useListProductGroups } from "@/api/product-groups";
import { useCreateProduct } from "@/api/products";
import type { ProductsActuarialCode, ProductsCreateProductRequest, ProductsPolicyPlanType } from "@/api/types";
import { usePolicyPlanTypeOptions } from "@/hooks/usePolicyPlanTypeOptions";
import { useActuarialCodeOptions } from "@/hooks/useActuarialCodeOptions";
import { cn } from "@/lib/utils";
import { DocumentCombobox } from "@/components/DocumentCombobox";
import { toast } from "sonner";
import { Hash, Landmark, Package } from "lucide-react";
import { getCurrencies } from "@/config/currencies";

const SECTIONS = [
  { id: "identity", label: "Identity", icon: Package },
  { id: "plan", label: "Plan", icon: Landmark },
  { id: "codes", label: "Codes", icon: Hash },
] as const;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productGroupId = searchParams.get("groupId")?.trim() ?? "";

  const { data: groupsPage } = useListProductGroups({
    pageNumber: 1,
    pageSize: 100,
  });
  const policyPlanTypeOptions = usePolicyPlanTypeOptions();
  const actuarialCodeOptions = useActuarialCodeOptions();
  const createProduct = useCreateProduct();

  const apiGroups = groupsPage?.items ?? [];
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [coverageText, setCoverageText] = useState("");
  const [defaultPrintableTemplateDocumentId, setDefaultPrintableTemplateDocumentId] = useState("");
  const [defaultTermsTemplateDocumentId, setDefaultTermsTemplateDocumentId] = useState("");
  const [policyPlanType, setPolicyPlanType] = useState<ProductsPolicyPlanType | "">("");
  const [maximumCoverageTermMonths, setMaximumCoverageTermMonths] = useState("");
  const [actuarialCode, setActuarialCode] = useState<ProductsActuarialCode | "">("");
  const [sapProductCode, setSapProductCode] = useState("");
  const [sapChannelCode, setSapChannelCode] = useState("");
  const [f5ProductCode, setF5ProductCode] = useState("");

  useEffect(() => {
    if (!productGroupId) navigate("/products", { replace: true });
  }, [navigate, productGroupId]);

  const toggleCurrency = (c: string) =>
    setCurrencies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const selectedGroup = apiGroups.find((g) => g.id === productGroupId);
  const selectedPlan = policyPlanTypeOptions.find((o) => o.value === policyPlanType);

  const canSave =
    Boolean(productGroupId) &&
    Boolean(name.trim()) &&
    Boolean(policyPlanType) &&
    currencies.length > 0;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productGroupId) {
      toast.error("Open Create Product from a product family");
      return;
    }
    if (!policyPlanType) {
      toast.error("Policy plan type is required");
      return;
    }
    if (currencies.length === 0) {
      toast.error("Select at least one currency");
      return;
    }

    const termMonths =
      maximumCoverageTermMonths.trim() === ""
        ? null
        : Number(maximumCoverageTermMonths);
    if (
      termMonths != null &&
      (!Number.isInteger(termMonths) || termMonths < 0)
    ) {
      toast.error("Maximum coverage term must be a whole number of months");
      return;
    }

    const body: ProductsCreateProductRequest = {
      name: name.trim(),
      productGroupId,
      policyPlanType,
      supportedCurrencies: currencies,
      coverageText: coverageText.trim() || undefined,
      defaultPrintableTemplateDocumentId: defaultPrintableTemplateDocumentId || null,
      defaultTermsTemplateDocumentId: defaultTermsTemplateDocumentId || null,
      maximumCoverageTermMonths: termMonths,
      actuarialCode: actuarialCode || null,
      sapProductCode: sapProductCode.trim() || null,
      sapChannelCode: sapChannelCode.trim() || null,
      f5ProductCode: f5ProductCode.trim() || null,
    };

    setSaving(true);
    try {
      const created = await createProduct.mutateAsync(body);
      if (!created.id) throw new Error("Product created without id");
      toast.success(`Product ${created.name ?? name} created`);
      navigate(`/products/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || createProduct.isPending;

  if (!productGroupId) return null;

  return (
    <AppShell>
      {busy && (
        <OverlayLoader
          label="Creating product…"
          description="Saving product details."
        />
      )}

      <PageHeader
        breadcrumbs={[
          { label: "Products", to: "/products" },
          ...(selectedGroup
            ? [{
                label: selectedGroup.name ?? "Family",
                to: `/products/groups/${encodeURIComponent(selectedGroup.legacyCode?.trim() || selectedGroup.id || "")}`,
              }]
            : []),
          { label: "Create" },
        ]}
        title="Create Product"
        description="Identity, plan, and codes. Coverages and documents can be added after save."
        actions={
          <div className="flex flex-col items-end gap-1">
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => void handleSave()}
              disabled={busy || !canSave}
            >
              {busy ? "Saving…" : "Save Product"}
            </Button>
            {!canSave && (
              <p className="text-[11px] text-muted-foreground">
                Complete the required fields to save.
              </p>
            )}
          </div>
        }
      />

      <div className="sticky top-16 z-20 -mx-2 mb-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <nav className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section id="identity" className="scroll-mt-32">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Identity</CardTitle>
                <CardDescription>How this product is named and printed.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Product name *</Label>
                  <Input
                    id="name"
                    maxLength={512}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ISP A_Mortgage Standard 07"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Product family</Label>
                  <Input
                    readOnly
                    className="bg-muted/40"
                    value={
                      selectedGroup
                        ? [selectedGroup.legacyCode?.trim(), selectedGroup.name].filter(Boolean).join("  ")
                        : productGroupId
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="coverage-text">Coverage text</Label>
                  <Textarea
                    id="coverage-text"
                    rows={3}
                    maxLength={4000}
                    value={coverageText}
                    onChange={(e) => setCoverageText(e.target.value)}
                    placeholder="Printable coverage description shown on policies"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Default printable template</Label>
                  <DocumentCombobox
                    value={defaultPrintableTemplateDocumentId}
                    onValueChange={setDefaultPrintableTemplateDocumentId}
                    placeholder="Select document…"
                    allowClear
                    clearLabel="None"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Default terms template</Label>
                  <DocumentCombobox
                    value={defaultTermsTemplateDocumentId}
                    onValueChange={setDefaultTermsTemplateDocumentId}
                    placeholder="Select document…"
                    allowClear
                    clearLabel="None"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="plan" className="scroll-mt-32">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Plan</CardTitle>
                <CardDescription>How premium is calculated and how long cover can last.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Policy plan type *</Label>
                  <Select
                    value={policyPlanType || undefined}
                    onValueChange={(v) => setPolicyPlanType(v as ProductsPolicyPlanType)}
                  >
                    <SelectTrigger>
                      {selectedPlan ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{selectedPlan.label}</span>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">{selectedPlan.value}</span>
                        </span>
                      ) : (
                        <SelectValue placeholder="Select policy plan type…" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {policyPlanTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex flex-col text-left py-0.5">
                            <span className="flex items-center gap-2">
                              <span>{opt.label}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{opt.value}</span>
                            </span>
                            {opt.description && (
                              <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                                {opt.description}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlan?.description && (
                    <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-coverage-term">Maximum coverage term (months)</Label>
                  <Input
                    id="max-coverage-term"
                    type="number"
                    min={0}
                    step={1}
                    className="font-mono"
                    value={maximumCoverageTermMonths}
                    onChange={(e) => setMaximumCoverageTermMonths(e.target.value)}
                    placeholder="e.g. 360"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Currencies *</Label>
                  <div className="flex flex-wrap gap-2">
                    {getCurrencies().map((c) => {
                      const active = currencies.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => toggleCurrency(c)}
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-sm font-mono font-medium transition-colors",
                            active
                              ? "bg-accent text-accent-foreground border-accent"
                              : "bg-card text-foreground border-border hover:border-accent hover:text-accent",
                          )}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
          <section id="codes" className="scroll-mt-32">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">External codes</CardTitle>
                <CardDescription>Optional actuarial, SAP, and F5 identifiers used by downstream systems.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label>Actuarial code</Label>
                  <Select
                    value={actuarialCode || "none"}
                    onValueChange={(v) => setActuarialCode(v === "none" ? "" : (v as ProductsActuarialCode))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select actuarial code…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {actuarialCodeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.text === opt.value ? opt.value : `${opt.text} (${opt.value})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f5-product-code">F5 product code</Label>
                  <Input
                    id="f5-product-code"
                    className="font-mono"
                    value={f5ProductCode}
                    onChange={(e) => setF5ProductCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sap-product-code">SAP product code</Label>
                  <Input
                    id="sap-product-code"
                    maxLength={20}
                    className="font-mono"
                    value={sapProductCode}
                    onChange={(e) => setSapProductCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sap-channel-code">SAP channel code</Label>
                  <Input
                    id="sap-channel-code"
                    maxLength={20}
                    className="font-mono"
                    value={sapChannelCode}
                    onChange={(e) => setSapChannelCode(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        </aside>
      </div>
    </AppShell>
  );
};

export default CreateProduct;
