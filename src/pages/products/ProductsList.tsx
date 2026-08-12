import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import TablePagination from "@/components/TablePagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, FolderOpen, ArrowLeft, ChevronRight, Trash2, Download, Eye,
} from "lucide-react";
import {
  useListProductGroups, useCreateProductGroup, useDeleteProductGroup,
} from "@/api/product-groups";
import {
  useListProducts, mapApiProduct, useDeleteProduct,
} from "@/api/products";
import { downloadDocumentFile } from "@/api/documents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const ISSUANCE_MODE_LABELS: Record<string, string> = {
  wholeOfTerm: "Whole of term",
  annualRenewable: "Annual renewable",
};

const formatMaxCoveredYears = (years?: number | null): string => {
  if (years == null) return "—";
  return years === 1 ? "1 year" : `${years} years`;
};

const ProductsList = () => {
  const navigate = useNavigate();
  const { code: activeCode } = useParams<{ code: string }>();

  const [groupNameFilter, setGroupNameFilter] = useState("");

  const [productName, setProductName] = useState("");
  const [productGroupIdFilter, setProductGroupIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [ngEnglish, setNgEnglish] = useState("");
  const [ngLabel, setNgLabel] = useState("");
  const [ngCode, setNgCode] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const groupFilters = useMemo(
    () => compactQuery({ name: groupNameFilter.trim() || undefined }),
    [groupNameFilter]
  );
  const debouncedGroupFilters = useDebouncedValue(groupFilters);

  const productFilters = useMemo(
    () =>
      compactQuery({
        name: productName.trim() || undefined,
      }),
    [productName]
  );
  const debouncedProductFilters = useDebouncedValue(productFilters);

  useEffect(() => {
    setPage(1);
  }, [debouncedProductFilters, productGroupIdFilter, pageSize, activeCode]);

  const groupsQuery = compactQuery({
    pageNumber: 1,
    pageSize: 100,
    ...debouncedGroupFilters,
  });

  const { data: groupsPage, isLoading: groupsLoading } = useListProductGroups(groupsQuery);

  // Resolve active group from the full groups list when a group route is open.
  const { data: allGroupsPage } = useListProductGroups(
    { pageNumber: 1, pageSize: 200 },
    { enabled: Boolean(activeCode) }
  );

  const groupsForLookup = activeCode ? (allGroupsPage?.items ?? []) : (groupsPage?.items ?? []);

  const activeGroupMeta = useMemo(() => {
    if (!activeCode) return null;
    const g = groupsForLookup.find((x) => (x.code?.trim() || x.id) === activeCode || x.id === activeCode);
    if (!g) return null;
    const id = g.id ?? "";
    const name = g.name ?? "—";
    return {
      id,
      code: g.code?.trim() || id,
      label: g.label?.trim() || name,
      english: g.english?.trim() || name,
    };
  }, [activeCode, groupsForLookup]);

  // When inside a group, productGroupId comes from the route; otherwise optional filter.
  const effectiveProductGroupId = activeGroupMeta?.id || productGroupIdFilter || undefined;

  const productsQuery = compactQuery({
    pageNumber: page,
    pageSize,
    ...debouncedProductFilters,
    productGroupId: effectiveProductGroupId,
  });

  const { data: productsPage, isLoading: productsLoading } = useListProducts(productsQuery, {
    enabled: Boolean(activeCode) ? Boolean(activeGroupMeta?.id) : false,
  });

  const createGroup = useCreateProductGroup();
  const deleteGroup = useDeleteProductGroup();
  const deleteProduct = useDeleteProduct();

  const groups = useMemo(() => {
    const defs = groupsPage?.items ?? [];
    return defs.map((g) => {
      const id = g.id ?? "";
      const name = g.name ?? "—";
      const english = g.english?.trim() || name;
      const label = g.label?.trim() || name;
      const code = g.code?.trim() || id;
      return { id, value: id, code, label, english };
    });
  }, [groupsPage?.items]);

  const groupTotalCount = groupsPage?.totalCount ?? groups.length;

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );

  const productTotalCount = productsPage?.totalCount ?? 0;
  const productTotalPages = Math.max(1, productsPage?.totalPages ?? productsPage?.pageCount ?? 1);

  // All groups for the productGroupId filter select (when viewing products — already have allGroupsPage).
  const groupOptions = useMemo(() => {
    return (allGroupsPage?.items ?? groupsPage?.items ?? []).map((g) => ({
      id: g.id ?? "",
      label: g.english?.trim() || g.label?.trim() || g.name || g.id || "—",
    })).filter((g) => g.id);
  }, [allGroupsPage?.items, groupsPage?.items]);

  if (activeCode && (groupsLoading || (!activeGroupMeta && allGroupsPage === undefined))) {
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

  if (activeCode && !activeGroupMeta) {
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
      toast.error("English name is required.");
      return;
    }
    createGroup.mutate(
      { name: ngEnglish.trim() },
      {
        onSuccess: () => {
          toast.success(
            ngCode.trim()
              ? `${ngEnglish} (${ngCode}) — code/label will sync when the API supports them.`
              : `Product group created: ${ngEnglish}`
          );
          setNgEnglish(""); setNgLabel(""); setNgCode("");
          setNewGroupOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create group");
        },
      }
    );
  };

  // ---- Group grid view ----
  if (!activeGroupMeta) {
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

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
          <div className="space-y-1.5 flex-1 max-w-sm">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by name…"
                value={groupNameFilter}
                onChange={(e) => setGroupNameFilter(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>
          {groupNameFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() => setGroupNameFilter("")}
            >
              Clear
            </Button>
          )}
          <div className="text-xs text-muted-foreground sm:ml-auto pb-2">
            {groupsLoading ? "Loading…" : `${groupTotalCount} group(s)`}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupsLoading && (
            <p className="text-sm text-muted-foreground col-span-full">Loading product groups…</p>
          )}
          {!groupsLoading && groups.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">No product groups match the current filters.</p>
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
                        deleteGroup.mutate(g.id, {
                          onSuccess: () => toast.success(`Product group deleted: ${g.english}`),
                          onError: (err) =>
                            toast.error(err instanceof Error ? err.message : "Failed to delete"),
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
                <div className="flex items-center justify-end text-sm">
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
  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Products", to: "/products" },
          { label: activeGroupMeta.english },
        ]}
        title={activeGroupMeta.english}
        description={`${activeGroupMeta.label} · Code ${activeGroupMeta.code}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
            <Button asChild size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to={`/products/new?groupId=${encodeURIComponent(activeGroupMeta.id)}`}>
                <Plus className="h-4 w-4" /> Create Product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by name…"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Product group</Label>
            <Select
              value={productGroupIdFilter || activeGroupMeta.id}
              onValueChange={(v) => {
                setProductGroupIdFilter(v);
                const opt = groupOptions.find((g) => g.id === v);
                const match = (allGroupsPage?.items ?? []).find((g) => g.id === v);
                const code = match?.code?.trim() || v;
                if (code) navigate(`/products/groups/${encodeURIComponent(code)}`);
                void opt;
              }}
            >
              <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {groupOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            {productName && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground"
                onClick={() => setProductName("")}
              >
                Clear
              </Button>
            )}
            <div className="text-xs text-muted-foreground pb-2 sm:ml-auto">
              {productsLoading ? "Loading products…" : `${productTotalCount} product(s)`}
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="h-11 px-4 text-left font-medium w-[250px] min-w-[250px]">Name</th>
                <th className="h-11 px-4 text-left font-medium">Coverage text</th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">Other informations</th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">Template</th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">Issuance</th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">Max years</th>
                <th className="h-11 px-4 text-left font-medium">Currencies</th>
                <th className="h-11 px-2 text-center font-medium w-14 sticky right-0 bg-[#F8FAFC] z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const templateId = p.defaultPrintableTemplateDocumentId?.trim() || "";
                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="px-4 py-3.5 w-[250px] min-w-[250px] max-w-[250px]">
                      <div className="font-semibold text-base text-foreground leading-snug">{p.name}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <div className="text-xs text-muted-foreground line-clamp-2 leading-snug" title={p.coverageText}>
                        {p.coverageText?.trim() || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2 flex items-center gap-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Coverages</span>
                          <span className="text-sm font-semibold tabular-nums">{p.coverages?.length ?? 0}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Payments</span>
                          <span className="text-sm font-semibold tabular-nums">{p.paymentMethods?.length ?? 0}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Documents</span>
                          <span className="text-sm font-semibold tabular-nums">{p.productDocumentTypes?.length ?? 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {templateId ? (
                        <Button
                          type="button"
                          size="icon"
                          className="h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Download printable template"
                          onClick={() => {
                            void downloadDocumentFile(templateId).catch((err) =>
                              toast.error(err instanceof Error ? err.message : "Failed to download template"),
                            );
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.issuanceMode
                        ? (ISSUANCE_MODE_LABELS[p.issuanceMode] ?? p.issuanceMode)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {formatMaxCoveredYears(p.maxCoveredYears)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {p.currencies.length ? (
                          p.currencies.map((c) => (
                            <Badge
                              key={c}
                              variant="outline"
                              className="text-xs font-mono px-2 py-0.5 !rounded-sm border-sky-200 bg-sky-100 text-sky-800"
                            >
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3.5 sticky right-0 bg-background z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Open"
                          onClick={() => navigate(`/products/${p.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!productsLoading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground text-sm">
                    No products match your filters.
                  </td>
                </tr>
              )}
              {productsLoading && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground text-sm">
                    Loading products…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={productTotalCount}
          totalPages={productTotalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={productsLoading}
        />
      </Card>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{deleteTarget ? ` “${deleteTarget.name}”` : " this product"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProduct.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteProduct.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success(`Product deleted: ${deleteTarget.name}`);
                    setDeleteTarget(null);
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Failed to delete product"),
                });
              }}
            >
              {deleteProduct.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  );
};

export default ProductsList;
