import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { FilterGrid } from "@/components/FilterGrid";
import { Loader, PageLoader } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FolderOpen,
  ArrowLeft,
  ArrowUpRight,
  Trash2,
  Eye,
  Package,
} from "lucide-react";
import {
  useListProductGroups,
  useCreateProductGroup,
  useDeleteProductGroup,
} from "@/api/product-groups";
import {
  useListProducts,
  mapApiProduct,
  useDeleteProduct,
} from "@/api/products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useActuarialCodeOptions } from "@/hooks/useActuarialCodeOptions";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";

const groupRouteKey = (g: { id?: string; legacyCode?: string | null }) =>
  g.legacyCode?.trim() || g.id || "";

const groupInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const ProductsList = () => {
  const navigate = useNavigate();
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();
  const actuarialCodeOptions = useActuarialCodeOptions();
  const { code: activeCode } = useParams<{ code: string }>();

  const [groupNameFilter, setGroupNameFilter] = useState("");

  const [productName, setProductName] = useState("");
  const [productGroupIdFilter, setProductGroupIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [ngName, setNgName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const groupFilters = useMemo(
    () => compactQuery({ name: groupNameFilter.trim() || undefined }),
    [groupNameFilter],
  );
  const debouncedGroupFilters = useDebouncedValue(groupFilters);

  const productFilters = useMemo(
    () =>
      compactQuery({
        name: productName.trim() || undefined,
      }),
    [productName],
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

  const { data: groupsPage, isLoading: groupsLoading } =
    useListProductGroups(groupsQuery);

  // Resolve active group from the full groups list when a group route is open.
  const { data: allGroupsPage } = useListProductGroups(
    { pageNumber: 1, pageSize: 200 },
    { enabled: Boolean(activeCode) },
  );

  const groupsForLookup = activeCode
    ? (allGroupsPage?.items ?? [])
    : (groupsPage?.items ?? []);

  const activeGroupMeta = useMemo(() => {
    if (!activeCode) return null;
    const g = groupsForLookup.find(
      (x) => groupRouteKey(x) === activeCode || x.id === activeCode,
    );
    if (!g) return null;
    const id = g.id ?? "";
    const name = g.name ?? "—";
    return {
      id,
      name,
      legacyCode: g.legacyCode?.trim() || "",
    };
  }, [activeCode, groupsForLookup]);

  // When inside a group, productGroupId comes from the route; otherwise optional filter.
  const effectiveProductGroupId =
    activeGroupMeta?.id || productGroupIdFilter || undefined;

  const productsQuery = compactQuery({
    pageNumber: page,
    pageSize,
    ...debouncedProductFilters,
    productGroupId: effectiveProductGroupId,
  });

  const { data: productsPage, isLoading: productsLoading } = useListProducts(
    productsQuery,
    {
      enabled: Boolean(activeCode) ? Boolean(activeGroupMeta?.id) : false,
    },
  );

  const { data: catalogPage, isLoading: catalogLoading } = useListProducts(
    { pageNumber: 1, pageSize: 200 },
    { enabled: !activeCode },
  );

  const productCountByGroupId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of catalogPage?.items ?? []) {
      const gid = item.productGroupId;
      if (!gid) continue;
      map.set(gid, (map.get(gid) ?? 0) + 1);
    }
    return map;
  }, [catalogPage?.items]);

  const productCountsComplete =
    (catalogPage?.totalCount ?? 0) <= (catalogPage?.items?.length ?? 0);

  const createGroup = useCreateProductGroup();
  const deleteGroup = useDeleteProductGroup();
  const deleteProduct = useDeleteProduct();

  const groups = useMemo(() => {
    const defs = groupsPage?.items ?? [];
    return defs.map((g) => {
      const id = g.id ?? "";
      const name = g.name ?? "—";
      const legacyCode = g.legacyCode?.trim() || "";
      return { id, value: id, name, legacyCode };
    });
  }, [groupsPage?.items]);

  const groupTotalCount = groupsPage?.totalCount ?? groups.length;

  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items],
  );

  const productTotalCount = productsPage?.totalCount ?? 0;
  const productTotalPages = Math.max(
    1,
    productsPage?.totalPages ?? productsPage?.pageCount ?? 1,
  );

  // All groups for the productGroupId filter select (when viewing products — already have allGroupsPage).
  const groupOptions = useMemo(() => {
    return (allGroupsPage?.items ?? groupsPage?.items ?? [])
      .map((g) => ({
        id: g.id ?? "",
        label: g.name?.trim() || g.id || "—",
        routeKey: groupRouteKey(g),
      }))
      .filter((g) => g.id);
  }, [allGroupsPage?.items, groupsPage?.items]);

  if (
    activeCode &&
    (groupsLoading || (!activeGroupMeta && allGroupsPage === undefined))
  ) {
    return (
      <AppShell>
        <PageLoader label="Loading product group…" />
      </AppShell>
    );
  }

  if (activeCode && !activeGroupMeta) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[
            { label: "Products", to: "/products" },
            { label: "Not found" },
          ]}
          title="Product group not found"
          description={`No group matches “${activeCode}”.`}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/products")}
            >
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
          }
        />
      </AppShell>
    );
  }

  const handleCreateGroup = () => {
    if (!ngName.trim()) {
      toast.error("Name is required.");
      return;
    }
    createGroup.mutate(
      { name: ngName.trim() },
      {
        onSuccess: () => {
          toast.success(`Product group created: ${ngName.trim()}`);
          setNgName("");
          setNewGroupOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create group",
          );
        },
      },
    );
  };

  const handleDeleteGroup = () => {
    if (!deleteGroupTarget?.id) return;
    deleteGroup.mutate(deleteGroupTarget.id, {
      onSuccess: () => {
        toast.success(`Product group deleted: ${deleteGroupTarget.name}`);
        setDeleteGroupTarget(null);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupsLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={`group-skel-${i}`}
                className="shadow-card border-border overflow-hidden"
              >
                <div className="p-5 flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2">
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          {!groupsLoading && groups.length === 0 && (
            <Card className="col-span-full border-dashed shadow-none p-12 text-center">
              <div className="mx-auto mb-3 h-11 w-11 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <FolderOpen className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No product groups match
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different name, or create a new product family.
              </p>
              <Button
                className="mt-4 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setNewGroupOpen(true)}
              >
                <Plus className="h-4 w-4" /> Create product group
              </Button>
            </Card>
          )}
          {groups.map((g) => {
            const count = g.id ? (productCountByGroupId.get(g.id) ?? 0) : 0;
            const href = `/products/groups/${encodeURIComponent(groupRouteKey(g))}`;
            return (
              <div key={g.id || g.legacyCode} className="relative group h-full">
                <Link
                  to={href}
                  className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="relative h-full min-h-[156px] overflow-hidden shadow-card border-border transition-all group-hover:shadow-elevated group-hover:border-accent/40">
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1 bg-accent/50 group-hover:bg-accent transition-colors"
                    />
                    <div className="flex h-full flex-col">
                      <div className="flex items-start gap-3 p-5 pl-6 pr-12">
                        <div className="h-11 w-11 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0 text-sm font-semibold tracking-tight">
                          {groupInitials(g.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                            {g.name}
                          </h3>
                          <div className="mt-1.5 h-5">
                            {g.legacyCode ? (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] font-medium px-1.5 py-0 h-5 rounded-sm text-muted-foreground"
                              >
                                {g.legacyCode}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-5 pl-6 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs text-muted-foreground border border-border/70 min-h-[1.5rem]">
                          {catalogLoading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : productCountsComplete ? (
                            <>
                              <Package className="h-3.5 w-3.5 text-accent" />
                              <span className="tabular-nums font-semibold text-foreground">
                                {count}
                              </span>
                              <span>
                                {count === 1 ? "product" : "products"}
                              </span>
                            </>
                          ) : (
                            <span>View products</span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                          Browse
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-60 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 z-10 h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 group-hover:text-muted-foreground"
                      disabled={deleteGroup.isPending || !g.id}
                      onClick={() => {
                        if (!g.id) return;
                        setDeleteGroupTarget({ id: g.id, name: g.name });
                      }}
                      aria-label={`Delete ${g.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Delete group</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>

        <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create product group</DialogTitle>
              <DialogDescription>
                Groups organise products by insurance family.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ng-name">Name *</Label>
                <Input
                  id="ng-name"
                  value={ngName}
                  onChange={(e) => setNgName(e.target.value)}
                  placeholder="e.g. Term Life"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewGroupOpen(false)}>
                Cancel
              </Button>
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

        <AlertDialog
          open={Boolean(deleteGroupTarget)}
          onOpenChange={(open) => !open && setDeleteGroupTarget(null)}
        >
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product group?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteGroupTarget
                  ? `This will permanently delete “${deleteGroupTarget.name}”. This action cannot be undone. Products in this group may also become unavailable.`
                  : "This will permanently delete this product group. This action cannot be undone. Products in this group may also become unavailable."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteGroup.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteGroup.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteGroup}
              >
                {deleteGroup.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    );
  }

  // ---- Products within a group ----
  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Products", to: "/products" },
          { label: activeGroupMeta.name },
        ]}
        title={activeGroupMeta.name}
        description={
          activeGroupMeta.legacyCode
            ? `Legacy code ${activeGroupMeta.legacyCode}`
            : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/products")}
            >
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
            <Button
              asChild
              size="sm"
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Link
                to={`/products/new?groupId=${encodeURIComponent(activeGroupMeta.id)}`}
              >
                <Plus className="h-4 w-4" /> Create Product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 mb-5">
        <FilterGrid>
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
            <Label className="text-xs text-muted-foreground">
              Product group
            </Label>
            <Select
              value={productGroupIdFilter || activeGroupMeta.id}
              onValueChange={(v) => {
                setProductGroupIdFilter(v);
                const opt = groupOptions.find((g) => g.id === v);
                if (opt?.routeKey)
                  navigate(
                    `/products/groups/${encodeURIComponent(opt.routeKey)}`,
                  );
                void opt;
              }}
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
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
              {productsLoading
                ? "Loading products…"
                : `${productTotalCount} product(s)`}
            </div>
          </div>
        </FilterGrid>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="h-11 px-4 text-left font-medium w-[220px] min-w-[220px]">
                  Name
                </th>
                <th className="h-11 px-4 text-left font-medium">
                  Coverage text
                </th>
                <th className="h-11 px-4 text-left font-medium">Currencies</th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">
                  Policy plan type
                </th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">
                  Actuarial code
                </th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">
                  SAP channel code
                </th>
                <th className="h-11 px-4 text-left font-medium whitespace-nowrap">
                  SAP product code
                </th>
                {/* <th className="h-11 px-4 text-left font-medium whitespace-nowrap">
                  Requires loan balances
                </th> */}
                <th className="h-11 px-2 text-center font-medium w-14 sticky right-0 bg-[#F8FAFC] z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const actuarialLabel = p.actuarialCode
                  ? (actuarialCodeOptions.find(
                      (o) => o.value === p.actuarialCode,
                    )?.text ?? p.actuarialCode)
                  : "—";
                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="px-4 py-3.5 w-[220px] min-w-[220px] max-w-[220px]">
                      <div className="font-semibold text-base text-foreground leading-snug">
                        {p.name}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <div
                        className="text-xs text-muted-foreground line-clamp-2 leading-snug"
                        title={p.coverageText}
                      >
                        {p.coverageText?.trim() || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 min-w-40">
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
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.policyPlanType
                        ? policyPlanTypeLabel(p.policyPlanType)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                      {actuarialLabel}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                      {p.sapChannelCode?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                      {p.sapProductCode?.trim() || "—"}
                    </td>
                    {/* <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.requiresLoanBalances ? "Yes" : "No"}
                    </td> */}
                    <td
                      className="px-2 py-3.5 sticky right-0 bg-background z-30 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          onClick={() =>
                            setDeleteTarget({ id: p.id, name: p.name })
                          }
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
                  <td
                    colSpan={9}
                    className="p-10 text-center text-muted-foreground text-sm"
                  >
                    No products match your filters.
                  </td>
                </tr>
              )}
              {productsLoading && (
                <tr>
                  <td colSpan={9} className="p-12">
                    <Loader label="Loading products…" />
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently delete “${deleteTarget.name}”. This action cannot be undone.`
                : "This will permanently delete this product. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteProduct.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success(`Product deleted: ${deleteTarget.name}`);
                    setDeleteTarget(null);
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to delete product",
                    ),
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
