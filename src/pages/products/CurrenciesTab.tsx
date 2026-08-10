import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Landmark, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useGetProduct,
  useAddProductPaymentMethod,
  useRemoveProductPaymentMethod,
} from "@/api/products";
import { useListBankAccounts } from "@/api/bank-accounts";
import { BankAccountCombobox } from "@/components/BankAccountCombobox";
import type { BankAccountsBankAccountResponse } from "@/api/types";

type CurrencyConfig = {
  bankCode: string;
  bankName: string;
  account: string;
  iban: string;
  swiftCode: string;
};

type CurrencyLink = {
  paymentMethodEntryId?: string;
  bankAccountId?: string;
};

const empty = (): CurrencyConfig => ({
  bankCode: "",
  bankName: "",
  account: "",
  iban: "",
  swiftCode: "",
});

const fromBankAccount = (account?: BankAccountsBankAccountResponse | null): CurrencyConfig => {
  if (!account) return empty();
  return {
    bankCode: account.bankCode ?? "",
    bankName: account.bankName ?? "",
    account: account.accountNumber ?? "",
    iban: account.iban ?? "",
    swiftCode: account.swiftCode ?? "",
  };
};

const CurrenciesTab = ({ productId, currencies }: { productId: string; currencies: string[] }) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: bankAccountsPage, isLoading: accountsLoading } = useListBankAccounts({
    pageNumber: 1,
    pageSize: 200,
  });
  const addPaymentMethod = useAddProductPaymentMethod();
  const removePaymentMethod = useRemoveProductPaymentMethod();

  const bankAccounts = bankAccountsPage?.items ?? [];
  const paymentMethods = apiProduct?.paymentMethods ?? [];

  const accountsById = useMemo(
    () => Object.fromEntries(bankAccounts.map((a) => [a.id ?? "", a])),
    [bankAccounts]
  );

  const linkedBankAccountIds = useMemo(
    () => new Set(paymentMethods.map((pm) => pm.bankAccountId).filter(Boolean)),
    [paymentMethods]
  );

  const linksByCurrency = useMemo(() => {
    const map: Record<string, CurrencyLink> = {};
    for (const pm of paymentMethods) {
      const currency = pm.currency?.trim();
      if (!currency) continue;
      map[currency] = {
        paymentMethodEntryId: pm.id != null ? String(pm.id) : undefined,
        bankAccountId: pm.bankAccountId,
      };
    }
    return map;
  }, [paymentMethods]);

  const linksKey = useMemo(
    () =>
      Object.entries(linksByCurrency)
        .map(([cur, link]) => `${cur}:${link.bankAccountId ?? ""}:${link.paymentMethodEntryId ?? ""}`)
        .sort()
        .join("|"),
    [linksByCurrency]
  );

  const [selectedBankAccountByCurrency, setSelectedBankAccountByCurrency] = useState<
    Record<string, string>
  >({});
  const [savingCurrency, setSavingCurrency] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    currencies.forEach((c) => {
      next[c] = linksByCurrency[c]?.bankAccountId ?? "";
    });
    setSelectedBankAccountByCurrency(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- linksKey fingerprints payment method links
  }, [productId, currencies.join(","), linksKey]);

  const clear = async (cur: string) => {
    const link = linksByCurrency[cur];
    setSavingCurrency(cur);
    try {
      if (link?.paymentMethodEntryId) {
        await removePaymentMethod.mutateAsync({
          productId,
          paymentMethodEntryId: link.paymentMethodEntryId,
        });
      }
      setSelectedBankAccountByCurrency((prev) => ({ ...prev, [cur]: "" }));
      toast.success(`${cur} bank account cleared`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to clear ${cur}`);
    } finally {
      setSavingCurrency(null);
    }
  };

  const saveBankAccount = async (cur: string) => {
    const link = linksByCurrency[cur];
    const nextBankAccountId = selectedBankAccountByCurrency[cur]?.trim() ?? "";
    const currentBankAccountId = link?.bankAccountId ?? "";

    if (!nextBankAccountId) {
      toast.error("Select a bank account");
      return;
    }
    if (nextBankAccountId === currentBankAccountId) {
      toast.message(`No changes for ${cur}`);
      return;
    }

    setSavingCurrency(cur);
    try {
      if (link?.paymentMethodEntryId) {
        await removePaymentMethod.mutateAsync({
          productId,
          paymentMethodEntryId: link.paymentMethodEntryId,
        });
      }
      await addPaymentMethod.mutateAsync({
        productId,
        body: { bankAccountId: nextBankAccountId },
      });
      toast.success(`${cur} bank account saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to save ${cur}`);
    } finally {
      setSavingCurrency(null);
    }
  };

  const addBank = async (cur: string) => {
    const bankAccountId = selectedBankAccountByCurrency[cur]?.trim();
    if (!bankAccountId) {
      toast.error("Select a bank account to link");
      return;
    }

    setSavingCurrency(cur);
    try {
      await addPaymentMethod.mutateAsync({
        productId,
        body: { bankAccountId },
      });
      toast.success(`${cur} payment method added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to add payment method for ${cur}`);
    } finally {
      setSavingCurrency(null);
    }
  };

  if (productLoading || accountsLoading) {
    return (
      <Card className="p-10 text-center shadow-card border-border">
        <p className="text-sm text-muted-foreground">Loading currency bank configurations…</p>
      </Card>
    );
  }

  if (currencies.length === 0) {
    return (
      <Card className="p-10 text-center shadow-card border-border">
        <p className="text-sm text-muted-foreground">
          This product has no currencies. Add currencies in the Overview tab to configure bank details.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {currencies.map((cur) => {
        const link = linksByCurrency[cur];
        const linked = Boolean(link?.bankAccountId);
        const selectedId = selectedBankAccountByCurrency[cur] ?? "";
        const previewAccount = selectedId ? accountsById[selectedId] : undefined;
        const cfg = fromBankAccount(previewAccount);
        const busy = savingCurrency === cur;
        const dirty = linked && selectedId !== (link?.bankAccountId ?? "");

        const availableAccounts = bankAccounts.filter((a) => {
          if (!a.id) return false;
          if (a.id === link?.bankAccountId) return true;
          if (linkedBankAccountIds.has(a.id)) return false;
          if (!a.currency) return true;
          return a.currency === cur;
        });

        return (
          <Card key={cur} className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-accent-soft text-accent-soft-foreground flex items-center justify-center">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Bank configuration - </h3>
                    <span className="text-accent font-semibold bg-accent/20 px-1 rounded-sm text-sm">{cur}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {linked
                      ? `Collection account used for policies denominated in ${cur}.`
                      : `No bank linked for ${cur}. Add a payment method to configure details.`}
                  </p>
                </div>
              </div>
              {linked && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void clear(cur)}
                    disabled={busy}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void saveBankAccount(cur)}
                    disabled={busy || !dirty}
                    className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>Bank account</Label>
                <BankAccountCombobox
                  accounts={availableAccounts}
                  value={selectedId}
                  onValueChange={(bankAccountId) =>
                    setSelectedBankAccountByCurrency((prev) => ({ ...prev, [cur]: bankAccountId }))
                  }
                  placeholder={`Select ${cur} bank account…`}
                  disabled={busy}
                />
              </div>

              {linked ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor={`${cur}-bankcode`}>F5 Bank Code</Label>
                    <Input
                      id={`${cur}-bankcode`}
                      value={cfg.bankCode}
                      readOnly
                      className="font-mono bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${cur}-bankname`}>F5 Bank Name</Label>
                    <Input
                      id={`${cur}-bankname`}
                      value={cfg.bankName}
                      readOnly
                      className="bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${cur}-account`}>F5 Account</Label>
                    <Input
                      id={`${cur}-account`}
                      value={cfg.account}
                      readOnly
                      className="font-mono bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${cur}-swift`}>F5 SWIFT Code</Label>
                    <Input
                      id={`${cur}-swift`}
                      value={cfg.swiftCode}
                      readOnly
                      className="font-mono bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${cur}-iban`}>F5 IBAN</Label>
                    <Input
                      id={`${cur}-iban`}
                      value={cfg.iban}
                      readOnly
                      className="font-mono bg-muted/40"
                    />
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => void addBank(cur)}
                  disabled={busy || !selectedId}
                  className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Add payment method"}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CurrenciesTab;
