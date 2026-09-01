import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetProduct,
  useUpdateProduct,
  mapApiProduct,
  useAddProductPaymentMethod,
  useRemoveProductPaymentMethod,
} from "@/api/products";
import type {
  ProductsCalculationMethod,
  ProductsIssuanceMode,
  ProductsPolicyPlanType,
} from "@/api/types";
import { useListProductGroups } from "@/api/product-groups";
import { useListDocuments } from "@/api/documents";
import { useListBankAccounts } from "@/api/bank-accounts";
import { usePolicyPlanTypeOptions } from "@/hooks/usePolicyPlanTypeOptions";
import {
  SCHEDULE_BASIS_DESCRIPTIONS,
  SCHEDULE_BASIS_LABELS,
} from "@/data/policy-plan-types";
import { BankAccountCombobox } from "@/components/BankAccountCombobox";
import { Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CoveragesTab from "./CoveragesTab";
import DocumentsTab from "./DocumentsTab";
import CurrenciesTab from "./CurrenciesTab";
import { getCurrencies } from "@/config/currencies";
import { useListCoverages } from "@/api/coverages";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ISSUANCE_MODE_OPTIONS = [
  { value: "annualRenewable", label: "Annual renewable" },
  { value: "wholeOfTerm", label: "Whole of term" },
] as const;

const CALCULATION_METHOD_OPTIONS = [
  { value: "declining", label: "Declining" },
  { value: "leveled", label: "Leveled" },
] as const;

type EditableFields = {
  name: string;
  coverageText: string;
  currencies: string[];
  defaultPrintableTemplateDocumentId: string;
  policyPlanType: ProductsPolicyPlanType | "";
  issuanceMode: ProductsIssuanceMode | "";
  calculationMethod: ProductsCalculationMethod | "";
  maxCoveredYears: string;
  bankAccountIds: string[];
};

const ProductDetail = () => {
  const { id } = useParams();
  const { data: apiProduct, isLoading, isError } = useGetProduct(id ?? "", { enabled: Boolean(id) });
  const updateProductMutation = useUpdateProduct();
  const addPaymentMethod = useAddProductPaymentMethod();
  const removePaymentMethod = useRemoveProductPaymentMethod();
  const { data: groupsPage } = useListProductGroups({ pageNumber: 1, pageSize: 200 });
  const { data: documentsPage } = useListDocuments({ pageNumber: 1, pageSize: 200 });
  const { data: bankAccountsPage } = useListBankAccounts({ pageNumber: 1, pageSize: 200 });
  const policyPlanTypeOptions = usePolicyPlanTypeOptions();
  const { data: coveragesCatalog } = useListCoverages({ pageNumber: 1, pageSize: 200 });

  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct]
  );

  const coverageNameById = useMemo(
    () =>
      Object.fromEntries(
        (coveragesCatalog?.items ?? []).map((c) => [c.id ?? "", c.name?.trim() || c.id || "—"])
      ),
    [coveragesCatalog?.items]
  );

  /** Coverages with isSumInsuredFixed that are missing fixedSumInsuredAmount for any supported currency. */
  const incompleteFixedSumInsured = useMemo(() => {
    const currencies = apiProduct?.supportedCurrencies ?? [];
    if (currencies.length === 0) return [];
    return (apiProduct?.coverages ?? [])
      .filter((c) => c.isSumInsuredFixed)
      .map((c) => {
        const have = new Set(
          (c.currencyLimits ?? [])
            .filter((l) => l.type === "fixedSumInsuredAmount" && l.currency)
            .map((l) => l.currency as string)
        );
        const missing = currencies.filter((cur) => !have.has(cur));
        return {
          entryId: c.id,
          coverageId: c.coverageId ?? "",
          name: coverageNameById[c.coverageId ?? ""] || c.coverageId || `Coverage #${c.id}`,
          missing,
        };
      })
      .filter((c) => c.missing.length > 0);
  }, [apiProduct?.coverages, apiProduct?.supportedCurrencies, coverageNameById]);

  const templateDocuments = documentsPage?.items ?? [];
  const bankAccounts = bankAccountsPage?.items ?? [];
  const paymentMethods = apiProduct?.paymentMethods ?? [];

  const currentBankAccountIds = useMemo(
    () =>
      paymentMethods
        .map((pm) => pm.bankAccountId)
        .filter((id): id is string => Boolean(id)),
    [paymentMethods]
  );
  const currentBankAccountIdsKey = useMemo(
    () => [...currentBankAccountIds].sort().join("|"),
    [currentBankAccountIds]
  );

  const productGroupName = useMemo(() => {
    const gid = product?.productGroupId;
    if (!gid) return "—";
    const match = (groupsPage?.items ?? []).find((g) => g.id === gid);
    return match?.english?.trim() || match?.name?.trim() || gid;
  }, [product?.productGroupId, groupsPage?.items]);

  const [fields, setFields] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!product) {
      setFields(null);
      return;
    }
    setFields({
      name: product.name,
      coverageText: product.coverageText ?? "",
      currencies: [...product.currencies],
      defaultPrintableTemplateDocumentId: product.defaultPrintableTemplateDocumentId ?? "",
      policyPlanType: product.policyPlanType ?? "",
      issuanceMode: (product.issuanceMode as ProductsIssuanceMode | null) ?? "",
      calculationMethod: (product.calculationMethod as ProductsCalculationMethod | null) ?? "",
      maxCoveredYears:
        product.maxCoveredYears != null && product.maxCoveredYears !== undefined
          ? String(product.maxCoveredYears)
          : "",
      bankAccountIds: [...currentBankAccountIds],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when product or payment method ids change by value
  }, [product, currentBankAccountIdsKey]);

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products", to: "/products" }, { label: "…" }]}
          title="Loading…"
          description="Fetching product."
        />
      </AppShell>
    );
  }

  if (isError || !product || !fields) {
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

  const paymentDirty =
    JSON.stringify([...fields.bankAccountIds].sort()) !==
    JSON.stringify([...currentBankAccountIds].sort());

  const fieldsDirty =
    fields.name !== product.name ||
    fields.coverageText !== (product.coverageText ?? "") ||
    JSON.stringify(fields.currencies) !== JSON.stringify(product.currencies) ||
    fields.defaultPrintableTemplateDocumentId !== (product.defaultPrintableTemplateDocumentId ?? "") ||
    fields.policyPlanType !== (product.policyPlanType ?? "") ||
    fields.issuanceMode !== (product.issuanceMode ?? "") ||
    fields.calculationMethod !== (product.calculationMethod ?? "") ||
    fields.maxCoveredYears !==
      (product.maxCoveredYears != null && product.maxCoveredYears !== undefined
        ? String(product.maxCoveredYears)
        : "") ||
    paymentDirty;

  const toggleCurrency = (c: string) =>
    setFields((f) =>
      f
        ? { ...f, currencies: f.currencies.includes(c) ? f.currencies.filter((x) => x !== c) : [...f.currencies, c] }
        : f
    );

  const saveFields = async () => {
    if (!fields.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (fields.currencies.length === 0) {
      toast.error("Select at least one currency");
      return;
    }

    setSaving(true);
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        body: {
          name: fields.name.trim(),
          supportedCurrencies: fields.currencies,
          coverageText: fields.coverageText.trim() || undefined,
          defaultPrintableTemplateDocumentId: fields.defaultPrintableTemplateDocumentId || null,
          policyPlanType: fields.policyPlanType || null,
          issuanceMode: fields.issuanceMode || null,
          calculationMethod: fields.calculationMethod || null,
          maxCoveredYears: fields.maxCoveredYears === "" ? null : Number(fields.maxCoveredYears),
        },
      });

      if (paymentDirty) {
        const currentSet = new Set(currentBankAccountIds);
        const nextSet = new Set(fields.bankAccountIds);
        const toAdd = fields.bankAccountIds.filter((id) => !currentSet.has(id));
        const toRemove = paymentMethods.filter(
          (pm) => pm.bankAccountId && !nextSet.has(pm.bankAccountId) && pm.id != null
        );

        for (const pm of toRemove) {
          await removePaymentMethod.mutateAsync({
            productId: product.id,
            paymentMethodEntryId: String(pm.id),
          });
        }
        for (const bankAccountId of toAdd) {
          await addPaymentMethod.mutateAsync({
            productId: product.id,
            body: { bankAccountId },
          });
        }
      }

      toast.success("Product details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const templateLabel = (docId: string) => {
    if (!docId) return "—";
    const doc = templateDocuments.find((d) => d.id === docId);
    return doc?.originalFileName ?? doc?.storedFileName ?? docId;
  };

  const paymentLabel = () => {
    if (paymentMethods.length === 0) return "—";
    const labels = paymentMethods.map((pm) => {
      const account = bankAccounts.find((a) => a.id === pm.bankAccountId);
      if (!account) {
        return [pm.currency, pm.bankAccountId].filter(Boolean).join(" · ") || "—";
      }
      return [account.bankName, account.currency ?? pm.currency, account.iban || account.accountNumber]
        .filter(Boolean)
        .join(" · ");
    });
    if (labels.length === 1) return labels[0];
    return `${labels.length} accounts`;
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.name}
        description={product.coverageText?.trim() || undefined}
      />

      <Card className="p-5 mb-6 shadow-card border-border">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Product family</div>
            <div className="text-sm mt-0.5">{productGroupName}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Currencies</div>
            <div className="flex gap-1 mt-0.5">
              {product.currencies.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                product.currencies.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Coverages</div>
            <div className="text-sm mt-0.5">{apiProduct?.coverages?.length ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Document types</div>
            <div className="text-sm mt-0.5">{apiProduct?.productDocumentTypes?.length ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Payment method</div>
            <div className="text-sm mt-0.5 max-w-xs truncate" title={paymentLabel()}>{paymentLabel()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Default template</div>
            <div className="text-sm mt-0.5 max-w-xs truncate" title={templateLabel(product.defaultPrintableTemplateDocumentId ?? "")}>
              {templateLabel(product.defaultPrintableTemplateDocumentId ?? "")}
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="coverages">Coverages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Product details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fields from GET/PUT product, plus payment methods.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => void saveFields()}
                disabled={!fieldsDirty || saving}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Product family</Label>
                <Input value={productGroupName} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-coverage">Coverage text</Label>
                <Textarea
                  id="p-coverage"
                  rows={4}
                  value={fields.coverageText}
                  onChange={(e) => setFields({ ...fields, coverageText: e.target.value })}
                  placeholder="Printable coverage text for this product"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Default printable template</Label>
                <Select
                  value={fields.defaultPrintableTemplateDocumentId || "none"}
                  onValueChange={(v) =>
                    setFields({ ...fields, defaultPrintableTemplateDocumentId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {templateDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id ?? ""}>
                        {doc.originalFileName ?? doc.storedFileName ?? doc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Label>Policy plan type</Label>
                  {product.scheduleBasis && (
                    <Badge variant="outline" title={SCHEDULE_BASIS_DESCRIPTIONS[product.scheduleBasis]}>
                      {SCHEDULE_BASIS_LABELS[product.scheduleBasis]}
                    </Badge>
                  )}
                </div>
                <Select
                  value={fields.policyPlanType || "none"}
                  onValueChange={(v) =>
                    setFields({
                      ...fields,
                      policyPlanType: v === "none" ? "" : (v as ProductsPolicyPlanType),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy plan type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {policyPlanTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex flex-col text-left">
                          <span>{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-muted-foreground">
                              {opt.value} — {opt.description}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {product.scheduleBasis && (
                  <p className="text-xs text-muted-foreground">
                    {SCHEDULE_BASIS_DESCRIPTIONS[product.scheduleBasis]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Issuance mode</Label>
                <Select
                  value={fields.issuanceMode || "none"}
                  onValueChange={(v) =>
                    setFields({
                      ...fields,
                      issuanceMode: v === "none" ? "" : (v as ProductsIssuanceMode),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issuance mode…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ISSUANCE_MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calculation method</Label>
                <Select
                  value={fields.calculationMethod || "none"}
                  onValueChange={(v) =>
                    setFields({
                      ...fields,
                      calculationMethod: v === "none" ? "" : (v as ProductsCalculationMethod),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calculation method…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CALCULATION_METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-max-covered-years">Max covered years</Label>
                <Input
                  id="p-max-covered-years"
                  type="number"
                  min={0}
                  step={1}
                  className="font-mono"
                  value={fields.maxCoveredYears}
                  onChange={(e) => setFields({ ...fields, maxCoveredYears: e.target.value })}
                  placeholder="e.g. 30"
                />
              </div>
              {incompleteFixedSumInsured.length > 0 && (
                <div className="md:col-span-2">
                  <Alert className="border-amber-400/70 bg-amber-50 text-amber-950 [&>svg]:text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Missing fixed sum insured amounts</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        Coverages with sum insured fixed require a{" "}
                        <span className="font-medium">fixedSumInsuredAmount</span> currency limit for every
                        supported currency.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 mb-3 text-xs">
                        {incompleteFixedSumInsured.map((c) => (
                          <li key={String(c.entryId)}>
                            <span className="font-medium">{c.name}</span>
                            {" — missing: "}
                            {c.missing.join(", ")}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="text-sm font-medium text-amber-800 underline underline-offset-2 hover:text-amber-950"
                        onClick={() => setActiveTab("coverages")}
                      >
                        Go to Coverages tab to fill the limits
                      </button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Payment method</Label>
                <BankAccountCombobox
                  multiple
                  accounts={bankAccounts}
                  value={fields.bankAccountIds}
                  onValueChange={(bankAccountIds) => setFields({ ...fields, bankAccountIds })}
                  placeholder="Select bank accounts…"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("currencies")}
                  className="text-xs text-accent hover:underline mt-1.5"
                >
                  View currency bank configurations →
                </button>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {getCurrencies().map((c) => {
                    const on = fields.currencies.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCurrency(c)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                          on
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background text-muted-foreground border-border hover:border-accent/50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="coverages">
          <CoveragesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="currencies">
          <CurrenciesTab productId={product.id} currencies={product.currencies} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default ProductDetail;
