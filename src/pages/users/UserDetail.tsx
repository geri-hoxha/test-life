import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader, TableLoadingRow } from "@/components/Loader";
import AccessDeniedNotice from "@/components/AccessDeniedNotice";
import { AgentCombobox } from "@/components/AgentCombobox";
import { PartnerCombobox } from "@/components/PartnerCombobox";
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
import { useGetPartner, useListPartnerOffices } from "@/api/partners";
import {
  useGetUser,
  useGetUserSalesAccess,
  useGrantUserAgentAccess,
  useGrantUserAllAgentsAccess,
  useGrantUserAllPartnerOfficesAccess,
  useGrantUserPartnerOfficeAccess,
  useRevokeUserAgentAccess,
  useRevokeUserPartnerOfficeAccess,
  useUpdateUser,
} from "@/api/users";
import { isApiForbidden, toastApiError } from "@/lib/api-error";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleField } from "./RoleField";

const ActiveBadge = ({ active }: { active?: boolean }) => (
  <Badge
    variant="outline"
    className={
      active
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
    }
  >
    {active ? "Active" : "Inactive"}
  </Badge>
);

type EditState = {
  displayName: string;
  isActive: boolean;
  roles: string[];
};

type ConfirmAction =
  | { kind: "revoke-agent"; agentId: string; label: string }
  | { kind: "revoke-office"; partnerOfficeId: string; label: string }
  | { kind: "grant-all-agents" }
  | { kind: "grant-all-offices"; partnerId: string; label: string };

