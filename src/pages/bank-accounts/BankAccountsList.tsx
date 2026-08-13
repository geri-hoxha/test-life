import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
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
import {
  useCreateBankAccount,
  useDeleteBankAccount,
  useListBankAccounts,
  useUpdateBankAccount,
} from "@/api/bank-accounts";
import type { BankAccountsBankAccountResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrencies } from "@/config/currencies";

type FormState = {
  currency: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
};

const emptyForm = (): FormState => ({
  currency: "EUR",
  bankCode: "",
  bankName: "",
  accountNumber: "",
  iban: "",
  swiftCode: "",
});

const formFromAccount = (row: BankAccountsBankAccountResponse): FormState => ({
  currency: row.currency?.trim() || "EUR",
  bankCode: row.bankCode ?? "",
  bankName: row.bankName ?? "",
  accountNumber: row.accountNumber ?? "",
  iban: row.iban ?? "",
  swiftCode: row.swiftCode ?? "",
});

const BankAccountsList = () => {
  const [currency, setCurrency] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountsBankAccountResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<BankAccountsBankAccountResponse | null>(null);

  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const saving = createAccount.isPending || updateAccount.isPending;

  const filters = useMemo(
    () =>
      compactQuery({
        currency: currency.trim() || undefined,
        bankName: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
      }),
    [currency, bankName, iban, swiftCode],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListBankAccounts(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters =
    Boolean(currency.trim()) ||
    Boolean(bankName.trim()) ||
    Boolean(iban.trim()) ||
    Boolean(swiftCode.trim());

  const clearFilters = () => {
    setCurrency("");
    setBankName("");
    setIban("");
    setSwiftCode("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: BankAccountsBankAccountResponse) => {
    setEditing(row);
    setForm(formFromAccount(row));
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
    const bankCode = form.bankCode.trim();
    const bankNameValue = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();
    const ibanValue = form.iban.trim();
    const swift = form.swiftCode.trim();
    const currencyValue = form.currency.trim();

    if (!bankCode) {
      toast.error("Bank code is required");
      return;
    }
    if (!bankNameValue) {
      toast.error("Bank name is required");
      return;
    }
    if (!accountNumber) {
      toast.error("Account number is required");
      return;
    }
    if (!ibanValue) {
      toast.error("IBAN is required");
      return;
    }
    if (!swift) {
      toast.error("SWIFT code is required");
      return;
    }

    if (editing?.id) {
      updateAccount.mutate(
        {
          id: editing.id,
          body: {
            bankCode,
            bankName: bankNameValue,
            accountNumber,
            iban: ibanValue,
            swiftCode: swift,
          },
        },
        {
          onSuccess: () => {
            toast.success("Bank account updated");
            closeDialog();
          },
          onError: (err) => toastApiError(err, "Failed to update bank account"),
        },
      );
      return;
    }

    if (!currencyValue) {
      toast.error("Currency is required");
      return;
    }

    createAccount.mutate(
      {
        currency: currencyValue,
        bankCode,
        bankName: bankNameValue,
        accountNumber,
        iban: ibanValue,
        swiftCode: swift,
      },
      {
        onSuccess: () => {
          toast.success("Bank account created");
          closeDialog();
        },
        onError: (err) => toastApiError(err, "Failed to create bank account"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteAccount.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Bank account deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toastApiError(err, "Failed to delete bank account"),
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Finance
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Bank accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage bank accounts used for product payment methods and offers.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add bank account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Bank accounts</CardTitle>
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
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select
                  value={currency || "__any__"}
                  onValueChange={(v) => setCurrency(v === "__any__" ? "" : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">All currencies</SelectItem>
                    {getCurrencies().map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bank name</Label>
                <Input
                  className="h-9"
                  placeholder="Bank name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">IBAN</Label>
                <Input
                  className="h-9 font-mono"
                  placeholder="IBAN"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">SWIFT code</Label>
                <Input
                  className="h-9 font-mono"
                  placeholder="SWIFT / BIC"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
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
                  <TableHead>Bank name</TableHead>
                  <TableHead>Bank code</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Account number</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>SWIFT</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                      No bank accounts match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? `${row.iban}-${row.accountNumber}`}>
                      <TableCell className="font-medium">{row.bankName ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.bankCode ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.currency ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.accountNumber ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[220px] truncate" title={row.iban}>
                        {row.iban ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.swiftCode ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEdit(row)}
                            title="Edit bank account"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={!row.id}
                            onClick={() => setDeleteTarget(row)}
                            title="Delete bank account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
            <DialogTitle>{editing ? "Edit bank account" : "Add bank account"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update bank details. Currency cannot be changed after creation."
                : "Create a bank account that can be linked to products and offers."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ba-currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setField("currency", v)}
                disabled={Boolean(editing)}
              >
                <SelectTrigger id="ba-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {getCurrencies().map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ba-bank-code">Bank code</Label>
              <Input
                id="ba-bank-code"
                value={form.bankCode}
                onChange={(e) => setField("bankCode", e.target.value)}
                placeholder="e.g. 092"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ba-bank-name">Bank name</Label>
              <Input
                id="ba-bank-name"
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ba-account-number">Account number</Label>
              <Input
                id="ba-account-number"
                className="font-mono"
                value={form.accountNumber}
                onChange={(e) => setField("accountNumber", e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ba-swift">SWIFT code</Label>
              <Input
                id="ba-swift"
                className="font-mono"
                value={form.swiftCode}
                onChange={(e) => setField("swiftCode", e.target.value)}
                placeholder="e.g. NCBAALTX"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ba-iban">IBAN</Label>
              <Input
                id="ba-iban"
                className="font-mono"
                value={form.iban}
                onChange={(e) => setField("iban", e.target.value)}
                placeholder="IBAN"
              />
            </div>
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {deleteTarget?.bankName ? ` “${deleteTarget.bankName}”` : " this bank account"}
              {deleteTarget?.iban ? ` (${deleteTarget.iban})` : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteAccount.isPending} onClick={handleDelete}>
              {deleteAccount.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default BankAccountsList;
