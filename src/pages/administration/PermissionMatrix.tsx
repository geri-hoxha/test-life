import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  matrixProducts, matrixTemplates, matrixBanks, matrixBankBranches,
  matrixAgencies, matrixAgents,
  listGrantRows, addGrant, removeGrant, updateGrant,
  type GrantRow,
} from "@/data/permissions";
import { Switch } from "@/components/ui/switch";
import {
  Search, Building2, UserCircle2, Download, Plus, Trash2, Filter, X as XIcon, Check, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const ALL = "ALL";

const PermissionMatrix = () => {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  // Filters
  const [fProduct, setFProduct] = useState<string>(ALL);
  const [fTemplate, setFTemplate] = useState<string>(ALL);
  const [fBank, setFBank] = useState<string>(ALL);
  const [fAgent, setFAgent] = useState<string>(ALL);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GrantRow | null>(null);

  const rows = useMemo(() => {
    void version;
    return listGrantRows().filter((r) => {
      if (fProduct !== ALL && r.productId !== fProduct) return false;
      if (fTemplate !== ALL && r.templateId !== fTemplate) return false;
      if (fBank !== ALL && r.bankId !== fBank) return false;
      if (fAgent !== ALL && r.agentId !== fAgent) return false;
      return true;
    });
  }, [version, fProduct, fTemplate, fBank, fAgent]);

  const templatesForFilter = useMemo(
    () => matrixTemplates.filter((t) => fProduct === ALL || t.productId === fProduct),
    [fProduct]
  );

  const clearFilters = () => {
    setFProduct(ALL); setFTemplate(ALL); setFBank(ALL); setFAgent(ALL);
  };

  const activeFilters =
    (fProduct !== ALL ? 1 : 0) + (fTemplate !== ALL ? 1 : 0) +
    (fBank !== ALL ? 1 : 0) + (fAgent !== ALL ? 1 : 0);

  const handleExport = () => {
    const data = rows.map((r) => ({
      Product: r.productName,
      Template: r.templateName,
      Type: r.templateType,
      Bank: r.bankName ?? "",
      "Bank Branch": r.bankBranchName ?? "",
      Agency: r.agencyName ?? "",
      Agent: r.agentName ?? "",
      "Can Sell": r.canSell ? "Yes" : "No",
      "Commission %": r.commissionPct,
      "Granted At": new Date(r.createdAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permissions");
    XLSX.writeFile(wb, `template-permissions.xlsx`);
    toast.success("Permissions exported");
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    removeGrant(toDelete.id);
    toast.success("Permission removed");
    setToDelete(null);
    refresh();
  };

  return (
    <AppShell>
      <PageHeader
        title="Template Permissions"
        description="Grant template access to bank branches or agents."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add permission
            </Button>
          </div>
        }
      />

      {activeFilters > 0 && (
        <div className="mt-6 flex items-center gap-3">
          <Badge variant="secondary" className="text-[10px] h-6 gap-1">
            <Filter className="h-3 w-3" />{activeFilters} active
          </Badge>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <XIcon className="h-3.5 w-3.5 mr-1" /> Clear all
          </Button>
        </div>
      )}


      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Permissions</CardTitle>
            <CardDescription>
              {rows.length} {rows.length === 1 ? "permission" : "permissions"} found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-460px)] border-t border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="p-2 border-b border-border font-semibold min-w-[180px]">
                    <HeaderFilter
                      label="Product Name"
                      value={fProduct}
                      onChange={(v) => { setFProduct(v); setFTemplate(ALL); }}
                      options={matrixProducts.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </th>
                  <th className="p-2 border-b border-border font-semibold min-w-[200px]">
                    <HeaderFilter
                      label="Template Name"
                      value={fTemplate}
                      onChange={setFTemplate}
                      options={templatesForFilter.map((t) => ({ value: t.id, label: t.name }))}
                    />
                  </th>
                  <th className="p-3 border-b border-border font-semibold min-w-[180px]">Bank Branch</th>
                  <th className="p-2 border-b border-border font-semibold min-w-[160px]">
                    <HeaderFilter
                      label="Bank"
                      value={fBank}
                      onChange={setFBank}
                      options={matrixBanks.map((b) => ({ value: b.id, label: b.name }))}
                    />
                  </th>
                  <th className="p-3 border-b border-border font-semibold min-w-[160px]">Agency Branch</th>
                  <th className="p-2 border-b border-border font-semibold min-w-[180px]">
                    <HeaderFilter
                      label="Agent"
                      value={fAgent}
                      onChange={setFAgent}
                      options={matrixAgents.map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </th>
                  <th className="p-3 border-b border-border font-semibold text-center min-w-[110px]">Can Sell</th>
                  <th className="p-3 border-b border-border font-semibold text-center min-w-[120px]">Commission %</th>
                  <th className="p-3 border-b border-border font-semibold w-12" />
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <p className="text-sm font-medium">No permissions match the current filters.</p>
                      <p className="text-xs text-muted-foreground mt-1">Try clearing the filters or add a new permission.</p>
                    </td>
                  </tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 border-b border-border">
                      <span className="font-medium">{r.productName}</span>
                    </td>
                    <td className="p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span>{r.templateName}</span>
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">{r.templateType}</Badge>
                      </div>
                    </td>
                    <td className="p-3 border-b border-border">
                      {r.bankBranchName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          {r.bankBranchName}
                        </span>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="p-3 border-b border-border">
                      {r.bankName ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="p-3 border-b border-border">
                      {r.agencyName ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="p-3 border-b border-border">
                      {r.agentName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserCircle2 className="h-3.5 w-3.5 text-purple-500" />
                          {r.agentName}
                        </span>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="p-3 border-b border-border text-center">
                      <Switch
                        checked={r.canSell}
                        onCheckedChange={(v) => { updateGrant(r.id, { canSell: v }); refresh(); }}
                      />
                    </td>
                    <td className="p-2 border-b border-border text-center">
                      <div className="relative inline-flex items-center w-24">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={r.commissionPct}
                          disabled={!r.canSell}
                          onChange={(e) => {
                            const raw = parseFloat(e.target.value);
                            const next = isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
                            updateGrant(r.id, { commissionPct: next });
                            refresh();
                          }}
                          className="h-8 text-sm pr-7 text-right tabular-nums"
                        />
                        <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">%</span>
                      </div>
                    </td>
                    <td className="p-3 border-b border-border text-right">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddPermissionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => { refresh(); setAddOpen(false); }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove permission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access for{" "}
              <span className="font-medium">{toDelete?.bankBranchName ?? toDelete?.agentName}</span>{" "}
              on template <span className="font-medium">{toDelete?.templateName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default PermissionMatrix;

const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">{label}</Label>
    {children}
  </div>
);

const HeaderFilter = ({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => {
  const active = value !== ALL;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`h-8 text-xs font-normal normal-case tracking-normal bg-background ${active ? "border-accent text-foreground" : "text-muted-foreground"}`}
        >
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const MultiPicker = ({
  label, icon: Icon, accent, tint, items, selected, onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tint: string;
  items: { id: string; name: string; meta?: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const selectedItems = selected
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is { id: string; name: string; meta?: string } => !!x);

  return (
    <div className={`rounded-lg border ${tint} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent}`} />
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-5">{selected.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground hover:text-destructive" onClick={() => onChange([])}>
              Clear
            </Button>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
                <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {items.map((it) => {
                      const isSel = selected.includes(it.id);
                      return (
                        <CommandItem key={it.id} value={`${it.name} ${it.meta ?? ""}`} onSelect={() => toggle(it.id)}>
                          <div className={`mr-2 h-4 w-4 rounded border flex items-center justify-center ${isSel ? "bg-accent border-accent text-accent-foreground" : "border-input"}`}>
                            {isSel && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{it.name}</div>
                            {it.meta && <div className="text-[10px] text-muted-foreground font-mono truncate">{it.meta}</div>}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedItems.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">None selected — showing all.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((it) => (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className="group inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:border-destructive/40"
              title="Click to remove"
            >
              <Icon className={`h-3 w-3 ${accent}`} />
              <span className="font-medium">{it.name}</span>
              <XIcon className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Add dialog ---------------- */

const AddPermissionDialog = ({
  open, onOpenChange, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) => {
  const [productId, setProductId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [subjectType, setSubjectType] = useState<"BANK_BRANCH" | "AGENT">("BANK_BRANCH");
  const [bankId, setBankId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [agencyId, setAgencyId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");

  const templates = matrixTemplates.filter((t) => !productId || t.productId === productId);
  const branches = matrixBankBranches.filter((b) => !bankId || b.bankId === bankId);
  const agents = matrixAgents.filter((a) => !agencyId || a.agencyId === agencyId);

  const reset = () => {
    setProductId(""); setTemplateId(""); setSubjectType("BANK_BRANCH");
    setBankId(""); setBranchId(""); setAgencyId(""); setAgentId("");
  };

  const canSave = !!productId && !!templateId &&
    (subjectType === "BANK_BRANCH" ? !!branchId : !!agentId);

  const save = () => {
    if (!canSave) return;
    addGrant({
      productId,
      templateId,
      subjectType,
      subjectId: subjectType === "BANK_BRANCH" ? branchId : agentId,
      canSell: true,
      commissionPct: subjectType === "AGENT" ? 10 : 5,
    });
    toast.success("Permission added");
    reset();
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add permission</DialogTitle>
          <DialogDescription>Grant access to a template for a bank branch or an agent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Product</Label>
              <Select value={productId} onValueChange={(v) => { setProductId(v); setTemplateId(""); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {matrixProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId} disabled={!productId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Grant to</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubjectType("BANK_BRANCH")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  subjectType === "BANK_BRANCH" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <Building2 className="h-4 w-4 text-blue-500" />
                Bank branch
              </button>
              <button
                type="button"
                onClick={() => setSubjectType("AGENT")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  subjectType === "AGENT" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <UserCircle2 className="h-4 w-4 text-purple-500" />
                Agent
              </button>
            </div>
          </div>

          {subjectType === "BANK_BRANCH" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Bank</Label>
                <Select value={bankId} onValueChange={(v) => { setBankId(v); setBranchId(""); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {matrixBanks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Branch</Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={!bankId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.region})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Agency</Label>
                <Select value={agencyId} onValueChange={(v) => { setAgencyId(v); setAgentId(""); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select agency" /></SelectTrigger>
                  <SelectContent>
                    {matrixAgencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Agent</Label>
                <Select value={agentId} onValueChange={setAgentId} disabled={!agencyId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>Add permission</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
