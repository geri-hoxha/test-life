import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Settings2, Filter } from "lucide-react";
import { listProducts, ProductStatus } from "@/data/products";

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const ProductsList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const products = listProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products" }]}
        title="Products"
        description="Manage life-insurance products, versions and configuration."
        actions={
          <>
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

      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="text-xs text-muted-foreground">{products.length} product(s)</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Product Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Code</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Currencies</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Active Version</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Created</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} className="hover:bg-accent-soft/40 cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs text-accent">{p.code}</TableCell>
                <TableCell>
                  <Badge className={`font-medium border-0 ${statusClass[p.status]}`}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.currencies.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.activeVersion}</TableCell>
                <TableCell className="text-muted-foreground">{p.createdDate}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to={`/products/${p.id}`}><Eye className="h-3.5 w-3.5 mr-1" /> View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
};

export default ProductsList;
