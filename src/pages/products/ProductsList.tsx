import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, MoreHorizontal, Settings2, Filter, Package, Calendar, GitBranch,
  Layers, Shield, Receipt, FolderOpen, ArrowLeft, ChevronRight,
} from "lucide-react";
import {
  listProducts, ProductStatus, PRODUCT_GROUPS, listTariffs, listProductCoverages, PAYMENT_MODELS,
} from "@/data/products";

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const ProductsList = () => {
  const navigate = useNavigate();
  const { code: activeCode } = useParams<{ code: string }>();
  const [query, setQuery] = useState("");

  const allProducts = listProducts();

  const groups = useMemo(() => {
    return PRODUCT_GROUPS.map((g) => {
      const items = allProducts.filter((p) => {
        const pg = PRODUCT_GROUPS.find((x) => x.value === p.productGroup);
        return pg?.code === g.code;
      });
      return { ...g, items };
    }).filter((g) => g.items.length > 0);
  }, [allProducts]);

  const activeGroup = activeCode ? groups.find((g) => g.code === activeCode) : null;

  // ---- Group grid view ----
  if (!activeGroup) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products" }]}
          title="Product Groups"
          description="Browse life-insurance product families. Select a group to view its products."
          actions={
            <Button asChild className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/products/new">
                <Plus className="h-4 w-4" /> Create Product
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <Card
              key={g.code}
              className="shadow-card border-border hover:shadow-md hover:border-accent/40 transition-all cursor-pointer group"
              onClick={() => setSearchParams({ group: g.code })}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate group-hover:text-accent transition-colors">
                        {g.english}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{g.label}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">{g.code}</Badge>
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
      </AppShell>
    );
  }

  // ---- Products within a group ----
  const filtered = activeGroup.items.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setSearchParams({})}>
              <ArrowLeft className="h-4 w-4" /> All groups
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button asChild className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/products/new">
                <Plus className="h-4 w-4" /> Create Product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} product(s)</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const fam = PRODUCT_GROUPS.find((g) => g.value === p.productGroup);
          const pm = PAYMENT_MODELS.find((m) => m.value === p.paymentModel);
          const tariffCount = listTariffs(p.id).length;
          const coverageCount = listProductCoverages(p.id).length;
          return (
            <Card
              key={p.id}
              className="shadow-card border-border hover:shadow-md hover:border-accent/40 transition-all cursor-pointer group flex flex-col"
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate group-hover:text-accent transition-colors">
                        {p.name}
                      </CardTitle>
                      <p className="font-mono text-xs text-accent mt-1">{p.code}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Settings2 className="h-4 w-4 mr-2" />Configure</DropdownMenuItem>
                        <DropdownMenuItem>Manage versions</DropdownMenuItem>
                        <DropdownMenuItem>Clone product</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">{p.description}</CardDescription>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`font-medium border-0 ${statusClass[p.status]}`}>{p.status}</Badge>
                  <Badge variant="outline" className="text-[10px] gap-1"><GitBranch className="h-3 w-3" />{p.activeVersion}</Badge>
                  {pm && <Badge variant="outline" className="text-[10px]">{pm.label}</Badge>}
                </div>

                {fam && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{fam.english}</span> · {fam.label}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Tariffs</div>
                    <div className="text-sm font-semibold mt-0.5">{tariffCount}</div>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Coverages</div>
                    <div className="text-sm font-semibold mt-0.5">{coverageCount}</div>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Receipt className="h-3 w-3" /> Models</div>
                    <div className="text-sm font-semibold mt-0.5">{p.paymentModel ? 1 : 0}</div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Currencies</div>
                  <div className="flex flex-wrap gap-1">
                    {p.currencies.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5" /> Created {p.createdDate}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="shadow-card border-border p-12 text-center text-muted-foreground">
          No products match your search.
        </Card>
      )}
    </AppShell>
  );
};

export default ProductsList;
