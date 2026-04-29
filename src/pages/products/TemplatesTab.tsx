import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Layers, Shield, ShieldPlus } from "lucide-react";
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
    if (t.premiumOverrideType === "No override") return <Badge variant="outline">Standard pricing</Badge>;
    if (t.premiumOverrideType === "Management approved manual premium")
      return <Badge className="bg-warning/20 text-warning-foreground border-0">Manual</Badge>;
    return <Badge className="bg-accent-soft text-accent-soft-foreground border-0">{t.premiumOverrideType}</Badge>;
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
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
        <Button size="sm" onClick={openNew} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((t) => {
            const includedCount = t.includedCoverageIds.length;
            const ridersCount = t.optionalRiderIds.length;
            const includedNames = coverages
              .filter((c) => t.includedCoverageIds.includes(c.id))
              .map((c) => c.code);
            return (
              <Card key={t.id} className="shadow-card border-border overflow-hidden flex flex-col hover:shadow-elevated transition-shadow">
                <div className="p-5 border-b border-border bg-gradient-to-br from-accent-soft/40 to-transparent">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                        {t.isActive ? (
                          <Badge className="bg-success/15 text-success border-0 text-[10px]">Active</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                        {t.description || "—"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetail(t)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { upsertTemplate({ ...t, isActive: !t.isActive }); refresh(); toast.success(t.isActive ? "Deactivated" : "Activated"); }}
                        >
                          {t.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(t.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Shield className="h-3 w-3" /> Included
                      </div>
                      <div className="text-lg font-semibold mt-0.5">{includedCount}</div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ShieldPlus className="h-3 w-3" /> Riders
                      </div>
                      <div className="text-lg font-semibold mt-0.5">{ridersCount}</div>
                    </div>
                  </div>

                  {includedNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {includedNames.map((c) => (
                        <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Premium</span>
                      {overrideBadge(t)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {overrideSummary(t, t.defaultCurrency)}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Default currency</span>
                      <Badge className="font-mono bg-accent text-accent-foreground border-0 text-[10px]">{t.defaultCurrency}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="font-medium">{(t.commissionOverridePct ?? 0).toFixed(1)} %</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-border bg-muted/20 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(t)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Configure
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
