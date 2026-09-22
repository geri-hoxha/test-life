import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { OverlayLoader, PageLoader } from "@/components/Loader";
import PageHeader from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  useAddProductBankAccount,
  useRemoveProductBankAccount,
} from "@/api/products";
import type { ProductsActuarialCode, ProductsPolicyPlanType } from "@/api/types";
import { useListProductGroups } from "@/api/product-groups";
import { useListBankAccounts } from "@/api/bank-accounts";
import { usePolicyPlanTypeOptions } from "@/hooks/usePolicyPlanTypeOptions";
import { useActuarialCodeOptions } from "@/hooks/useActuarialCodeOptions";
import { BankAccountCombobox } from "@/components/BankAccountCombobox";
import { DocumentCombobox } from "@/components/DocumentCombobox";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CoveragesTab from "./CoveragesTab";
import DocumentsTab from "./DocumentsTab";
import CurrenciesTab from "./CurrenciesTab";
import { getCurrencies } from "@/config/currencies";
import { useListCoverages } from "@/api/coverages";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type EditableFields = {
  name: string;
  coverageText: string;
  currencies: string[];
  defaultPrintableTemplateDocumentId: string;
  defaultTermsTemplateDocumentId: string;
  policyPlanType: ProductsPolicyPlanType | "";
  maximumCoverageTermMonths: string;
  actuarialCode: ProductsActuarialCode | "";
  sapProductCode: string;
  sapChannelCode: string;
  f5ProductCode: string;
  bankAccountIds: string[];
};

