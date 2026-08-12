import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { useGetProduct } from "@/api/products";
import { useListBankAccounts } from "@/api/bank-accounts";
import type { BankAccountsBankAccountResponse } from "@/api/types";

const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="min-w-0">
    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className={`text-sm text-foreground truncate mt-0.5 ${mono ? "font-mono" : ""}`}>
      {value || "—"}
    </div>
  </div>
);

const CurrenciesTab = ({ productId, currencies }: { productId: string; currencies: string[] }) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: bankAccountsPage, isLoading: accountsLoading } = useListBankAccounts({
    pageNumber: 1,
    pageSize: 200,
  });

  const accountsById = useMemo(
    () =>
      Object.fromEntries(
        (bankAccountsPage?.items ?? []).map((a) => [a.id ?? "", a])
      ) as Record<string, BankAccountsBankAccountResponse>,
    [bankAccountsPage?.items]
  );

  const accountByCurrency = useMemo(() => {
    const map: Record<string, BankAccountsBankAccountResponse | undefined> = {};
    for (const pm of apiProduct?.paymentMethods ?? []) {
      const currency = pm.currency?.trim();
      if (!currency || !pm.bankAccountId) continue;
      map[currency] = accountsById[pm.bankAccountId];
    }
    return map;
  }, [apiProduct?.paymentMethods, accountsById]);

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
    <div className="space-y-4">
      {currencies.map((cur) => {
        const account = accountByCurrency[cur];
        const linked = Boolean(account);

        return (
          <Card key={cur} className="shadow-card border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
              <div className="h-8 w-8 rounded-md bg-accent-soft text-accent-soft-foreground flex items-center justify-center shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Bank configuration</h3>
                  <span className="text-accent font-semibold bg-accent/20 px-1 rounded-sm text-sm">
                    {cur}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {linked
                    ? `Collection account used for policies denominated in ${cur}.`
                    : `No bank account linked for ${cur}.`}
                </p>
              </div>
            </div>

            {linked ? (
              <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
                <Field label="F5 Bank Code" value={account?.bankCode ?? ""} mono />
                <Field label="F5 Bank Name" value={account?.bankName ?? ""} />
                <Field label="F5 Account" value={account?.accountNumber ?? ""} mono />
                <Field label="F5 SWIFT Code" value={account?.swiftCode ?? ""} mono />
                <Field label="F5 IBAN" value={account?.iban ?? ""} mono />
              </div>
            ) : (
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  No bank details available for this currency.
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default CurrenciesTab;
