import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { useListProductGroups } from "@/api/product-groups";
import {
  useCreateProduct,
  addProductCoverage,
  addProductDocumentType,
  addProductPaymentMethod,
} from "@/api/products";
import type { ProductsPolicyPlanType } from "@/api/types";
import { useListCoverages } from "@/api/coverages";
import { useListRatingTables } from "@/api/rating-tables";
import { useListDocumentTypes } from "@/api/document-types";
import { useListDocuments } from "@/api/documents";
import { useListBankAccounts } from "@/api/bank-accounts";
import { usePolicyPlanTypeOptions } from "@/hooks/usePolicyPlanTypeOptions";
import { BankAccountCombobox } from "@/components/BankAccountCombobox";
import CreateCoverageModal from "@/pages/products/CreateCoverageModal";
import CreateDocumentTypeModal from "@/pages/products/CreateDocumentTypeModal";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getCurrencies } from "@/config/currencies";

const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-5">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
  </div>
);

type DraftCoverage = {
  coverageId: string;
  name: string;
  description: string;
  ratingTableId: string;
  ratingTableMultiplier: string;
  isMandatory: boolean;
  isSumInsuredFixed: boolean;
  sumInsuredPercentage: string;
};
const blankCoverage = (overrides?: Partial<DraftCoverage>): DraftCoverage => ({
  coverageId: "",
  name: "",
  description: "",
  ratingTableId: "",
  ratingTableMultiplier: "1",
  isMandatory: true,
  isSumInsuredFixed: true,
  sumInsuredPercentage: "1",
  ...overrides,
});

type DraftDocRequirement = {
  documentTypeId: string;
  name: string;
  description: string;
  alwaysRequired: boolean;
  insuredAmountOver: string;
  totalExposureOver: string;
  ageOver: string;
  isPep: boolean;
};
const blankDocRequirement = (overrides?: Partial<DraftDocRequirement>): DraftDocRequirement => ({
  documentTypeId: "",
  name: "",
  description: "",
  alwaysRequired: true,
  insuredAmountOver: "1",
  totalExposureOver: "1",
  ageOver: "0",
  isPep: true,
  ...overrides,
});

const CreateProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetGroupId = searchParams.get("groupId") ?? "";

  const { data: groupsPage } = useListProductGroups({ pageNumber: 1, pageSize: 100 });
  const { data: coveragesPage, isLoading: coveragesLoading } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: ratingTablesPage } = useListRatingTables({ pageNumber: 1, pageSize: 200 });
  const { data: documentTypesPage, isLoading: documentTypesLoading } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const { data: documentsPage } = useListDocuments({ pageNumber: 1, pageSize: 200 });
  const { data: bankAccountsPage } = useListBankAccounts({ pageNumber: 1, pageSize: 200 });
  const policyPlanTypeOptions = usePolicyPlanTypeOptions();
  const createProduct = useCreateProduct();

  const apiGroups = groupsPage?.items ?? [];
  const coverageCatalog = coveragesPage?.items ?? [];
  const ratingTables = ratingTablesPage?.items ?? [];
  const documentTypeCatalog = documentTypesPage?.items ?? [];
  const templateDocuments = documentsPage?.items ?? [];
  const bankAccounts = bankAccountsPage?.items ?? [];
  const [saving, setSaving] = useState(false);

  // Create product body
  const [name, setName] = useState("");
  const [productGroup, setProductGroup] = useState<string>(presetGroupId);
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [coverageText, setCoverageText] = useState("");
  const [defaultPrintableTemplateDocumentId, setDefaultPrintableTemplateDocumentId] = useState("");
  const [policyPlanType, setPolicyPlanType] = useState<ProductsPolicyPlanType | "">("");
  const [maxCoveredYears, setMaxCoveredYears] = useState("");
  // Payment methods — POST /api/products/{id}/payment-methods (one per account)
  const [bankAccountIds, setBankAccountIds] = useState<string[]>([]);
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [documentTypeModalOpen, setDocumentTypeModalOpen] = useState(false);

  useEffect(() => {
    if (presetGroupId) setProductGroup(presetGroupId);
  }, [presetGroupId]);

  useEffect(() => {
    if (!productGroup && apiGroups[0]?.id) setProductGroup(apiGroups[0].id);
  }, [apiGroups, productGroup]);

  // Coverages — POST /api/products/{id}/coverages
  const [coverages, setCoverages] = useState<DraftCoverage[]>([]);
  const setCovField = (idx: number, patch: Partial<DraftCoverage>) =>
    setCoverages((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const selectedExistingIds = new Set(coverages.map((c) => c.coverageId).filter(Boolean));

  const toggleCatalogCoverage = (cov: (typeof coverageCatalog)[number], checked: boolean) => {
    const id = cov.id ?? "";
    if (!id) return;
    if (checked) {
      setCoverages((cs) => {
        if (cs.some((c) => c.coverageId === id)) return cs;
        return [
          ...cs,
          blankCoverage({
            coverageId: id,
            name: cov.name?.trim() || "",
            description: cov.description ?? "",
          }),
        ];
      });
    } else {
      setCoverages((cs) => cs.filter((c) => c.coverageId !== id));
    }
  };

  // Document types — POST /api/products/{id}/document-types
  const [docRequirements, setDocRequirements] = useState<DraftDocRequirement[]>([]);
  const setDocReqField = (idx: number, patch: Partial<DraftDocRequirement>) =>
    setDocRequirements((ds) => ds.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  const selectedDocTypeIds = new Set(docRequirements.map((d) => d.documentTypeId).filter(Boolean));

  const toggleDocumentType = (docType: (typeof documentTypeCatalog)[number], checked: boolean) => {
    const id = docType.id ?? "";
    if (!id) return;
    if (checked) {
      setDocRequirements((ds) => {
        if (ds.some((d) => d.documentTypeId === id)) return ds;
        return [
          ...ds,
          blankDocRequirement({
            documentTypeId: id,
            name: docType.name?.trim() || id,
            description: docType.description ?? "",
          }),
        ];
      });
    } else {
      setDocRequirements((ds) => ds.filter((d) => d.documentTypeId !== id));
    }
  };

  const toggleCurrency = (c: string) =>
    setCurrencies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    if (!productGroup) { toast.error("Product family is required"); return; }
    if (currencies.length === 0) { toast.error("Select at least one currency"); return; }

    for (const c of coverages) {
      if (!c.ratingTableId) {
        toast.error(`Coverage "${c.name || c.coverageId}" needs a rating table`);
        return;
      }
    }

    setSaving(true);
    try {
      const created = await createProduct.mutateAsync({
        name: name.trim(),
        productGroupId: productGroup,
        supportedCurrencies: currencies,
        coverageText: coverageText.trim() || undefined,
        defaultPrintableTemplateDocumentId: defaultPrintableTemplateDocumentId || null,
        policyPlanType: policyPlanType || null,
        maxCoveredYears: maxCoveredYears === "" ? null : Number(maxCoveredYears),
      });
      if (!created.id) throw new Error("Product created without id");

      for (const c of coverages) {
        await addProductCoverage(created.id, {
          coverageId: c.coverageId,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: parseFloat(c.ratingTableMultiplier) || 1,
          isMandatory: c.isMandatory,
          isSumInsuredFixed: c.isSumInsuredFixed,
          ...(c.isSumInsuredFixed
            ? {}
            : { sumInsuredPercentage: parseFloat(c.sumInsuredPercentage) || 1 }),
        });
      }

      for (const d of docRequirements) {
        await addProductDocumentType(created.id, {
          documentTypeId: d.documentTypeId,
          alwaysRequired: d.alwaysRequired,
          insuredAmountOver: d.insuredAmountOver === "" ? null : Number(d.insuredAmountOver),
          totalExposureOver: d.totalExposureOver === "" ? null : Number(d.totalExposureOver),
          ageOver: d.ageOver === "" ? 0 : Number(d.ageOver),
          isPep: d.isPep,
        });
      }

      for (const bankAccountId of bankAccountIds) {
        await addProductPaymentMethod(created.id, { bankAccountId });
      }

      toast.success(`Product ${created.name ?? name} created`);
      navigate(`/products/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Create" }]}
        title="Create Product"
        description="Define a new life-insurance product."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/products">Cancel</Link></Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || createProduct.isPending}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {saving || createProduct.isPending ? "Saving…" : "Save Product"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Basic information" desc="Fields sent on POST /api/products." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ISP A_Mortgage Standard 07" />
              </div>
              <div className="space-y-1.5">
                <Label>Product family *</Label>
                <Select value={productGroup} onValueChange={setProductGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {apiGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id ?? ""}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{g.code?.trim() || "—"}</span>
                        {g.english?.trim() || g.name || "—"}
                        {g.label?.trim() && g.label !== g.name ? ` — ${g.label}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Coverage text</Label>
                <Textarea
                  rows={3}
                  value={coverageText}
                  onChange={(e) => setCoverageText(e.target.value)}
                  placeholder="Printable coverage description"
                />
              </div>
              <div className="space-y-1.5  ">
                <Label>Default printable template</Label>
                <Select
                  value={defaultPrintableTemplateDocumentId || "none"}
                  onValueChange={(v) => setDefaultPrintableTemplateDocumentId(v === "none" ? "" : v)}
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
              <div className="space-y-1.5  ">
                <Label>Policy plan type</Label>
                <Select
                  value={policyPlanType || "none"}
                  onValueChange={(v) =>
                    setPolicyPlanType(v === "none" ? "" : (v as ProductsPolicyPlanType))
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-covered-years">Max covered years</Label>
                <Input
                  id="max-covered-years"
                  type="number"
                  min={0}
                  step={1}
                  className="font-mono"
                  value={maxCoveredYears}
                  onChange={(e) => setMaxCoveredYears(e.target.value)}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-1.5  ">
                <Label>Payment method</Label>
                <BankAccountCombobox
                  multiple
                  accounts={bankAccounts}
                  value={bankAccountIds}
                  onValueChange={setBankAccountIds}
                  placeholder="Select bank accounts…"
                />
              </div>
            </div>
          </Card>

          {/* Coverages — linked after product create via /products/{id}/coverages */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-start justify-between mb-4 gap-3">
              <SectionTitle
                title="Coverages"
                desc="Select from the catalog. Create a new coverage to add it to the catalog immediately."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverageModalOpen(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Create new
              </Button>
            </div>

            <div className="space-y-4">
              <div className="rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">All coverages</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedExistingIds.size} selected
                  </Badge>
                </div>
                <div className="max-h-64 overflow-y-auto overscroll-contain divide-y divide-border">
                  {coveragesLoading && (
                    <p className="text-xs text-muted-foreground p-3">Loading coverages…</p>
                  )}
                  {!coveragesLoading && coverageCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">
                      No coverages in the catalog yet. Use Create new to add one.
                    </p>
                  )}
                  {coverageCatalog.map((cov) => {
                    const id = cov.id ?? "";
                    const selected = selectedExistingIds.has(id);
                    const draftIdx = coverages.findIndex((c) => c.coverageId === id);
                    const draft = draftIdx >= 0 ? coverages[draftIdx] : null;
                    return (
                      <div key={id || cov.name} className="p-3 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-0.5"
                            checked={selected}
                            onCheckedChange={(v) => toggleCatalogCoverage(cov, !!v)}
                            disabled={!id}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{cov.name ?? id}</div>
                            {cov.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cov.description}</p>
                            )}
                          </div>
                        </label>
                        {selected && draft && draftIdx >= 0 && (
                          <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label>Rating table *</Label>
                              <Select
                                value={draft.ratingTableId || undefined}
                                onValueChange={(v) => setCovField(draftIdx, { ratingTableId: v })}
                              >
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                  {ratingTables.map((t) => (
                                    <SelectItem key={t.id} value={t.id ?? ""}>{t.name ?? t.id}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Multiplier</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="font-mono"
                                value={draft.ratingTableMultiplier}
                                onChange={(e) => setCovField(draftIdx, { ratingTableMultiplier: e.target.value })}
                              />
                            </div>
                            <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer self-end">
                              <Checkbox
                                checked={draft.isMandatory}
                                onCheckedChange={(v) => setCovField(draftIdx, { isMandatory: !!v })}
                              />
                              <span className="text-sm">Mandatory</span>
                            </label>
                            <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer">
                              <Checkbox
                                checked={draft.isSumInsuredFixed}
                                onCheckedChange={(v) => setCovField(draftIdx, { isSumInsuredFixed: !!v })}
                              />
                              <span className="text-sm">Sum insured fixed</span>
                            </label>
                            {!draft.isSumInsuredFixed && (
                              <div className="space-y-1.5">
                                <Label>Sum insured %</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="font-mono"
                                  value={draft.sumInsuredPercentage}
                                  onChange={(e) => setCovField(draftIdx, { sumInsuredPercentage: e.target.value })}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Required documents — linked after product create via /products/{id}/document-types */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-start justify-between mb-4 gap-3">
              <SectionTitle
                title="Required documents"
                desc="Select document types from the catalog. Create a new type to add it to the catalog immediately."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDocumentTypeModalOpen(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Create new
              </Button>
            </div>

            <div className="space-y-4">
              <div className="rounded-md border border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">All document types</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedDocTypeIds.size} selected
                  </Badge>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {documentTypesLoading && (
                    <p className="text-xs text-muted-foreground p-3">Loading document types…</p>
                  )}
                  {!documentTypesLoading && documentTypeCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">
                      No document types in the catalog yet. Use Create new to add one.
                    </p>
                  )}
                  {documentTypeCatalog.map((docType) => {
                    const id = docType.id ?? "";
                    const selected = selectedDocTypeIds.has(id);
                    const draftIdx = docRequirements.findIndex((d) => d.documentTypeId === id);
                    const draft = draftIdx >= 0 ? docRequirements[draftIdx] : null;
                    return (
                      <div key={id || docType.name} className="p-3 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-0.5"
                            checked={selected}
                            onCheckedChange={(v) => toggleDocumentType(docType, !!v)}
                            disabled={!id}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{docType.name ?? id}</div>
                            {docType.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{docType.description}</p>
                            )}
                          </div>
                        </label>
                        {selected && draft && draftIdx >= 0 && (
                          <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label>Insured amount over</Label>
                              <Input
                                type="number"
                                className="font-mono"
                                value={draft.insuredAmountOver}
                                onChange={(e) => setDocReqField(draftIdx, { insuredAmountOver: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Total exposure over</Label>
                              <Input
                                type="number"
                                className="font-mono"
                                value={draft.totalExposureOver}
                                onChange={(e) => setDocReqField(draftIdx, { totalExposureOver: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Age over</Label>
                              <Input
                                type="number"
                                className="font-mono"
                                value={draft.ageOver}
                                onChange={(e) => setDocReqField(draftIdx, { ageOver: e.target.value })}
                              />
                            </div>
                            <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer">
                              <Checkbox
                                checked={draft.alwaysRequired}
                                onCheckedChange={(v) => setDocReqField(draftIdx, { alwaysRequired: !!v })}
                              />
                              <span className="text-sm">Always required</span>
                            </label>
                            <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer">
                              <Checkbox
                                checked={draft.isPep}
                                onCheckedChange={(v) => setDocReqField(draftIdx, { isPep: !!v })}
                              />
                              <span className="text-sm">PEP</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/*
            Temporarily disabled sections (restore later):
            - Product code / status / commissions / description
            - Setup details (legacy packet, bank partner, policy type, …)
            - Payment details (payment behavior model, premium/packet payment types)
            - Loan details
            - Premium table
            - Tariff configuration
            - Internal details (packet fin type)
            - External details (SAP / F5 / actuarial codes)
            - Manual verification flags
          */}
        </div>

        <div className="space-y-6">
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Available currencies" desc="supportedCurrencies on create." />
            <div className="flex flex-wrap gap-2">
              {getCurrencies().map((c) => {
                const active = currencies.includes(c);
                return (
                  <button type="button" key={c} onClick={() => toggleCurrency(c)}
                    className={`px-4 py-2 rounded-md border text-sm font-mono font-medium transition-colors ${
                      active ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
                    }`}>{c}</button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <CreateCoverageModal
        open={coverageModalOpen}
        onOpenChange={setCoverageModalOpen}
        onCreated={(cov) => {
          if (cov.id) toggleCatalogCoverage(cov, true);
        }}
      />
      <CreateDocumentTypeModal
        open={documentTypeModalOpen}
        onOpenChange={setDocumentTypeModalOpen}
        onCreated={(docType) => {
          if (docType.id) toggleDocumentType(docType, true);
        }}
      />
    </AppShell>
  );
};

export default CreateProduct;
