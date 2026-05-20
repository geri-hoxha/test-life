import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Layers } from "lucide-react";
import { toast } from "sonner";
import { listVersions } from "@/data/productVersions";
import { listCoverages } from "@/data/coverages";
import { getProduct } from "@/data/products";
import {
  Template, listTemplates, upsertTemplate, deleteTemplate, overrideSummary,
} from "@/data/templates";
import TemplateDialog from "./TemplateDialog";
import TemplateDetailDialog from "./TemplateDetailDialog";

type Props = { productId: string };

const TemplatesTab = ({ productId }: Props) => {
  const product = getProduct(productId);
  const versions = useMemo(() => listVersions(productId), [productId]);
  const defaultVersion =
    versions.find((v) => v.status === "Active")?.id ?? versions[0]?.id ?? "";

  const [versionId, setVersionId] = useState(defaultVersion);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const templates = useMemo(() => {
    void tick;
    return versionId ? listTemplates(productId, versionId) : [];
  }, [productId, versionId, tick]);

  const coverages = useMemo(
    () => (versionId ? listCoverages(productId, versionId) : []),
    [productId, versionId]
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [detail, setDetail] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (t: Template) => { setEditing(t); setEditorOpen(true); };

  const handleSave = (t: Template) => {
    upsertTemplate(t);
    refresh();
    toast.success(editing ? `Template ${t.name} updated` : `Template ${t.name} created`);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteTemplate(deleteId);
    setDeleteId(null);
    refresh();
    toast.success("Template deleted");
  };

  if (versions.length === 0) {
    return (
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">Create a product version first to define templates.</p>
      </Card>
    );
  }

  const overrideBadge = (t: Template) => {
    if (t.premiumOverrideType === "No override")
      return <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold rounded-full">Standard pricing</span>;
    if (t.premiumOverrideType === "Management approved manual premium")
      return <span className="px-2 py-0.5 bg-warning/15 text-warning-foreground text-[10px] font-semibold rounded-full">Manual</span>;
    if (t.premiumOverrideType === "Fixed discount" || t.premiumOverrideType === "Fixed premium")
      return <span className="px-2 py-0.5 bg-accent-soft text-accent-soft-foreground text-[10px] font-semibold rounded-full">{t.premiumOverrideType}</span>;
    return <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full">{t.premiumOverrideType}</span>;
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="hidden items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Version</span>
          <Select value={versionId} onValueChange={setVersionId}>
            <SelectTrigger className="w-[280px] h-9">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="font-mono text-xs text-accent mr-2">{v.number}</span>
                  {v.name} <span className="ml-2 text-xs text-muted-foreground">· {v.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Card grid */}
      {templates.length === 0 ? (
        <Card className="p-10 text-center shadow-card border-border border-dashed">
          <Layers className="h-8 w-8 text-accent mx-auto mb-2" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Bundle coverages into ready-to-sell packages such as Basic, Standard, Premium.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((t, idx) => {
            const includedCount = t.includedCoverageIds.length;
            const ridersCount = t.optionalRiderIds.length;
            const includedNames = coverages
              .filter((c) => t.includedCoverageIds.includes(c.id))
              .map((c) => c.code);
            const featured = idx === 1; // soft highlight on middle card
            return (
              <Card
                key={t.id}
                className={`bg-card border-border shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden ${
                  featured ? "ring-2 ring-accent/15" : ""
                }`}
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold text-foreground">{t.name}</h3>
                    <div className="flex items-center gap-1">
                      {t.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetail(t)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              upsertTemplate({ ...t, isActive: !t.isActive });
                              refresh();
                              toast.success(t.isActive ? "Deactivated" : "Activated");
                            }}
                          >
                            {t.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(t.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
                    {t.description || "—"}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        Included
                      </span>
                      <span className="text-2xl font-bold text-foreground">{includedCount}</span>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        Riders
                      </span>
                      <span className="text-2xl font-bold text-foreground">{ridersCount}</span>
                    </div>
                  </div>

                  {includedNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-8">
                      {includedNames.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 bg-card border border-border rounded text-[11px] font-medium text-muted-foreground font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Premium
                        </span>
                        {overrideBadge(t)}
                      </div>
                      <p className="text-sm text-foreground/80">{overrideSummary(t, t.defaultCurrency)}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Default currency</span>
                      <span className="font-bold font-mono text-accent">{t.defaultCurrency}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Policy</span>
                        <span className="font-medium text-foreground truncate ml-2">{t.policyType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment</span>
                        <span className="font-medium text-foreground truncate ml-2">{t.paymentType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Renewal</span>
                        <span className="font-medium text-foreground truncate ml-2">{t.renewalType}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 bg-muted/30 px-3 rounded-lg border border-border">
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                          Agent Comm.
                        </span>
                        <span className="text-sm font-semibold text-foreground font-mono">
                          {(t.agentCommission * 100).toFixed(2)} %
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                          Bank Comm.
                        </span>
                        <span className="text-sm font-semibold text-foreground font-mono">
                          {(t.bankCommission * 100).toFixed(2)} %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(t)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Configure
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editorOpen && versionId && product && (
        <TemplateDialog
          key={editing?.id ?? "new"}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          productId={productId}
          versionId={versionId}
          productCurrencies={product.currencies}
          initial={editing}
          onSave={handleSave}
        />
      )}

      <TemplateDetailDialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)} template={detail} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This package will no longer be sellable. Existing offers and policies are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TemplatesTab;
