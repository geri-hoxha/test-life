import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Send, MoreHorizontal, Plus, Search } from "lucide-react";
import { listOffers, statusColor, OfferStatus } from "@/data/offers";
import { getCustomer, fullName } from "@/data/customers";
import { seedProducts } from "@/data/products";
import { listTemplates } from "@/data/templates";
import { toast } from "sonner";

const STATUSES: OfferStatus[] = ["Draft", "Quoted", "Pending Review", "Approved", "Issued", "Rejected"];

const OffersList = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const offers = useMemo(() => listOffers(), []);

  const productMap = useMemo(() => Object.fromEntries(seedProducts.map((p) => [p.id, p])), []);

  const templateMap = useMemo(() => {
    const m: Record<string, string> = {};
    seedProducts.forEach((p) => listTemplates(p.id).forEach((t) => (m[t.id] = t.name)));
    return m;
  }, []);

  const filtered = offers.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const ph = getCustomer(o.policyHolderId);
    const haystack = [
      o.number,
      ph ? fullName(ph) : "",
      productMap[o.productId]?.name ?? "",
      templateMap[o.templateId] ?? "",
    ].join(" ").toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = offers.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OfferStatus, number>);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Sales
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Draft policies awaiting quotation, review, or issuance.
          </p>
        </div>
        <Button onClick={() => navigate("/offers/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Offer
        </Button>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-1.5">
              <CardDescription className="text-[11px] uppercase tracking-wider">{s}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-semibold">{counts[s]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">All Offers</CardTitle>
              <CardDescription>{filtered.length} of {offers.length} offers</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search offer, customer, product…"
                  className="pl-8 h-9 w-[260px]"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                      No offers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => {
                    const ph = getCustomer(o.policyHolderId);
                    const product = productMap[o.productId];
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link to={`/offers/${o.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                            {o.number}
                          </Link>
                        </TableCell>
                        <TableCell>{ph ? fullName(ph) : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm">{product?.name ?? o.productId}</TableCell>
                        <TableCell className="text-sm">{templateMap[o.templateId] ?? o.templateId}</TableCell>
                        <TableCell><Badge variant="outline">{o.currency}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {o.premium > 0
                            ? new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency }).format(o.premium)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[o.status]}`}>
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{o.createdDate}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info(`View ${o.number}`)}>
                                <Eye className="h-4 w-4 mr-2" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Edit ${o.number}`)}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toast.success(`${o.number} sent for issuance`)}
                                disabled={o.status === "Issued" || o.status === "Rejected"}
                              >
                                <Send className="h-4 w-4 mr-2" />Issue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default OffersList;