const ProductDetail = () => {
  const { id } = useParams();
  const { data: apiProduct, isLoading, isError } = useGetProduct(id ?? "", { enabled: Boolean(id) });
  const updateProductMutation = useUpdateProduct();
  const addProductBankAccount = useAddProductBankAccount();
  const removeProductBankAccount = useRemoveProductBankAccount();
  const { data: groupsPage } = useListProductGroups({ pageNumber: 1, pageSize: 200 });
  const { data: bankAccountsPage } = useListBankAccounts({ pageNumber: 1, pageSize: 200 });
  const policyPlanTypeOptions = usePolicyPlanTypeOptions();
  const actuarialCodeOptions = useActuarialCodeOptions();
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

  const bankAccounts = bankAccountsPage?.items ?? [];
  const productBankAccounts = apiProduct?.bankAccounts ?? [];

  const currentBankAccountIds = useMemo(
    () =>
      productBankAccounts
        .map((entry) => entry.bankAccountId)
        .filter((id): id is string => Boolean(id)),
    [productBankAccounts]
  );
  const currentBankAccountIdsKey = useMemo(
    () => [...currentBankAccountIds].sort().join("|"),
    [currentBankAccountIds]
  );

  const productGroupName = useMemo(() => {
    const gid = product?.productGroupId;
    if (!gid) return "—";
    const match = (groupsPage?.items ?? []).find((g) => g.id === gid);
    if (!match) return gid;
    return [match.legacyCode?.trim(), match.name].filter(Boolean).join("  ") || gid;
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
      defaultTermsTemplateDocumentId: product.defaultTermsTemplateDocumentId ?? "",
      policyPlanType: product.policyPlanType ?? "",
      maximumCoverageTermMonths:
        product.maximumCoverageTermMonths != null && product.maximumCoverageTermMonths !== undefined
          ? String(product.maximumCoverageTermMonths)
          : "",
      actuarialCode: product.actuarialCode ?? "",
      sapProductCode: product.sapProductCode ?? "",
      sapChannelCode: product.sapChannelCode ?? "",
      f5ProductCode: product.f5ProductCode ?? "",
      bankAccountIds: [...currentBankAccountIds],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when product or linked bank account ids change by value
  }, [product, currentBankAccountIdsKey]);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader label="Loading product…" />
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
    fields.defaultTermsTemplateDocumentId !== (product.defaultTermsTemplateDocumentId ?? "") ||
    fields.policyPlanType !== (product.policyPlanType ?? "") ||
    fields.maximumCoverageTermMonths !==
      (product.maximumCoverageTermMonths != null && product.maximumCoverageTermMonths !== undefined
        ? String(product.maximumCoverageTermMonths)
        : "") ||
    fields.actuarialCode !== (product.actuarialCode ?? "") ||
    fields.sapProductCode !== (product.sapProductCode ?? "") ||
    fields.sapChannelCode !== (product.sapChannelCode ?? "") ||
    fields.f5ProductCode !== (product.f5ProductCode ?? "") ||
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
    if (!fields.policyPlanType) {
      toast.error("Policy plan type is required");
      return;
    }
    if (fields.currencies.length === 0) {
      toast.error("Select at least one currency");
      return;
    }

    const termMonths = fields.maximumCoverageTermMonths.trim() === ""
      ? null
      : Number(fields.maximumCoverageTermMonths);
    if (termMonths != null && (!Number.isInteger(termMonths) || termMonths < 0)) {
      toast.error("Maximum coverage term must be a whole number of months");
      return;
    }

    setSaving(true);
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        body: {
          name: fields.name.trim(),
          policyPlanType: fields.policyPlanType,
          supportedCurrencies: fields.currencies,
          coverageText: fields.coverageText.trim() || undefined,
          defaultPrintableTemplateDocumentId: fields.defaultPrintableTemplateDocumentId || null,
          defaultTermsTemplateDocumentId: fields.defaultTermsTemplateDocumentId || null,
          maximumCoverageTermMonths: termMonths,
          actuarialCode: fields.actuarialCode || null,
          sapProductCode: fields.sapProductCode.trim() || null,
          sapChannelCode: fields.sapChannelCode.trim() || null,
          f5ProductCode: fields.f5ProductCode.trim() || null,
        },
      });

      if (paymentDirty) {
        const currentSet = new Set(currentBankAccountIds);
        const nextSet = new Set(fields.bankAccountIds);
        const toAdd = fields.bankAccountIds.filter((id) => !currentSet.has(id));
        const toRemove = productBankAccounts.filter(
          (entry) => entry.bankAccountId && !nextSet.has(entry.bankAccountId) && entry.id != null
        );

        for (const entry of toRemove) {
          await removeProductBankAccount.mutateAsync({
            productId: product.id,
            productBankAccountId: entry.id!,
          });
        }
        for (const bankAccountId of toAdd) {
          await addProductBankAccount.mutateAsync({
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

  const selectedPlan = policyPlanTypeOptions.find((o) => o.value === fields.policyPlanType);

  return (
    <AppShell>
      {saving && (
        <OverlayLoader
          label="Saving product…"
          description="Updating details and linked bank accounts."
        />
      )}

      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.name}
        description={product.coverageText?.trim() || undefined}
        actions={
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => void saveFields()}
            disabled={!fieldsDirty || saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="coverages">Coverages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {incompleteFixedSumInsured.length > 0 && (
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
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Identity</CardTitle>
                  <CardDescription>
                    How this product is named and printed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-name">Product name *</Label>
                    <Input
                      id="p-name"
                      maxLength={512}
                      value={fields.name}
                      onChange={(e) => setFields({ ...fields, name: e.target.value })}
                      placeholder="e.g. ISP A_Mortgage Standard 07"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product family</Label>
                    <Input value={productGroupName} readOnly className="bg-muted/40" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="p-coverage">Coverage text</Label>
                    <Textarea
                      id="p-coverage"
                      rows={3}
                      maxLength={4000}
                      value={fields.coverageText}
                      onChange={(e) => setFields({ ...fields, coverageText: e.target.value })}
                      placeholder="Printable coverage description shown on policies"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default printable template</Label>
                    <DocumentCombobox
                      value={fields.defaultPrintableTemplateDocumentId}
                      onValueChange={(id) =>
                        setFields({ ...fields, defaultPrintableTemplateDocumentId: id })
                      }
                      placeholder="Select document…"
                      allowClear
                      clearLabel="None"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default terms template</Label>
                    <DocumentCombobox
                      value={fields.defaultTermsTemplateDocumentId}
                      onValueChange={(id) =>
                        setFields({ ...fields, defaultTermsTemplateDocumentId: id })
                      }
                      placeholder="Select document…"
                      allowClear
                      clearLabel="None"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Plan</CardTitle>
                  <CardDescription>
                    How premium is calculated and how long cover can last.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Policy plan type *</Label>
                    <Select
                      value={fields.policyPlanType || undefined}
                      onValueChange={(v) =>
                        setFields({
                          ...fields,
                          policyPlanType: v as ProductsPolicyPlanType,
                        })
                      }
                    >
                      <SelectTrigger>
                        {selectedPlan ? (
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{selectedPlan.label}</span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                              {selectedPlan.value}
                            </span>
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
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {opt.value}
                                </span>
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
                      <p className="text-xs text-muted-foreground">
                        {selectedPlan.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-max-coverage-term">
                      Maximum coverage term (months)
                    </Label>
                    <Input
                      id="p-max-coverage-term"
                      type="number"
                      min={0}
                      step={1}
                      className="font-mono"
                      value={fields.maximumCoverageTermMonths}
                      onChange={(e) =>
                        setFields({ ...fields, maximumCoverageTermMonths: e.target.value })
                      }
                      placeholder="e.g. 360"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Currencies *</Label>
                    <div className="flex flex-wrap gap-2">
                      {getCurrencies().map((c) => {
                        const active = fields.currencies.includes(c);
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
            </div>

            <aside className="space-y-4 xl:self-start">
              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Payment method</CardTitle>
                  <CardDescription>
                    Bank accounts used to collect premium for this product.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                    className="text-xs text-accent hover:underline mt-3"
                  >
                    View currency bank configurations →
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">External codes</CardTitle>
                  <CardDescription>
                    Optional actuarial, SAP, and F5 identifiers used by downstream
                    systems.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label>Actuarial code</Label>
                    <Select
                      value={fields.actuarialCode || "none"}
                      onValueChange={(v) =>
                        setFields({
                          ...fields,
                          actuarialCode: v === "none" ? "" : (v as ProductsActuarialCode),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select actuarial code…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {!actuarialCodeOptions.some((o) => o.value === fields.actuarialCode) &&
                          fields.actuarialCode && (
                            <SelectItem value={fields.actuarialCode}>{fields.actuarialCode}</SelectItem>
                          )}
                        {actuarialCodeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.text === opt.value ? opt.value : `${opt.text} (${opt.value})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-f5-code">F5 product code</Label>
                    <Input
                      id="p-f5-code"
                      className="font-mono"
                      value={fields.f5ProductCode}
                      onChange={(e) => setFields({ ...fields, f5ProductCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-sap-product">SAP product code</Label>
                    <Input
                      id="p-sap-product"
                      maxLength={20}
                      className="font-mono"
                      value={fields.sapProductCode}
                      onChange={(e) => setFields({ ...fields, sapProductCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-sap-channel">SAP channel code</Label>
                    <Input
                      id="p-sap-channel"
                      maxLength={20}
                      className="font-mono"
                      value={fields.sapChannelCode}
                      onChange={(e) => setFields({ ...fields, sapChannelCode: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
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
