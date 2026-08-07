import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
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
import { Eye, Search, ShieldCheck } from "lucide-react";
import { policyStatusColor, PolicyStatus, type Policy } from "@/data/policies";
import { useListPolicies } from "@/api/policies";
import { mapApiPolicy } from "@/api/adapters/policies";
import { useListProducts, mapApiProduct } from "@/api/products";

const STATUSES: PolicyStatus[] = ["Active", "Pending Payment", "Cancelled", "Expired", "Lapsed"];

const insuredName = (p: Policy) => {
  const person = p.insuredPersons[0];
  if (!person) return null;
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  return name || person.personalIdentifier || null;
};

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

const PoliciesList = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, pageSize]);

  const { data: policiesPage, isLoading, isFetching } = useListPolicies({
    pageNumber: page,
    pageSize,
  });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });

  const policies = useMemo(
    () => (policiesPage?.items ?? []).map(mapApiPolicy),
    [policiesPage?.items]
  );

  const productMap = useMemo(
    () => Object.fromEntries((productsPage?.items ?? []).map(mapApiProduct).map((p) => [p.id, p])),
    [productsPage?.items]
  );

  // Status + search filter the current server page only (API has no those params).
  const rows = useMemo(() => {
    return policies.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const holder = p.participants.find((x) => x.role === "policyHolder");
      const haystack = [
        p.id,
        holder?.displayName ?? "",
        holder?.uniqueIdentifier ?? "",
        insuredName(p) ?? "",
        productMap[p.productId]?.name ?? "",
        p.productId,
        p.currency,
        p.status,
        p.offerId,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
  }, [policies, productMap, q, statusFilter]);

  const totalCount = policiesPage?.totalCount ?? 0;
  const totalPages = Math.max(1, policiesPage?.totalPages ?? policiesPage?.pageCount ?? 1);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = policies.filter((p) => p.status === s).length;
    return acc;
  }, {} as Record<PolicyStatus, number>);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Operations</div>
          <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issued life insurance policies in force.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-1.5"><CardDescription className="text-[11px] uppercase tracking-wider">{s}</CardDescription></CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-semibold">{counts[s]}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">this page</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> All Policies</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading…"
                  : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search this page…"
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
                  <TableHead>Policy #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Insured</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-sm text-muted-foreground">
                      Loading policies…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-sm text-muted-foreground">
                      No policies match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => {
                    const holderParticipant = p.participants.find((x) => x.role === "policyHolder");
                    const holder = holderParticipant?.displayName?.trim() || null;
                    const insured = insuredName(p);
                    const product = productMap[p.productId];
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            to={`/policies/${p.id}`}
                            className="font-mono text-xs font-medium text-primary hover:underline"
                            title={p.id}
                          >
                            {shortId(p.id)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {holder ? (
                            <div className="min-w-0">
                              <div className="text-sm truncate">{holder}</div>
                              {holderParticipant?.uniqueIdentifier && (
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {holderParticipant.uniqueIdentifier}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {insured ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{product?.name ?? p.productId}</TableCell>
                        <TableCell><Badge variant="outline">{p.currency}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: p.currency,
                          }).format(p.premium)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${policyStatusColor[p.status]}`}>
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{p.issueDate}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {p.startDate}
                          {p.endDate ? ` → ${p.endDate}` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => navigate(`/policies/${p.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default PoliciesList;
