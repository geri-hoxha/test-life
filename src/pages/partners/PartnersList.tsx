import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreatePartner, useListPartners, useUpdatePartner } from "@/api/partners";
import type { PartnersPartnerResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

type ActiveFilter = "all" | "active" | "inactive";

type FormState = {
  name: string;
  createApiAccount: boolean;
  username: string;
  email: string;
  password: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  createApiAccount: false,
  username: "",
  email: "",
  password: "",
  isActive: true,
});

const formFromPartner = (row: PartnersPartnerResponse): FormState => ({
  name: row.name ?? "",
  createApiAccount: false,
  username: "",
  email: "",
  password: "",
  isActive: row.isActive ?? true,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PartnersList = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnersPartnerResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const saving = createPartner.isPending || updatePartner.isPending;

  const filters = useMemo(
    () =>
      compactQuery({
        ...(activeFilter === "all" ? {} : { isActive: activeFilter === "active" }),
      }),
    [activeFilter],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListPartners(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters = activeFilter !== "all";

  const clearFilters = () => {
    setActiveFilter("all");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: PartnersPartnerResponse) => {
    setEditing(row);
    setForm(formFromPartner(row));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    if (editing?.id) {
      updatePartner.mutate(
        {
          partnerId: editing.id,
          body: {
            name,
            isActive: form.isActive,
          },
        },
        {
          onSuccess: () => {
            toast.success("Partner updated");
            closeDialog();
          },
          onError: (err) => toastApiError(err, "Failed to update partner"),
        },
      );
      return;
    }

    let apiAccount: { username: string; email: string; password: string } | undefined;
    if (form.createApiAccount) {
      const username = form.username.trim();
      const email = form.email.trim();
      const password = form.password;
      if (!username) {
        toast.error("Username is required");
        return;
      }
      if (!email || !EMAIL_RE.test(email)) {
        toast.error("A valid email is required");
        return;
      }
      if (password.length < 12) {
        toast.error("Password must be at least 12 characters");
        return;
      }
      apiAccount = { username, email, password };
    }

    createPartner.mutate(
      { name, apiAccount },
      {
        onSuccess: () => {
          toast.success("Partner created");
          closeDialog();
        },
        onError: (err) => toastApiError(err, "Failed to create partner"),
      },
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Distribution
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage distribution partners, product authorizations, and commission rules.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add partner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Partners</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading…"
                    : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
                </CardDescription>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={activeFilter}
                  onValueChange={(v) => setActiveFilter(v as ActiveFilter)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fiscal TCR</TableHead>
                  <TableHead>Fiscal operator</TableHead>
                  <TableHead>API user</TableHead>
                  <TableHead className="w-[96px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={6} />
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      No partners match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? row.name}>
                      <TableCell className="font-medium">
                        {row.id ? (
                          <Link to={`/partners/${row.id}`} className="hover:underline">
                            {row.name?.trim() || row.id}
                          </Link>
                        ) : (
                          (row.name?.trim() || "—")
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.isActive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          }
                        >
                          {row.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.fiscTcr?.trim() || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.fiscOperatorCode?.trim() || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.apiAuthUserId != null ? String(row.apiAuthUserId) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => row.id && navigate(`/partners/${row.id}`)}
                            title="View partner"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEdit(row)}
                            title="Edit partner"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit partner" : "Add partner"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the partner profile. API credentials cannot be changed here."
                : "Create a distribution partner. An optional API login can be attached at creation."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="partner-name">Name</Label>
              <Input
                id="partner-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Partner name"
              />
            </div>
            {!editing && (
              <>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:col-span-2">
                  <div>
                    <Label htmlFor="partner-api-account">Create API account</Label>
                    <p className="text-xs text-muted-foreground">Optional login used by this partner’s API integration.</p>
                  </div>
                  <Switch
                    id="partner-api-account"
                    checked={form.createApiAccount}
                    onCheckedChange={(checked) => setField("createApiAccount", checked)}
                  />
                </div>
                {form.createApiAccount && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="partner-username">Username</Label>
                      <Input
                        id="partner-username"
                        value={form.username}
                        onChange={(e) => setField("username", e.target.value)}
                        placeholder="username"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="partner-email">Email</Label>
                      <Input
                        id="partner-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="partner@example.com"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="partner-password">Password</Label>
                      <Input
                        id="partner-password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        placeholder="At least 12 characters"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            {editing && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:col-span-2">
                <div>
                  <Label htmlFor="partner-active">Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive partners cannot be used for new sales.</p>
                </div>
                <Switch
                  id="partner-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setField("isActive", checked)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default PartnersList;
