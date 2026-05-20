import { useEffect, useMemo, useState } from "react";
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
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  matrixProducts, matrixTemplates, matrixBanks, matrixAgents,
  listPermissions, setAccess, bulkSetForTemplate, clonePermissions,
  templateStats, globalStats, listAudit, recordAudit,
  type Permission, type MatrixTemplate,
} from "@/data/permissions";
import {
  Search, Filter, Building2, UserCircle2, MoreHorizontal,
  Download, Copy, ShieldCheck, ShieldOff, Activity, Layers,
  Check, X as XIcon, Clock, BadgeCheck, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

type SubjectTab = "BANK" | "AGENT" | "BOTH";

const PermissionMatrix = () => {
  const [productId, setProductId] = useState<string>(matrixProducts[0].id);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subjectTab, setSubjectTab] = useState<SubjectTab>("BOTH");
  const [filterRegion, setFilterRegion] = useState<string>("ALL");
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0); // force-rerender after mutation
  const [drawerTplId, setDrawerTplId] = useState<string | null>(null);

  const [pendingBulk, setPendingBulk] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [cloneTarget, setCloneTarget] = useState<MatrixTemplate | null>(null);
  const [cloneFromId, setCloneFromId] = useState<string>("");

  // Loading sim + debounce
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [productId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const templates = useMemo(
    () =>
      matrixTemplates
        .filter((t) => t.productId === productId)
        .filter((t) => !debounced || t.name.toLowerCase().includes(debounced) || t.id.toLowerCase().includes(debounced)),
    [productId, debounced]
  );

  const banks = useMemo(
    () => matrixBanks.filter((b) => filterRegion === "ALL" || b.region === filterRegion),
    [filterRegion]
  );
  const agents = useMemo(
    () => matrixAgents.filter((a) => filterTier === "ALL" || a.tier === filterTier),
    [filterTier]
  );

  // Index permissions for O(1) lookup
  const permIndex = useMemo(() => {
    void version;
    const perms = listPermissions(productId, templates.map((t) => t.id));
    const map = new Map<string, Permission>();
    for (const p of perms) map.set(`${p.templateId}::${p.subjectType}::${p.subjectId}`, p);
    return map;
  }, [productId, templates, version]);

  const stats = useMemo(() => {
    void version;
    return globalStats(productId);
  }, [productId, version]);

  const regions = useMemo(() => Array.from(new Set(matrixBanks.map((b) => b.region))), []);
  const tiers = ["Junior", "Senior", "Lead"];

  const refresh = () => setVersion((v) => v + 1);

  const toggleCell = (templateId: string, subjectType: "BANK" | "AGENT", subjectId: string) => {
    const key = `${templateId}::${subjectType}::${subjectId}`;
    const current = permIndex.get(key);
    const next = !current?.canAccess;
    // Optimistic mutation
    setAccess(templateId, subjectType, subjectId, next);
    recordAudit(templateId, "Permission toggled", `${subjectType} ${subjectId} → ${next ? "ALLOWED" : "DENIED"}`, "Erin Hoxha");
    refresh();
  };

  const askBulk = (title: string, description: string, run: () => void) =>
    setPendingBulk({ title, description, onConfirm: () => { run(); setPendingBulk(null); refresh(); } });

  const handleExport = () => {
    const subjects = [
      ...(subjectTab !== "AGENT" ? banks.map((b) => ({ k: `BANK::${b.id}`, label: `${b.name} (Bank)` })) : []),
      ...(subjectTab !== "BANK" ? agents.map((a) => ({ k: `AGENT::${a.id}`, label: `${a.name} (Agent)` })) : []),
    ];
    const rows = templates.map((t) => {
      const row: Record<string, string> = { Template: t.name, ID: t.id, Type: t.type };
      for (const s of subjects) {
        const [stype, sid] = s.k.split("::") as ["BANK" | "AGENT", string];
        const p = permIndex.get(`${t.id}::${stype}::${sid}`);
        row[s.label] = p?.canAccess ? "Allowed" : "Denied";
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permission Matrix");
    XLSX.writeFile(wb, `permission-matrix-${productId}.xlsx`);
    toast.success("Matrix exported to Excel");
  };

  const drawerTpl = drawerTplId ? matrixTemplates.find((t) => t.id === drawerTplId) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Template Permission Matrix"
        description="Manage which banks and agents can access each product template."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" /> Export to Excel
            </Button>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        <StatCard label="Templates" value={stats.templates} hint={`${stats.openTemplates} with grants`} icon={Layers} />
        <StatCard label="Banks" value={stats.banks} hint="active distributors" icon={Building2} />
        <StatCard label="Agents" value={stats.agents} hint={`across ${new Set(matrixAgents.map(a=>a.tier)).size} tiers`} icon={UserCircle2} />
        <StatCard label="Total grants" value={stats.totalGrants} hint={`of ${stats.totalSlots} slots`} icon={ShieldCheck} accent />
        <StatCard label="Coverage" value={`${(stats.coverage * 100).toFixed(0)}%`} hint="allowed cells" icon={Activity} progress={stats.coverage} />
      </div>

      {/* Filters */}
      <Card className="mt-4">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search template by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="h-9 w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {matrixProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-mono text-xs mr-2 text-muted-foreground">{p.code}</span>{p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectTab} onValueChange={(v) => setSubjectTab(v as SubjectTab)}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BOTH">Banks &amp; Agents</SelectItem>
              <SelectItem value="BANK">Banks only</SelectItem>
              <SelectItem value="AGENT">Agents only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="h-9 w-[140px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All regions</SelectItem>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tiers</SelectItem>
              {tiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Matrix */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Matrix</CardTitle>
            <CardDescription>Click a cell to toggle access. Click a template name to view details.</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <LegendDot className="bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" label="Allowed" />
            <LegendDot className="bg-muted border-border text-muted-foreground" label="Denied" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState />
          ) : (
            <MatrixTable
              templates={templates}
              banks={banks}
              agents={agents}
              subjectTab={subjectTab}
              permIndex={permIndex}
              onToggle={toggleCell}
              onOpenTemplate={(id) => setDrawerTplId(id)}
              askBulk={askBulk}
              onClone={(tpl) => { setCloneTarget(tpl); setCloneFromId(""); }}
            />
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <Sheet open={!!drawerTpl} onOpenChange={(o) => !o && setDrawerTplId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {drawerTpl && <DrawerBody tpl={drawerTpl} version={version} />}
        </SheetContent>
      </Sheet>

      {/* Bulk confirm */}
      <AlertDialog open={!!pendingBulk} onOpenChange={(o) => !o && setPendingBulk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingBulk?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingBulk?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingBulk?.onConfirm()}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone modal */}
      <AlertDialog open={!!cloneTarget} onOpenChange={(o) => !o && setCloneTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clone permissions into "{cloneTarget?.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              All current bank &amp; agent permissions of the source template will be copied. Existing access on this template will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={cloneFromId} onValueChange={setCloneFromId}>
              <SelectTrigger><SelectValue placeholder="Choose source template…" /></SelectTrigger>
              <SelectContent>
                {matrixTemplates
                  .filter((t) => t.id !== cloneTarget?.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-mono text-[10px] text-muted-foreground mr-2">{t.id}</span>{t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cloneFromId}
              onClick={() => {
                if (cloneFromId && cloneTarget) {
                  clonePermissions(cloneFromId, cloneTarget.id);
                  toast.success(`Permissions cloned into ${cloneTarget.name}`);
                  setCloneTarget(null);
                  refresh();
                }
              }}
            >Clone</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default PermissionMatrix;

/* ------------ Sub components ------------ */

const StatCard = ({
  label, value, hint, icon: Icon, accent, progress,
}: {
  label: string; value: string | number; hint?: string; icon: React.ComponentType<{ className?: string }>;
  accent?: boolean; progress?: number;
}) => (
  <Card className={accent ? "border-accent/40" : ""}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      {typeof progress === "number" && (
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </CardContent>
  </Card>
);

const LegendDot = ({ className, label }: { className: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`inline-block h-3 w-3 rounded-sm border ${className}`} />{label}
  </span>
);

const EmptyState = () => (
  <div className="p-12 text-center">
    <Layers className="h-10 w-10 mx-auto text-muted-foreground/60" />
    <p className="mt-3 text-sm font-medium">No templates match the current filters.</p>
    <p className="text-xs text-muted-foreground mt-1">Try clearing the search or changing the product.</p>
  </div>
);

/* ------------ Matrix table ------------ */

const MatrixTable = ({
  templates, banks, agents, subjectTab, permIndex, onToggle, onOpenTemplate, askBulk, onClone,
}: {
  templates: MatrixTemplate[];
  banks: typeof matrixBanks;
  agents: typeof matrixAgents;
  subjectTab: SubjectTab;
  permIndex: Map<string, Permission>;
  onToggle: (templateId: string, st: "BANK" | "AGENT", sid: string) => void;
  onOpenTemplate: (id: string) => void;
  askBulk: (title: string, description: string, run: () => void) => void;
  onClone: (tpl: MatrixTemplate) => void;
}) => {
  const showBanks = subjectTab !== "AGENT";
  const showAgents = subjectTab !== "BANK";

  return (
    <div className="relative w-full overflow-auto max-h-[calc(100vh-380px)] border-t border-border">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur">
          <tr>
            <th className="sticky left-0 z-40 bg-muted/95 backdrop-blur text-left p-3 border-b border-r border-border min-w-[280px] font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
              Template
            </th>
            {showBanks && banks.map((b) => (
              <th key={b.id} className="p-2 border-b border-border min-w-[80px] max-w-[80px] align-bottom">
                <div className="flex flex-col items-center gap-1">
                  <Building2 className="h-3 w-3 text-blue-500" />
                  <span className="font-medium text-foreground writing-vertical text-[10px] whitespace-nowrap rotate-180 [writing-mode:vertical-rl]">{b.name}</span>
                </div>
              </th>
            ))}
            {showBanks && showAgents && (
              <th className="p-2 border-b border-l-2 border-border bg-muted/80 min-w-[12px]" />
            )}
            {showAgents && agents.map((a) => (
              <th key={a.id} className="p-2 border-b border-border min-w-[70px] max-w-[70px] align-bottom">
                <div className="flex flex-col items-center gap-1">
                  <UserCircle2 className="h-3 w-3 text-purple-500" />
                  <span className="font-medium text-foreground text-[10px] whitespace-nowrap rotate-180 [writing-mode:vertical-rl]">{a.name}</span>
                </div>
              </th>
            ))}
            <th className="sticky right-0 z-40 bg-muted/95 backdrop-blur border-b border-l border-border p-2 w-12" />
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => {
            const s = templateStats(t.id);
            return (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 z-20 bg-card hover:bg-muted/30 transition-colors p-3 border-b border-r border-border min-w-[280px]">
                  <button
                    type="button"
                    onClick={() => onOpenTemplate(t.id)}
                    className="text-left group w-full"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm group-hover:text-accent transition-colors truncate">{t.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">{t.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{t.id}</span>
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{s.banksAllowed}/{s.banksTotal} banks</span>
                      <span>·</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">{s.agentsAllowed}/{s.agentsTotal} agents</span>
                    </div>
                  </button>
                </td>
                {showBanks && banks.map((b) => {
                  const p = permIndex.get(`${t.id}::BANK::${b.id}`);
                  return (
                    <Cell key={b.id} allowed={!!p?.canAccess} onClick={() => onToggle(t.id, "BANK", b.id)} />
                  );
                })}
                {showBanks && showAgents && <td className="border-b border-l-2 border-border bg-muted/40" />}
                {showAgents && agents.map((a) => {
                  const p = permIndex.get(`${t.id}::AGENT::${a.id}`);
                  return (
                    <Cell key={a.id} allowed={!!p?.canAccess} onClick={() => onToggle(t.id, "AGENT", a.id)} />
                  );
                })}
                <td className="sticky right-0 z-20 bg-card hover:bg-muted/30 transition-colors border-b border-l border-border p-1 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-[10px]">Bulk actions · {t.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => askBulk("Allow all banks", `Grant all ${matrixBanks.length} banks access to "${t.name}".`, () => { bulkSetForTemplate(t.id, "BANK", true); toast.success("All banks allowed"); })}>
                        <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" />Allow all banks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => askBulk("Deny all banks", `Revoke access from all banks on "${t.name}".`, () => { bulkSetForTemplate(t.id, "BANK", false); toast.success("All banks denied"); })}>
                        <ShieldOff className="h-4 w-4 mr-2 text-muted-foreground" />Deny all banks
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => askBulk("Allow all agents", `Grant all ${matrixAgents.length} agents access to "${t.name}".`, () => { bulkSetForTemplate(t.id, "AGENT", true); toast.success("All agents allowed"); })}>
                        <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" />Allow all agents
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => askBulk("Deny all agents", `Revoke access from all agents on "${t.name}".`, () => { bulkSetForTemplate(t.id, "AGENT", false); toast.success("All agents denied"); })}>
                        <ShieldOff className="h-4 w-4 mr-2 text-muted-foreground" />Deny all agents
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onClone(t)}>
                        <Copy className="h-4 w-4 mr-2" />Clone from another template…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Cell = ({ allowed, onClick }: { allowed: boolean; onClick: () => void }) => (
  <td className="border-b border-border p-0 text-center">
    <button
      type="button"
      onClick={onClick}
      title={allowed ? "Allowed — click to deny" : "Denied — click to allow"}
      className={`w-full h-10 flex items-center justify-center transition-colors ${
        allowed
          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500"
      }`}
    >
      {allowed ? <Check className="h-4 w-4" strokeWidth={3} /> : <XIcon className="h-3.5 w-3.5" />}
    </button>
  </td>
);

/* ------------ Drawer body ------------ */

const DrawerBody = ({ tpl, version }: { tpl: MatrixTemplate; version: number }) => {
  void version;
  const s = templateStats(tpl.id);
  const product = matrixProducts.find((p) => p.id === tpl.productId);
  const audit = listAudit(tpl.id).slice(0, 8);
  const banksAllowed = matrixBanks.filter((b) => listPermissions(undefined, [tpl.id]).find((p) => p.subjectType === "BANK" && p.subjectId === b.id)?.canAccess);
  const agentsAllowed = matrixAgents.filter((a) => listPermissions(undefined, [tpl.id]).find((p) => p.subjectType === "AGENT" && p.subjectId === a.id)?.canAccess);

  return (
    <>
      <SheetHeader className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">{tpl.id}</Badge>
          <Badge variant="secondary" className="text-[10px]">{tpl.type}</Badge>
        </div>
        <SheetTitle className="text-xl">{tpl.name}</SheetTitle>
        <SheetDescription>
          <span className="font-mono text-[10px] text-muted-foreground mr-1.5">{product?.code}</span>
          {product?.name}
        </SheetDescription>
      </SheetHeader>

      <div className="py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border p-3 bg-card">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Bank coverage</div>
            <div className="text-lg font-semibold mt-0.5 tabular-nums">{s.banksAllowed}<span className="text-muted-foreground text-sm">/{s.banksTotal}</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(s.banksAllowed / Math.max(s.banksTotal, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-md border border-border p-3 bg-card">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Agent coverage</div>
            <div className="text-lg font-semibold mt-0.5 tabular-nums">{s.agentsAllowed}<span className="text-muted-foreground text-sm">/{s.agentsTotal}</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${(s.agentsAllowed / Math.max(s.agentsTotal, 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Assigned banks</h4>
            <Badge variant="secondary" className="text-[10px]">{banksAllowed.length}</Badge>
          </div>
          <div className="space-y-1">
            {banksAllowed.length === 0 && <p className="text-xs text-muted-foreground italic">No banks assigned.</p>}
            {banksAllowed.map((b) => (
              <div key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-background">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-sm font-medium flex-1 truncate">{b.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{b.region}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Assigned agents</h4>
            <Badge variant="secondary" className="text-[10px]">{agentsAllowed.length}</Badge>
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {agentsAllowed.length === 0 && <p className="text-xs text-muted-foreground italic">No agents assigned.</p>}
            {agentsAllowed.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-background">
                <UserCircle2 className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{a.tier}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Audit activity</h4>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last update {s.lastUpdated ? new Date(s.lastUpdated).toLocaleString() : "—"}</span>
            </div>
          </div>
          <div className="relative pl-5 border-l border-border space-y-3">
            {audit.length === 0 && <p className="text-xs text-muted-foreground italic">No activity yet.</p>}
            {audit.map((a) => (
              <div key={a.id} className="relative">
                <span className="absolute -left-[22px] top-1 h-2 w-2 rounded-full bg-accent ring-4 ring-background" />
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-semibold">{a.action}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{a.detail}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {a.actor} · {new Date(a.at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
