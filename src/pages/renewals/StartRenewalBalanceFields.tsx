import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  startRenewalRequestBody,
  type StartRenewalBalanceField,
} from "./start-renewal-balances";

type StartRenewalBalanceFieldsProps = {
  openingBalance: string;
  closingBalance: string;
  onOpeningBalanceChange: (value: string) => void;
  onClosingBalanceChange: (value: string) => void;
  disabled?: boolean;
  showError?: boolean;
};

export const StartRenewalBalanceFields = ({
  openingBalance,
  closingBalance,
  onOpeningBalanceChange,
  onClosingBalanceChange,
  disabled,
  showError = false,
}: StartRenewalBalanceFieldsProps) => {
  const baseId = useId();
  const result = startRenewalRequestBody(openingBalance, closingBalance);
  const errorField: StartRenewalBalanceField | null =
    showError && !result.ok ? result.field : null;
  const errorMessage = showError && !result.ok ? result.message : null;

  return (
    <div className="grid gap-3">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${baseId}-opening`}>Opening balance</Label>
          <Input
            id={`${baseId}-opening`}
            type="number"
            step="any"
            inputMode="decimal"
            className="font-mono"
            value={openingBalance}
            disabled={disabled}
            aria-invalid={errorField === "openingBalance"}
            onChange={(e) => onOpeningBalanceChange(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${baseId}-closing`}>Closing balance</Label>
          <Input
            id={`${baseId}-closing`}
            type="number"
            step="any"
            inputMode="decimal"
            className="font-mono"
            value={closingBalance}
            disabled={disabled}
            aria-invalid={errorField === "closingBalance"}
            onChange={(e) => onClosingBalanceChange(e.target.value)}
          />
        </div>
      </div>
      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};
