import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { TableLoadingRow } from "@/components/Loader";
import TablePagination from "@/components/TablePagination";
import AccessDeniedNotice from "@/components/AccessDeniedNotice";
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
import { useCreateUser, useListUsers, useUpdateUser } from "@/api/users";
import type { UsersUserResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isApiForbidden, toastApiError } from "@/lib/api-error";
import { Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { RoleField } from "./RoleField";

type ActiveFilter = "all" | "active" | "inactive";

type FormState = {
  username: string;
  email: string;
  password: string;
  displayName: string;
  isActive: boolean;
  roles: string[];
};

const emptyForm = (): FormState => ({
  username: "",
  email: "",
  password: "",
  displayName: "",
  isActive: true,
  roles: [],
});

const formFromUser = (row: UsersUserResponse): FormState => ({
  username: row.userName ?? "",
  email: row.email ?? "",
  password: "",
  displayName: row.displayName ?? "",
  isActive: row.isActive ?? true,
  roles: row.roles ?? [],
});

const emailLooksValid = (value: string) => /^[^@]+@[^@]+$/.test(value.trim());

const UsersList = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UsersUserResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const saving = createUser.isPending || updateUser.isPending;

  const filters = useMemo(
    () =>
      compactQuery({
        ...(activeFilter === "all" ? {} : { isActive: activeFilter === "active" }),
        role: roleFilter.trim() || undefined,
      }),
    [activeFilter, roleFilter],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching, isError, error } = useListUsers(listQuery);
  const accessDenied = isApiForbidden(error);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);
  const hasFilters = activeFilter !== "all" || roleFilter.trim().length > 0;

  const clearFilters = () => {
    setActiveFilter("all");
    setRoleFilter("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: UsersUserResponse) => {
    setEditing(row);
    setForm(formFromUser(row));
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
    const displayName = form.displayName.trim();
    if (!displayName) {
      toast.error("Display name is required");
      return;
    }
    if (form.roles.length === 0) {
      toast.error("At least one role is required");
      return;
    }

    if (editing?.id != null) {
      updateUser.mutate(
        {
          authUserId: editing.id,
          body: {
            displayName,
            isActive: form.isActive,
            roles: form.roles,
          },
        },
        {
          onSuccess: () => {
            toast.success("User updated");
            closeDialog();
          },
          onError: (err) => toastApiError(err, "Failed to update user"),
        },
      );
      return;
    }

    const username = form.username.trim();
    const email = form.email.trim();
    if (!username) {
      toast.error("Username is required");
      return;
    }
    if (!emailLooksValid(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (form.password.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    createUser.mutate(
      {
        username,
        email,
        password: form.password,
        displayName,
        roles: form.roles,
      },
      {
        onSuccess: () => {
          toast.success("User created");
          closeDialog();
        },
        onError: (err) => toastApiError(err, "Failed to create user"),
      },
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create accounts and manage roles and sales access.
          </p>
        </div>
        {!accessDenied && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        )}
      </div>

      {accessDenied ? (
        <AccessDeniedNotice />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Users</CardTitle>
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
                <div className="space-y-1.5">
                  <Label htmlFor="user-role-filter" className="text-xs text-muted-foreground">
                    Role
                  </Label>
                  <Input
                    id="user-role-filter"
                    className="h-9"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    placeholder="Filter by role"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[96px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableLoadingRow colSpan={6} />
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                        Users could not be loaded.
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.id ?? row.publicId ?? row.userName}>
                        <TableCell className="font-medium">
                          {row.id != null ? (
                            <Link to={`/administration/users/${row.id}`} className="hover:underline">
                              {row.displayName?.trim() || row.userName || String(row.id)}
                            </Link>
                          ) : (
                            row.displayName?.trim() || "—"
                          )}
                        </TableCell>
                        <TableCell>{row.userName?.trim() || "—"}</TableCell>
                        <TableCell>{row.email?.trim() || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(row.roles ?? []).length === 0
                              ? "—"
                              : (row.roles ?? []).map((role) => (
                                  <Badge key={role} variant="secondary">
                                    {role}
                                  </Badge>
                                ))}
                          </div>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={row.id == null}
                              onClick={() => row.id != null && navigate(`/administration/users/${row.id}`)}
                              title="View user"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={row.id == null}
                              onClick={() => openEdit(row)}
                              title="Edit user"
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
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the display name, roles, and status."
                : "Create a user account. Sales access can be granted after creation."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editing && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">At least 12 characters.</p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="user-display-name">Display name</Label>
              <Input
                id="user-display-name"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
              />
            </div>
            <RoleField
              roles={form.roles}
              onChange={(roles) => setField("roles", roles)}
              disabled={saving}
            />
            {editing && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="user-active">Active</Label>
                <Switch
                  id="user-active"
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

export default UsersList;
