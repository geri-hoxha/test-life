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
import { useListProductGroups } from "@/api/product-groups";
import { useListDocuments } from "@/api/documents";
import { useListBankAccounts } from "@/api/bank-accounts";
import { BankAccountCombobox } from "@/components/BankAccountCombobox";
import { Save } from "lucide-react";
import { toast } from "sonner";
import CoveragesTab from "./CoveragesTab";
import DocumentsTab from "./DocumentsTab";

const ALL_CURRENCIES = ["EUR", "ALL", "USD", "GBP", "CHF"];

type EditableFields = {
  name: string;
  coverageText: string;
  currencies: string[];
  defaultPrintableTemplateDocumentId: string;
  bankAccountId: string;
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

  const product = useMemo(
    () => (apiProduct ? mapApiProduct(apiProduct) : undefined),
    [apiProduct]
  );

  const templateDocuments = documentsPage?.items ?? [];
  const bankAccounts = bankAccountsPage?.items ?? [];

  const productGroupName = useMemo(() => {
    const gid = product?.productGroupId;
    if (!gid) return "—";
    const match = (groupsPage?.items ?? []).find((g) => g.id === gid);
    return match?.english?.trim() || match?.name?.trim() || gid;
  }, [product?.productGroupId, groupsPage?.items]);

  const currentPayment = apiProduct?.paymentMethods?.[0];
  const currentBankAccountId = currentPayment?.bankAccountId ?? "";

  const [fields, setFields] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);

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
      bankAccountId: currentBankAccountId,
    });
  }, [product, currentBankAccountId]);

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

  const fieldsDirty =
    fields.name !== product.name ||
    fields.coverageText !== (product.coverageText ?? "") ||
    JSON.stringify(fields.currencies) !== JSON.stringify(product.currencies) ||
    fields.defaultPrintableTemplateDocumentId !== (product.defaultPrintableTemplateDocumentId ?? "") ||
    fields.bankAccountId !== currentBankAccountId;

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
        },
      });

      if (fields.bankAccountId !== currentBankAccountId) {
        if (currentPayment?.id != null) {
          await removePaymentMethod.mutateAsync({
            productId: product.id,
            paymentMethodEntryId: String(currentPayment.id),
          });
        }
        if (fields.bankAccountId) {
          await addPaymentMethod.mutateAsync({
            productId: product.id,
            body: { bankAccountId: fields.bankAccountId },
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
    if (!currentBankAccountId) return "—";
    const account = bankAccounts.find((a) => a.id === currentBankAccountId);
    if (!account) {
      return [currentPayment?.currency, currentBankAccountId].filter(Boolean).join(" · ") || "—";
    }
    return [account.bankName, account.currency ?? currentPayment?.currency, account.iban || account.accountNumber]
      .filter(Boolean)
      .join(" · ");
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

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="coverages">Coverages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Product details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fields from GET/PUT product, plus payment method.
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
                <Label>Payment method</Label>
                <BankAccountCombobox
                  accounts={bankAccounts}
                  value={fields.bankAccountId}
                  onValueChange={(bankAccountId) => setFields({ ...fields, bankAccountId })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CURRENCIES.map((c) => {
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
      </Tabs>
    </AppShell>
  );
};

export default ProductDetail;
