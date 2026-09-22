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
import AccessDeniedNotice from "@/components/AccessDeniedNotice";
import { useCreateAgent, useListAgents, useUpdateAgent } from "@/api/agents";
import type { AgentsAgentResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isApiForbidden, toastApiError } from "@/lib/api-error";
import { Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

type ActiveFilter = "all" | "active" | "inactive";

type FormState = {
  displayName: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  displayName: "",
  isActive: true,
});

const formFromAgent = (row: AgentsAgentResponse): FormState => ({
  displayName: row.displayName ?? "",
  isActive: row.isActive ?? true,
});

const AgentsList = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgentsAgentResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const saving = createAgent.isPending || updateAgent.isPending;

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
  const { data: pageData, isLoading, isFetching, isError, error } = useListAgents(listQuery);
  const accessDenied = isApiForbidden(error);

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

  const openEdit = (row: AgentsAgentResponse) => {
    setEditing(row);
    setForm(formFromAgent(row));
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

    if (editing?.id) {
      updateAgent.mutate(
        {
          agentId: editing.id,
          body: {
            displayName,
            isActive: form.isActive,
          },
        },
        {
          onSuccess: () => {
            toast.success("Agent updated");
            closeDialog();
          },
          onError: (err) => toastApiError(err, "Failed to update agent"),
        },
      );
      return;
    }

    createAgent.mutate(
      { displayName },
      {
        onSuccess: () => {
          toast.success("Agent created");
          closeDialog();
        },
        onError: (err) => toastApiError(err, "Failed to create agent"),
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
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage selling agents and their product commission configurations.
          </p>
        </div>
        {!accessDenied && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add agent
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
                <CardTitle className="text-base">Agents</CardTitle>
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
                  <TableHead>Display name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[96px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingRow colSpan={3} />
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-sm text-muted-foreground">
                      Agents could not be loaded.
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-sm text-muted-foreground">
                      No agents match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? row.displayName}>
                      <TableCell className="font-medium">
                        {row.id ? (
                          <Link to={`/agents/${row.id}`} className="hover:underline">
                            {row.displayName?.trim() || row.id}
                          </Link>
                        ) : (
                          (row.displayName?.trim() || "—")
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => row.id && navigate(`/agents/${row.id}`)}
                            title="View agent"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEdit(row)}
                            title="Edit agent"
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
            <DialogTitle>{editing ? "Edit agent" : "Add agent"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the agent name and status."
                : "Create an agent. Product configurations can be added after creation."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="agent-display-name">Display name</Label>
              <Input
                id="agent-display-name"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                placeholder="Agent name"
              />
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label htmlFor="agent-active">Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive agents cannot be used for new sales.</p>
                </div>
                <Switch
                  id="agent-active"
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

export default AgentsList;
