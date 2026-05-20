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
  matrixProducts, matrixTemplates, matrixAgencies, matrixAgents,
  listGrantRows, updateGrant,
} from "@/data/permissions";
import { Switch } from "@/components/ui/switch";
import { Building2, UserCircle2, Download, Filter, X as XIcon, Save } from "lucide-react";
import { toast } from "sonner";

const ALL = "ALL";

const PermissionMatrix = () => {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  const [pending, setPending] = useState<Record<string, number>>({});

  // Filters
  const [fProduct, setFProduct] = useState<string>(ALL);
  const [fTemplate, setFTemplate] = useState<string>(ALL);
  const [fAgency, setFAgency] = useState<string>(ALL);
  const [fAgent, setFAgent] = useState<string>(ALL);

  const rows = useMemo(() => {
    void version;
    return listGrantRows().filter((r) => {
      if (fProduct !== ALL && r.productId !== fProduct) return false;
      if (fTemplate !== ALL && r.templateId !== fTemplate) return false;
      if (fAgency !== ALL && r.agencyId !== fAgency) return false;
      if (fAgent !== ALL && r.agentId !== fAgent) return false;
      return true;
    });
  }, [version, fProduct, fTemplate, fAgency, fAgent]);

  const templatesForFilter = useMemo(
    () => matrixTemplates.filter((t) => fProduct === ALL || t.productId === fProduct),
    [fProduct]
  );
  const agentsForFilter = useMemo(
    () => matrixAgents.filter((a) => fAgency === ALL || a.agencyId === fAgency),
    [fAgency]
  );

  const clearFilters = () => {
    setFProduct(ALL); setFTemplate(ALL); setFAgency(ALL); setFAgent(ALL);
  };

  const activeFilters =
    (fProduct !== ALL ? 1 : 0) + (fTemplate !== ALL ? 1 : 0) +
    (fAgency !== ALL ? 1 : 0) + (fAgent !== ALL ? 1 : 0);

  const handleExport = () => {
    const data = rows.map((r) => ({
      Product: r.productName,
      Template: r.templateName,
      Type: r.templateType,
      Agency: r.agencyName,
      Agent: r.agentName,
      "Can Sell": r.canSell ? "Yes" : "No",
      "Commission %": r.commissionPct,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permissions");
    XLSX.writeFile(wb, `template-permissions.xlsx`);
    toast.success("Permissions exported");
  };


  return (
    <AppShell>
      <PageHeader
        title="Template Permissions"
        description="Grant template access to banks and agencies."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
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
          <div className="overflow-auto max-h-[calc(100vh-360px)] border-t border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="p-2 border-b border-border font-semibold min-w-[200px]">
                    <HeaderFilter
                      label="Product Name"
                      value={fProduct}
                      onChange={(v) => { setFProduct(v); setFTemplate(ALL); }}
                      options={matrixProducts.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </th>
                  <th className="p-2 border-b border-border font-semibold min-w-[220px]">
                    <HeaderFilter
                      label="Template Name"
                      value={fTemplate}
                      onChange={setFTemplate}
                      options={templatesForFilter.map((t) => ({ value: t.id, label: t.name }))}
                    />
                  </th>
                  <th className="p-2 border-b border-border font-semibold min-w-[180px]">
                    <HeaderFilter
                      label="Agency"
                      value={fAgency}
                      onChange={(v) => { setFAgency(v); setFAgent(ALL); }}
                      options={matrixAgencies.map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </th>
                  <th className="p-2 border-b border-border font-semibold min-w-[180px]">
                    <HeaderFilter
                      label="Agent"
                      value={fAgent}
                      onChange={setFAgent}
                      options={agentsForFilter.map((a) => ({ value: a.id, label: a.name }))}
                    />
                  </th>
                  <th className="p-3 border-b border-border font-semibold text-center min-w-[110px]">Can Sell</th>
                  <th className="p-3 border-b border-border font-semibold text-center min-w-[120px]">Commission %</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <p className="text-sm font-medium">No permissions match the current filters.</p>
                      <p className="text-xs text-muted-foreground mt-1">Try clearing the filters.</p>
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
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        {r.agencyName}
                      </span>
                    </td>
                    <td className="p-3 border-b border-border">
                      <span className="inline-flex items-center gap-1.5">
                        <UserCircle2 className="h-3.5 w-3.5 text-purple-500" />
                        {r.agentName}
                      </span>
                    </td>

                    <td className="p-3 border-b border-border text-center">
                      <Switch
                        checked={r.canSell}
                        onCheckedChange={(v) => { updateGrant(r.id, { canSell: v }); refresh(); }}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </td>
                    <td className="p-2 border-b border-border text-center">
                      {(() => {
                        const draft = pending[r.id] ?? r.commissionPct;
                        const dirty = pending[r.id] !== undefined && pending[r.id] !== r.commissionPct;
                        return (
                          <div className="relative inline-flex items-center w-36">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={draft}
                              disabled={!r.canSell}
                              onChange={(e) => {
                                const raw = parseFloat(e.target.value);
                                const next = isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
                                setPending((p) => ({ ...p, [r.id]: next }));
                              }}
                              className="h-8 text-sm pr-14 text-right tabular-nums"
                            />
                            <div className="absolute right-1.5 flex items-center gap-0.5">
                              {dirty ? (
                                <button
                                  type="button"
                                  disabled={!r.canSell}
                                  onClick={() => {
                                    updateGrant(r.id, { commissionPct: draft });
                                    setPending((p) => { const n = { ...p }; delete n[r.id]; return n; });
                                    refresh();
                                    toast.success("Commission saved");
                                  }}
                                  className="inline-flex items-center justify-center h-5 w-5 rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-30"
                                  title="Save commission"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground pointer-events-none">%</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default PermissionMatrix;

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
