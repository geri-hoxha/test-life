import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CurrencyConfig = {
  bankCode: string;
  bankName: string;
  account: string;
  iban: string;
  swiftCode: string;
};

const empty = (): CurrencyConfig => ({ bankCode: "", bankName: "", account: "", iban: "", swiftCode: "" });

const CurrenciesTab = ({ productId, currencies }: { productId: string; currencies: string[] }) => {
  const [configs, setConfigs] = useState<Record<string, CurrencyConfig>>({});

  useEffect(() => {
    setConfigs((prev) => {
      const next: Record<string, CurrencyConfig> = {};
      currencies.forEach((c) => {
        next[c] = prev[c] ?? empty();
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, currencies.join(",")]);

  const update = (cur: string, key: keyof CurrencyConfig, value: string) =>
    setConfigs((prev) => ({ ...prev, [cur]: { ...(prev[cur] ?? empty()), [key]: value } }));

  const clear = (cur: string) => {
    setConfigs((prev) => ({ ...prev, [cur]: empty() }));
    toast.success(`${cur} bank configuration cleared`);
  };

  const save = (cur: string) => toast.success(`${cur} bank configuration saved`);

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
        const cfg = configs[cur] ?? empty();
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
                    Collection account used for policies denominated in {cur}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => clear(cur)} className="gap-2">
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
                <Button size="sm" onClick={() => save(cur)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor={`${cur}-bankcode`}>F5 Bank Code</Label>
                <Input id={`${cur}-bankcode`} value={cfg.bankCode} onChange={(e) => update(cur, "bankCode", e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${cur}-bankname`}>F5 Bank Name</Label>
                <Input id={`${cur}-bankname`} value={cfg.bankName} onChange={(e) => update(cur, "bankName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${cur}-account`}>F5 Account</Label>
                <Input id={`${cur}-account`} value={cfg.account} onChange={(e) => update(cur, "account", e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${cur}-swift`}>F5 SWIFT Code</Label>
                <Input id={`${cur}-swift`} value={cfg.swiftCode} onChange={(e) => update(cur, "swiftCode", e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${cur}-iban`}>F5 IBAN</Label>
                <Input id={`${cur}-iban`} value={cfg.iban} onChange={(e) => update(cur, "iban", e.target.value)} className="font-mono" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CurrenciesTab;
