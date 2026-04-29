import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Settings2, CheckCircle2, Archive, Pencil, Info } from "lucide-react";
import { toast } from "sonner";
import {
  listVersions, ProductVersion, setVersionStatus, upsertVersion, VersionStatus,
} from "@/data/productVersions";
import VersionDialog from "./VersionDialog";

const statusClass: Record<VersionStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Retired: "bg-destructive/10 text-destructive",
};

const fmt = (s?: string) => (s ? format(parseISO(s), "MMM dd, yyyy") : "—");

type Props = { productId: string };

const VersionsTab = ({ productId }: Props) => {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const versions = useMemo(() => {
    void tick;
    return listVersions(productId).slice().sort((a, b) =>
      a.status === b.status ? b.number.localeCompare(a.number) : a.status === "Active" ? -1 : b.status === "Active" ? 1 : 0
    );
  }, [productId, tick]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVersion | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: VersionStatus } | null>(null);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (v: ProductVersion) => { setEditing(v); setDialogOpen(true); };

  const handleSave = (v: ProductVersion) => {
    upsertVersion(v);
    if (v.status === "Active") setVersionStatus(v.id, "Active");
    refresh();
    toast.success(editing ? `Version ${v.number} updated` : `Version ${v.number} created`);
  };

  const confirmAction = () => {
    if (!confirm) return;
    setVersionStatus(confirm.id, confirm.action);
    toast.success(confirm.action === "Active" ? "Version activated" : "Version retired");
    setConfirm(null);
    refresh();
  };

  const activeExists = versions.some((v) => v.status === "Active");

  return (
    <>
      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Versions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track configuration changes over time. Only <span className="text-foreground font-medium">Active</span> versions can be selected when creating offers.
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4" /> New Version
          </Button>
        </div>

        {!activeExists && (
          <div className="flex items-start gap-2 px-5 py-3 bg-warning/10 border-b border-border text-warning-foreground text-xs">
            <Info className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            <span>No active version. Customers cannot purchase this product until a version is activated.</span>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Version</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Effective From</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Effective To</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No versions yet. Click <span className="font-medium text-foreground">New Version</span> to create one.
                </TableCell>
              </TableRow>
            )}
            {versions.map((v) => (
              <TableRow key={v.id} className="hover:bg-accent-soft/40">
                <TableCell>
                  <div className="font-medium text-foreground">{v.name}</div>
                  <div className="font-mono text-xs text-accent mt-0.5">{v.number}</div>
                  {v.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-md">{v.notes}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{fmt(v.effectiveFrom)}</TableCell>
                <TableCell className="text-muted-foreground">{fmt(v.effectiveTo)}</TableCell>
                <TableCell>
                  <Badge className={`font-medium border-0 ${statusClass[v.status]}`}>{v.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEdit(v)}>
                      <Settings2 className="h-3.5 w-3.5 mr-1" /> Configure
                    </Button>
                    {v.status !== "Active" && v.status !== "Retired" && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 px-2 text-xs text-success hover:text-success hover:bg-success/10"
                        onClick={() => setConfirm({ id: v.id, action: "Active" })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activate
                      </Button>
                    )}
                    {v.status === "Active" && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirm({ id: v.id, action: "Retired" })}
                      >
                        <Archive className="h-3.5 w-3.5 mr-1" /> Retire
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {v.status !== "Active" && (
                          <DropdownMenuItem onClick={() => setConfirm({ id: v.id, action: "Active" })}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                          </DropdownMenuItem>
                        )}
                        {v.status !== "Retired" && (
                          <DropdownMenuItem
                            onClick={() => setConfirm({ id: v.id, action: "Retired" })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" /> Retire
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {dialogOpen && (
        <VersionDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          initial={editing}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "Active" ? "Activate this version?" : "Retire this version?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "Active"
                ? "Any currently active version will be automatically retired. New offers will use this version going forward."
                : "Retired versions can no longer be selected for new offers. Existing policies remain unaffected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={confirm?.action === "Retired" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VersionsTab;
