import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Shield, ShieldPlus, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Coverage, listCoverages, upsertCoverage, deleteCoverage,
} from "@/data/coverages";
import { listVersions } from "@/data/productVersions";
import CoverageDialog from "./CoverageDialog";

type Props = { productId: string };

const fmtMoney = (n: number) =>
  n === 0 ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const premiumDisplay = (c: Coverage) => {
  switch (c.basePremiumType) {
    case "Fixed amount":
      return `€ ${Number(c.basePremiumValue).toFixed(2)}`;
    case "Percentage of insured amount":
      return `${Number(c.basePremiumValue).toFixed(2)} %`;
    case "Rate table by age/gender":
      return `Table${c.basePremiumValue ? ` · ${c.basePremiumValue}` : ""}`;
  }
};

const CoveragesTab = ({ productId }: Props) => {
  const versions = useMemo(() => listVersions(productId), [productId]);
  const defaultVersion =
    versions.find((v) => v.status === "Active")?.id ??
    versions[0]?.id ??
    "";

  const [versionId, setVersionId] = useState<string>(defaultVersion);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const coverages = useMemo(() => {
    void tick;
    return versionId ? listCoverages(productId, versionId) : [];
  }, [productId, versionId, tick]);

  const mandatory = coverages.filter((c) => c.coverageType === "Mandatory");
  const riders = coverages.filter((c) => c.coverageType === "Optional Rider");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coverage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: Coverage) => { setEditing(c); setDialogOpen(true); };

  const handleSave = (c: Coverage) => {
    upsertCoverage(c);
    refresh();
    toast.success(editing ? `Coverage ${c.code} updated` : `Coverage ${c.code} created`);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteCoverage(deleteId);
    setDeleteId(null);
    refresh();
    toast.success("Coverage deleted");
  };

  if (versions.length === 0) {
    return (
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">
          Create a product version first to define coverages.
        </p>
      </Card>
    );
  }

  const renderGroup = (title: string, icon: any, items: Coverage[], emptyHint: string) => {
    const Icon = icon;
    return (
      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-accent-soft text-accent flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{items.length} coverage(s)</p>
            </div>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyHint}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Coverage</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Sum Insured</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Limits (Min / Max)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Base Premium</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Commission</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id} className="hover:bg-accent-soft/40">
                  <TableCell>
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="font-mono text-xs text-accent mt-0.5">{c.code}</div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-md">{c.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.sumInsuredType}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Default: {fmtMoney(c.defaultSumInsured)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtMoney(c.minSumInsured)} <span className="text-border mx-1">/</span> {fmtMoney(c.maxSumInsured)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{premiumDisplay(c)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.basePremiumType}</div>
                  </TableCell>
                  <TableCell className="font-medium">{c.commissionPct.toFixed(1)} %</TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge className="bg-success/15 text-success border-0">Active</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-0">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              upsertCoverage({ ...c, isActive: !c.isActive });
                              refresh();
                              toast.success(c.isActive ? "Coverage deactivated" : "Coverage activated");
                            }}
                          >
                            {c.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(c.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    );
  };

  return (
    <>
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
                  {v.name}
                  <span className="ml-2 text-xs text-muted-foreground">· {v.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!versionId}>
          <Plus className="h-4 w-4" /> Add Coverage
        </Button>
      </div>

      {coverages.length === 0 && (
        <Card className="p-3 mb-4 border-border bg-accent-soft/40 flex items-start gap-2 shadow-none">
          <Info className="h-4 w-4 mt-0.5 text-accent shrink-0" />
          <span className="text-xs text-accent-soft-foreground">
            No coverages yet for this version. Add a mandatory coverage to get started.
          </span>
        </Card>
      )}

      <div className="space-y-6">
        {renderGroup("Mandatory Coverages", Shield, mandatory, "No mandatory coverages defined.")}
        {renderGroup("Optional Riders", ShieldPlus, riders, "No optional riders defined.")}
      </div>

      {dialogOpen && versionId && (
        <CoverageDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          versionId={versionId}
          initial={editing}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this coverage?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the coverage from this product version. Existing offers and policies are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoveragesTab;
