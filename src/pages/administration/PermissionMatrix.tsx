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
import { Label } from "@/components/ui/label";
import {
  matrixProducts, matrixTemplates, matrixBanks, matrixBankBranches,
  matrixAgencies, matrixAgents,
  listGrantRows, addGrant, removeGrant,
  type GrantRow,
} from "@/data/permissions";
import {
  Search, Building2, UserCircle2, Download, Plus, Trash2, Filter, X as XIcon,
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
  const [fBranch, setFBranch] = useState<string>(ALL);
  const [fAgency, setFAgency] = useState<string>(ALL);
  const [fAgent, setFAgent] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GrantRow | null>(null);

  const rows = useMemo(() => {
    void version;
    const q = search.trim().toLowerCase();
    return listGrantRows().filter((r) => {
      if (fProduct !== ALL && r.productId !== fProduct) return false;
      if (fTemplate !== ALL && r.templateId !== fTemplate) return false;
      if (fBank !== ALL && r.bankId !== fBank) return false;
      if (fBranch !== ALL && r.bankBranchId !== fBranch) return false;
      if (fAgency !== ALL && r.agencyId !== fAgency) return false;
      if (fAgent !== ALL && r.agentId !== fAgent) return false;
      if (q) {
        const hay = [
          r.productName, r.templateName, r.bankName, r.bankBranchName, r.agencyName, r.agentName,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [version, fProduct, fTemplate, fBank, fBranch, fAgency, fAgent, search]);

  const templatesForFilter = useMemo(
    () => matrixTemplates.filter((t) => fProduct === ALL || t.productId === fProduct),
    [fProduct]
  );
  const branchesForFilter = useMemo(
    () => matrixBankBranches.filter((b) => fBank === ALL || b.bankId === fBank),
    [fBank]
  );
  const agentsForFilter = useMemo(
    () => matrixAgents.filter((a) => fAgency === ALL || a.agencyId === fAgency),
    [fAgency]
  );

  const clearFilters = () => {
    setFProduct(ALL); setFTemplate(ALL); setFBank(ALL); setFBranch(ALL);
    setFAgency(ALL); setFAgent(ALL); setSearch("");
  };

  const activeFilters =
    (fProduct !== ALL ? 1 : 0) + (fTemplate !== ALL ? 1 : 0) + (fBank !== ALL ? 1 : 0) +
    (fBranch !== ALL ? 1 : 0) + (fAgency !== ALL ? 1 : 0) + (fAgent !== ALL ? 1 : 0) +
    (search ? 1 : 0);

  const handleExport = () => {
    const data = rows.map((r) => ({
      Product: r.productName,
      Template: r.templateName,
      Type: r.templateType,
      Bank: r.bankName ?? "",
      "Bank Branch": r.bankBranchName ?? "",
      Agency: r.agencyName ?? "",
      Agent: r.agentName ?? "",
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

      {/* Filters */}
      <Card className="mt-6">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Filters</CardTitle>
            {activeFilters > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">{activeFilters} active</Badge>
            )}
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
              <XIcon className="h-3.5 w-3.5 mr-1" /> Clear all
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all columns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FilterField label="Product">
              <Select value={fProduct} onValueChange={(v) => { setFProduct(v); setFTemplate(ALL); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All products</SelectItem>
                  {matrixProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Template">
              <Select value={fTemplate} onValueChange={setFTemplate}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All templates</SelectItem>
                  {templatesForFilter.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Bank">
              <Select value={fBank} onValueChange={(v) => { setFBank(v); setFBranch(ALL); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All banks</SelectItem>
                  {matrixBanks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Bank branch">
              <Select value={fBranch} onValueChange={setFBranch}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All branches</SelectItem>
                  {branchesForFilter.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.region})</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Agency">
              <Select value={fAgency} onValueChange={(v) => { setFAgency(v); setFAgent(ALL); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All agencies</SelectItem>
                  {matrixAgencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Agent">
              <Select value={fAgent} onValueChange={setFAgent}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All agents</SelectItem>
                  {agentsForFilter.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
        </CardContent>
      </Card>

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
          <div className="overflow-auto max-h-[calc(100vh-420px)] border-t border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 border-b border-border font-semibold">Product Name</th>
                  <th className="p-3 border-b border-border font-semibold">Template Name</th>
                  <th className="p-3 border-b border-border font-semibold">Bank Branch</th>
                  <th className="p-3 border-b border-border font-semibold">Bank</th>
                  <th className="p-3 border-b border-border font-semibold">Agency Branch</th>
                  <th className="p-3 border-b border-border font-semibold">Agent</th>
                  <th className="p-3 border-b border-border font-semibold w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
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
