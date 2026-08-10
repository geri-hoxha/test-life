import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BankAccountsBankAccountResponse } from "@/api/types";

type BankAccountComboboxBaseProps = {
  accounts: BankAccountsBankAccountResponse[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

type BankAccountComboboxSingleProps = BankAccountComboboxBaseProps & {
  multiple?: false;
  value: string;
  onValueChange: (id: string) => void;
};

type BankAccountComboboxMultipleProps = BankAccountComboboxBaseProps & {
  multiple: true;
  value: string[];
  onValueChange: (ids: string[]) => void;
};

export type BankAccountComboboxProps =
  | BankAccountComboboxSingleProps
  | BankAccountComboboxMultipleProps;

const accountLabel = (a: BankAccountsBankAccountResponse) =>
  [a.bankName, a.currency, a.iban || a.accountNumber].filter(Boolean).join(" · ") || a.id || "—";

const matchesAccountSearch = (a: BankAccountsBankAccountResponse, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [a.bankName, a.bankCode, a.accountNumber, a.iban, a.swiftCode, a.currency, a.id]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

export const BankAccountCombobox = (props: BankAccountComboboxProps) => {
  const {
    accounts,
    placeholder = "Select bank account…",
    className,
    disabled,
  } = props;
  const multiple = props.multiple === true;
  const selectedIds = multiple
    ? props.value
    : props.value
      ? [props.value]
      : [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedAccounts = accounts.filter((a) => a.id && selectedIds.includes(a.id));
  const filtered = accounts.filter((a) => matchesAccountSearch(a, search));

  const triggerLabel = () => {
    if (selectedAccounts.length === 0) return placeholder;
    if (!multiple) return accountLabel(selectedAccounts[0]);
    if (selectedAccounts.length === 1) return accountLabel(selectedAccounts[0]);
    return `${selectedAccounts.length} accounts selected`;
  };

  const toggleId = (id: string) => {
    if (multiple) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      props.onValueChange(next);
      return;
    }
    props.onValueChange(id);
    setOpen(false);
    setSearch("");
  };

  const clearSelection = () => {
    if (multiple) {
      props.onValueChange([]);
      return;
    }
    props.onValueChange("");
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            selectedAccounts.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate" title={selectedAccounts.map(accountLabel).join(", ")}>
            {triggerLabel()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search bank, IBAN, account…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No bank account found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={clearSelection}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    selectedIds.length === 0 ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="text-muted-foreground">{multiple ? "Clear all" : "None"}</span>
              </CommandItem>
              {filtered.map((a) => {
                const id = a.id ?? "";
                const selected = Boolean(id && selectedIds.includes(id));
                return (
                  <CommandItem
                    key={id}
                    value={[a.bankName, a.bankCode, a.iban, a.accountNumber, a.currency, id]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!id}
                    onSelect={() => {
                      if (!id) return;
                      toggleId(id);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{accountLabel(a)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
