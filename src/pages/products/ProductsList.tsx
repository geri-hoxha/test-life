import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, MoreHorizontal, Settings2, Package, Calendar, GitBranch,
  Layers, Shield, Receipt, FolderOpen, ArrowLeft, ChevronRight, Trash2,
} from "lucide-react";
import {
  ProductStatus, PAYMENT_MODELS, BANK_PARTNERS,
} from "@/data/products";
import {
  useListProductGroups, useCreateProductGroup, useDeleteProductGroup,
} from "@/api/product-groups";
import {
  useListProducts, mapApiProduct,
} from "@/api/products";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const ProductsList = () => {
  const navigate = useNavigate();
  const { code: activeCode } = useParams<{ code: string }>();
  const [query, setQuery] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newGroupOpen, setNewGroupOpen] = useState(false);
  useEffect(() => { setPage(1); }, [query, pageSize, activeCode, bankFilter]);
  const [ngEnglish, setNgEnglish] = useState("");
  const [ngLabel, setNgLabel] = useState("");
  const [ngCode, setNgCode] = useState("");

  const { data: groupsPage, isLoading: groupsLoading } = useListProductGroups({ pageNumber: 1, pageSize: 100 });
  const { data: productsPage, isLoading: productsLoading } = useListProducts({ pageNumber: 1, pageSize: 500 });
  const createGroup = useCreateProductGroup();
  const deleteGroup = useDeleteProductGroup();

  const allProducts = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const groups = useMemo(() => {
    const defs = groupsPage?.items ?? [];
    return defs.map((g) => {
      const id = g.id ?? "";
      const name = g.name ?? "—";
      // Prefer API fields when available; fall back until backend adds them.
      const english = g.english?.trim() || name;
      const label = g.label?.trim() || name;
      const code = g.code?.trim() || id;
      const items = allProducts.filter((p) => p.productGroupId === id);
      return { id, value: id, code, label, english, items };
    });
  }, [allProducts, groupsPage?.items]);

  const activeGroup = activeCode
    ? groups.find((g) => g.code === activeCode || g.id === activeCode)
    : null;

  // While a group route is open and data is still fetching, avoid falling through to the grid.
  if (activeCode && groupsLoading) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products", to: "/products" }, { label: "…" }]}
          title="Loading…"
          description="Fetching product group."
        />
      </AppShell>
    );
  }

  if (activeCode && !groupsLoading && !activeGroup) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Not found" }]}
          title="Product group not found"
          description={`No group matches “${activeCode}”.`}
          actions={
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
          }
        />
      </AppShell>
    );
  }

  const handleCreateGroup = () => {
    if (!ngEnglish.trim()) {
      toast({ title: "Missing fields", description: "English name is required.", variant: "destructive" });
      return;
    }
    // API currently accepts only `name`. Extra fields are typed for when the API adds them.
    createGroup.mutate(
      { name: ngEnglish.trim() },
      {
        onSuccess: () => {
          toast({
            title: "Product group created",
            description: ngCode.trim()
              ? `${ngEnglish} (${ngCode}) — code/label will sync when the API supports them.`
              : ngEnglish,
          });
          setNgEnglish(""); setNgLabel(""); setNgCode("");
          setNewGroupOpen(false);
        },
        onError: (err) => {
          toast({
            title: "Failed to create group",
            description: err instanceof Error ? err.message : "Request failed",
            variant: "destructive",
          });
        },
      }
    );
  };

  // ---- Group grid view ----
  if (!activeGroup) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products" }]}
          title="Product Groups"
          description="Browse life-insurance product families. Select a group to view its products."
          actions={
            <Button
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => setNewGroupOpen(true)}
            >
              <Plus className="h-4 w-4" /> Create product group
            </Button>
          }
        />


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupsLoading && (
            <p className="text-sm text-muted-foreground col-span-full">Loading product groups…</p>
          )}
          {!groupsLoading && groups.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">No product groups yet.</p>
          )}
          {groups.map((g) => (
            <Card
              key={g.id || g.code}
              className="shadow-card border-border hover:shadow-md hover:border-accent/40 transition-all cursor-pointer group"
              onClick={() => navigate(`/products/groups/${encodeURIComponent(g.code)}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate group-hover:text-accent transition-colors">
                        {g.label}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{g.english}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="font-mono text-[10px]">{g.code}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={deleteGroup.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!g.id) return;
                        if (g.items.length > 0) {
                          toast({ title: "Cannot delete", description: `${g.english} has ${g.items.length} product(s).`, variant: "destructive" });
                          return;
                        }
                        deleteGroup.mutate(g.id, {
                          onSuccess: () => toast({ title: "Product group deleted", description: g.english }),
                          onError: (err) =>
                            toast({
                              title: "Failed to delete",
                              description: err instanceof Error ? err.message : "Request failed",
                              variant: "destructive",
                            }),
                        });
                      }}
                      title="Delete group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{g.items.length}</span> product{g.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-accent inline-flex items-center gap-1 text-xs font-medium">
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create product group</DialogTitle>
              <DialogDescription>
                Groups organise products by insurance family. Code and Albanian label will be stored by the API in a later release.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ng-english">English name *</Label>
                <Input id="ng-english" value={ngEnglish} onChange={(e) => setNgEnglish(e.target.value)} placeholder="e.g. Term Life" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ng-label">Albanian label</Label>
                <Input id="ng-label" value={ngLabel} onChange={(e) => setNgLabel(e.target.value)} placeholder="e.g. Sigurim i Jetes (coming soon)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ng-code">Insurance product code</Label>
                <Input id="ng-code" value={ngCode} onChange={(e) => setNgCode(e.target.value)} placeholder="e.g. 11 (coming soon)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateGroup}
                disabled={createGroup.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {createGroup.isPending ? "Creating…" : "Create group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    );
  }


  // ---- Products within a group ----
  const filtered = activeGroup.items.filter(
    (p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase());
      const matchesBank = bankFilter === "ALL" || p.bankPartnerCode === bankFilter;
      return matchesQuery && matchesBank;
    }
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);



  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Products", to: "/products" },
          { label: activeGroup.english },
        ]}
        title={activeGroup.english}
        description={`${activeGroup.label} · Code ${activeGroup.code}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
            <Button asChild size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to={`/products/new?groupId=${encodeURIComponent(activeGroup.id)}`}>
                <Plus className="h-4 w-4" /> Create Product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[260px] h-9 text-xs bg-white">
              <SelectValue placeholder="Bank partner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                <span className="text-muted-foreground">All bank partners</span>
              </SelectItem>
              {BANK_PARTNERS.map((b) => (
                <SelectItem key={b.value} value={b.value} className="text-xs">
                  <strong className="font-semibold text-foreground mr-2">{b.value}</strong>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(query || bankFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground"
              onClick={() => { setQuery(""); setBankFilter("ALL"); }}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {productsLoading ? "Loading products…" : `${filtered.length} product(s)`}
        </div>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1600px] w-full text-xs table-fixed">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="h-9 px-2 text-left font-medium w-[20%]">Product</th>
                <th className="h-9 px-2 text-left font-medium w-[17%]">Setup & Commercial</th>
                <th className="h-9 px-2 text-left font-medium w-[22%]">Payment & Loan</th>
                <th className="h-9 px-2 text-left font-medium w-[17%]">Compliance</th>
                <th className="h-9 px-2 text-left font-medium w-[10%]">External</th>
                <th className="h-9 px-0 text-center font-medium w-[4%] sticky    right-0 bg-[#F8FAFC] z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => {
                const pm = PAYMENT_MODELS.find((m) => m.value === p.paymentModel);
                const s = p.setupDetails;

                const pay = p.paymentDetails;
                const loan = p.loanDetails;
                const intd = p.internalDetails;
                const ext = p.externalDetails;
                const dash = (v?: string | number | null) =>
                  v === undefined || v === null || v === "" ? "—" : String(v);
                const flagChips = [
                  p.flags.pep && "PEP",
                  p.flags.highInsuredAmount && "High Amt",
                  p.flags.totalExposure && "Exposure",
                  p.flags.manualUnderwriting && "Manual UW",
                  p.flags.compliance && "Compliance",
                ].filter(Boolean) as string[];

                const MiniField = ({ label, value }: { label: string; value: React.ReactNode }) => (
                  <div className="flex items-baseline justify-between gap-2 min-w-0">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
                    <span className="text-xs font-medium text-foreground truncate text-right">{value}</span>
                  </div>
                );

                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/40 cursor-pointer align-top"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    {/* Product identity */}
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-accent">{p.id}</span>
                          <Badge className={`font-medium border-0 ${statusClass[p.status]}`}>{p.status}</Badge>
                          <Badge variant="outline" className="text-[10px]">v{p.activeVersion}</Badge>
                        </div>
                        <div className="font-semibold text-sm text-foreground leading-tight">{p.name}</div>
                        {(() => {
                          const bank = BANK_PARTNERS.find((b) => b.value === p.bankPartnerCode);
                          return (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="font-mono text-[11px] font-semibold text-foreground">{bank?.value ?? dash(p.bankPartnerCode)}</span>
                              <span className="text-[10px]" title={bank?.label}>{bank?.label ?? dash(p.bankPartnerCode)}</span>
                            </div>
                          );
                        })()}
                        <div className="text-[11px] text-muted-foreground line-clamp-2" title={p.description}>
                          {p.description}
                        </div>
                      </div>
                    </td>

                    {/* Setup & Commercial */}
                    <td className="px-2 py-2">
                      <div className="rounded-md bg-muted/40 p-1.5 space-y-1">
                        <MiniField label="Policy" value={dash(s?.policyType)} />
                        <MiniField label="Insured Amt" value={dash(s?.insuranceAmountType)} />
                        <MiniField label="Agent Comm." value={`${(p.agentCommission * 100).toFixed(1)}%`} />
                        <MiniField label="Bank Comm." value={`${(p.bankCommission * 100).toFixed(1)}%`} />
                        <MiniField label="Premium Tbl" value={<span className="font-mono">{dash(p.premiumTableId)}</span>} />
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Currencies</span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {p.currencies.map((c) => (
                              <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>


                    {/* Payment & Loan */}
                    <td className="px-2 py-2">
                      <div className="rounded-md bg-muted/40 p-1.5 space-y-1">
                        <MiniField label="Model" value={pm?.label ?? dash(p.paymentModel)} />
                        <MiniField label="Premium Pay" value={dash(pay?.premiumPaymentType)} />
                        <MiniField label="Packet Pay" value={dash(pay?.packetPaymentType)} />
                        <MiniField label="Renewal" value={dash(pay?.renewalType)} />
                        <MiniField label="Packet Loan" value={dash(loan?.packetLoanType)} />
                        <MiniField label="Loan Product" value={dash(loan?.loanProductType)} />
                      </div>
                    </td>

                    {/* Compliance & flags */}
                    <td className="px-2 py-2">
                      <div className="rounded-md bg-muted/40 p-1.5 space-y-1">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Flags</div>
                          {flagChips.length ? (
                            <div className="flex flex-wrap gap-1">
                              {flagChips.map((f) => (
                                <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">{f}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">None</span>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Required Docs</div>
                          <div className="text-[11px] text-foreground line-clamp-3" title={p.requiredDocuments.join(", ")}>
                            {p.requiredDocuments.length ? p.requiredDocuments.join(", ") : "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* External codes */}
                    <td className="px-2 py-2">
                      <div className="rounded-md bg-muted/40 p-1.5 space-y-1">
                        <MiniField label="SAP Prod" value={<span className="font-mono">{dash(ext?.sapProductCode)}</span>} />
                        <MiniField label="SAP Ch" value={<span className="font-mono">{dash(ext?.sapChannelCode)}</span>} />
                        <MiniField label="F5" value={<span className="font-mono">{dash(ext?.f5ProductCode)}</span>} />
                        <MiniField label="Actuarial" value={<span className="font-mono">{dash(ext?.actuarialProductCode)}</span>} />
                        <MiniField label="Legacy Pkt" value={<span className="font-mono">{dash(s?.legacyPacketId)}</span>} />
                      </div>
                    </td>

                    <td className="px-0 py-2 text-center w-4 sticky right-0 bg-background z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/products/${p.id}`)}>
                            <Settings2 className="h-4 w-4 mr-2" />Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>Manage versions</DropdownMenuItem>
                          <DropdownMenuItem>Clone product</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page</span>
            <select
              className="h-7 rounded border border-border bg-background px-2 text-xs"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="ml-2">
              {filtered.length === 0
                ? "0 of 0"
                : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === 1} onClick={() => setPage(1)}>« First</Button>
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</Button>
            <span className="px-2 text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next ›</Button>
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last »</Button>
          </div>
        </div>
      </Card>



    </AppShell>
  );
};

export default ProductsList;