const UserDetail = () => {
  const { authUserId: authUserIdParam } = useParams();
  const authUserId = Number(authUserIdParam);
  const idValid = Number.isFinite(authUserId) && authUserId > 0;

  const userQuery = useGetUser(authUserId, { enabled: idValid });
  const accessQuery = useGetUserSalesAccess(authUserId, { enabled: idValid && Boolean(userQuery.data) });

  const updateUser = useUpdateUser();
  const grantAgent = useGrantUserAgentAccess();
  const revokeAgent = useRevokeUserAgentAccess();
  const grantAllAgents = useGrantUserAllAgentsAccess();
  const grantOffice = useGrantUserPartnerOfficeAccess();
  const revokeOffice = useRevokeUserPartnerOfficeAccess();
  const grantAllOffices = useGrantUserAllPartnerOfficesAccess();

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>({ displayName: "", isActive: true, roles: [] });
  const [agentId, setAgentId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const officesQuery = useListPartnerOffices(
    partnerId,
    { isActive: true },
    { enabled: Boolean(partnerId) },
  );
  const partnerQuery = useGetPartner(partnerId, { enabled: Boolean(partnerId) });

  const user = userQuery.data;
  const access = accessQuery.data;
  const agents = access?.agents ?? [];
  const offices = access?.partnerOffices ?? [];
  const partnerOffices = officesQuery.data ?? [];

  const accessDenied = isApiForbidden(userQuery.error);
  const salesAccessDenied = isApiForbidden(accessQuery.error);
  const mutating =
    grantAgent.isPending ||
    revokeAgent.isPending ||
    grantAllAgents.isPending ||
    grantOffice.isPending ||
    revokeOffice.isPending ||
    grantAllOffices.isPending;

  const grantedAgentIds = useMemo(
    () => new Set(agents.map((agent) => agent.agentId).filter(Boolean)),
    [agents],
  );
  const grantedOfficeIds = useMemo(
    () => new Set(offices.map((office) => office.partnerOfficeId).filter(Boolean)),
    [offices],
  );

  const openEdit = () => {
    if (!user) return;
    setEdit({
      displayName: user.displayName ?? "",
      isActive: user.isActive ?? true,
      roles: user.roles ?? [],
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    const displayName = edit.displayName.trim();
    if (!displayName) {
      toast.error("Display name is required");
      return;
    }
    if (edit.roles.length === 0) {
      toast.error("At least one role is required");
      return;
    }
    updateUser.mutate(
      {
        authUserId,
        body: {
          displayName,
          isActive: edit.isActive,
          roles: edit.roles,
        },
      },
      {
        onSuccess: () => {
          toast.success("User updated");
          setEditOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to update user"),
      },
    );
  };

  const runConfirm = () => {
    if (!confirm) return;
    const onError = (err: unknown) => toastApiError(err, "Sales access could not be updated");
    if (confirm.kind === "revoke-agent") {
      revokeAgent.mutate(
        { authUserId, agentId: confirm.agentId },
        {
          onSuccess: () => {
            toast.success("Agent access revoked");
            setConfirm(null);
          },
          onError,
        },
      );
      return;
    }
    if (confirm.kind === "revoke-office") {
      revokeOffice.mutate(
        { authUserId, partnerOfficeId: confirm.partnerOfficeId },
        {
          onSuccess: () => {
            toast.success("Partner office access revoked");
            setConfirm(null);
          },
          onError,
        },
      );
      return;
    }
    if (confirm.kind === "grant-all-agents") {
      grantAllAgents.mutate(authUserId, {
        onSuccess: () => {
          toast.success("Access granted for all agents");
          setConfirm(null);
        },
        onError,
      });
      return;
    }
    grantAllOffices.mutate(
      { authUserId, partnerId: confirm.partnerId },
      {
        onSuccess: () => {
          toast.success("Access granted for all partner offices");
          setConfirm(null);
          setOfficeId("");
        },
        onError,
      },
    );
  };

  const grantSelectedAgent = () => {
    if (!agentId) return;
    if (grantedAgentIds.has(agentId)) {
      toast.error("This agent is already granted");
      return;
    }
    grantAgent.mutate(
      { authUserId, agentId },
      {
        onSuccess: () => {
          toast.success("Agent access granted");
          setAgentId("");
        },
        onError: (err) => toastApiError(err, "Failed to grant agent access"),
      },
    );
  };

  const grantSelectedOffice = () => {
    if (!officeId) return;
    if (grantedOfficeIds.has(officeId)) {
      toast.error("This office is already granted");
      return;
    }
    grantOffice.mutate(
      { authUserId, partnerOfficeId: officeId },
      {
        onSuccess: () => {
          toast.success("Partner office access granted");
          setOfficeId("");
        },
        onError: (err) => toastApiError(err, "Failed to grant partner office access"),
      },
    );
  };

  if (!idValid) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">This user id is not valid.</p>
      </AppShell>
    );
  }

  if (userQuery.isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (accessDenied) {
    return (
      <AppShell>
        <AccessDeniedNotice />
      </AppShell>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <AppShell>
        <Button variant="ghost" size="sm" className="mb-4 gap-2" asChild>
          <Link to="/administration/users">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">This user could not be loaded.</p>
      </AppShell>
    );
  }

  const confirmTitle =
    confirm?.kind === "revoke-agent"
      ? "Revoke agent access"
      : confirm?.kind === "revoke-office"
        ? "Revoke partner office access"
        : confirm?.kind === "grant-all-agents"
          ? "Grant all agents"
          : confirm?.kind === "grant-all-offices"
            ? "Grant all offices"
            : "";

  const confirmDescription =
    confirm?.kind === "revoke-agent"
      ? `Remove access to ${confirm.label}?`
      : confirm?.kind === "revoke-office"
        ? `Remove access to ${confirm.label}?`
        : confirm?.kind === "grant-all-agents"
          ? "Grant this user access to every agent?"
          : confirm?.kind === "grant-all-offices"
            ? `Grant this user access to every office of ${confirm.label}?`
            : "";

  return (
    <AppShell>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" asChild>
        <Link to="/administration/users">
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.displayName?.trim() || user.userName || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{user.userName}</p>
        </div>
        <Button className="gap-2" onClick={openEdit}>
          <Pencil className="h-4 w-4" />
          Edit user
        </Button>
      </div>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Identity returned by the users list.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm">{user.email?.trim() || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <ActiveBadge active={user.isActive} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Roles</div>
              <div className="flex flex-wrap gap-1">
                {(user.roles ?? []).length === 0
                  ? "—"
                  : (user.roles ?? []).map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {salesAccessDenied ? (
          <AccessDeniedNotice />
        ) : (
        <>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-base">Agent access</CardTitle>
                <CardDescription>
                  {access?.mayChooseAgent
                    ? "This user may choose an agent when selling."
                    : "Agent choice is limited to the grants below."}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                disabled={mutating}
                onClick={() => setConfirm({ kind: "grant-all-agents" })}
              >
                Grant all agents
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>Agent</Label>
                <AgentCombobox value={agentId} onValueChange={setAgentId} />
              </div>
              <Button onClick={grantSelectedAgent} disabled={!agentId || mutating}>
                Grant agent
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[72px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessQuery.isLoading ? (
                    <TableLoadingRow colSpan={3} />
                  ) : accessQuery.isError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        Sales access could not be loaded.
                      </TableCell>
                    </TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        No agents granted.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow key={agent.agentId ?? agent.displayName}>
                        <TableCell className="font-medium">{agent.displayName?.trim() || agent.agentId}</TableCell>
                        <TableCell>
                          <ActiveBadge active={agent.isActive} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={!agent.agentId || mutating}
                            title="Revoke agent access"
                            onClick={() =>
                              agent.agentId &&
                              setConfirm({
                                kind: "revoke-agent",
                                agentId: agent.agentId,
                                label: agent.displayName?.trim() || agent.agentId,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partner office access</CardTitle>
            <CardDescription>Grant one office, or every office of a partner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
              <div className="space-y-1.5">
                <Label>Partner</Label>
                <PartnerCombobox
                  value={partnerId}
                  onValueChange={(id) => {
                    setPartnerId(id);
                    setOfficeId("");
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Office</Label>
                <Select
                  value={officeId || undefined}
                  onValueChange={setOfficeId}
                  disabled={!partnerId || officesQuery.isLoading || partnerOffices.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !partnerId
                          ? "Select a partner first"
                          : officesQuery.isLoading
                            ? "Loading offices…"
                            : partnerOffices.length === 0
                              ? "No offices"
                              : "Select office"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerOffices.map((office) => {
                      const id = office.id ?? "";
                      if (!id) return null;
                      const label = [office.code, office.name].filter(Boolean).join(" · ") || id;
                      return (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={grantSelectedOffice} disabled={!officeId || mutating}>
                Grant office
              </Button>
              <Button
                variant="outline"
                disabled={!partnerId || mutating}
                onClick={() =>
                  setConfirm({
                    kind: "grant-all-offices",
                    partnerId,
                    label: partnerQuery.data?.name?.trim() || "this partner",
                  })
                }
              >
                Grant all offices
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[72px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessQuery.isLoading ? (
                    <TableLoadingRow colSpan={4} />
                  ) : offices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        No partner offices granted.
                      </TableCell>
                    </TableRow>
                  ) : (
                    offices.map((office) => {
                      const label = [office.officeCode, office.officeName].filter(Boolean).join(" · ");
                      return (
                        <TableRow key={office.partnerOfficeId ?? label}>
                          <TableCell>{office.partnerName?.trim() || "—"}</TableCell>
                          <TableCell className="font-medium">{label || office.partnerOfficeId}</TableCell>
                          <TableCell>
                            <ActiveBadge active={office.isActive} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              disabled={!office.partnerOfficeId || mutating}
                              title="Revoke partner office access"
                              onClick={() =>
                                office.partnerOfficeId &&
                                setConfirm({
                                  kind: "revoke-office",
                                  partnerOfficeId: office.partnerOfficeId,
                                  label: label || office.partnerOfficeId,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
        </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update the display name, roles, and status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="detail-display-name">Display name</Label>
              <Input
                id="detail-display-name"
                value={edit.displayName}
                onChange={(e) => setEdit((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <RoleField
              id="detail-roles"
              roles={edit.roles}
              onChange={(roles) => setEdit((prev) => ({ ...prev, roles }))}
              disabled={updateUser.isPending}
            />
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="detail-active">Active</Label>
              <Switch
                id="detail-active"
                checked={edit.isActive}
                onCheckedChange={(checked) => setEdit((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updateUser.isPending}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm != null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm} disabled={mutating}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default UserDetail;
