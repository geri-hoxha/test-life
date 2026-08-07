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

type BankAccountComboboxProps = {
  accounts: BankAccountsBankAccountResponse[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const accountLabel = (a: BankAccountsBankAccountResponse) =>
  [a.bankName, a.currency, a.iban || a.accountNumber].filter(Boolean).join(" · ") || a.id || "—";

const matchesAccountSearch = (a: BankAccountsBankAccountResponse, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [a.bankName, a.bankCode, a.accountNumber, a.iban, a.swiftCode, a.currency, a.id]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

export const BankAccountCombobox = ({
  accounts,
  value,
  onValueChange,
  placeholder = "Select bank account…",
  className,
  disabled,
}: BankAccountComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = accounts.find((a) => a.id === value);
  const filtered = accounts.filter((a) => matchesAccountSearch(a, search));

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
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? accountLabel(selected) : placeholder}</span>
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
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")}
                />
                <span className="text-muted-foreground">None</span>
              </CommandItem>
              {filtered.map((a) => {
                const id = a.id ?? "";
                return (
                  <CommandItem
                    key={id}
                    value={[a.bankName, a.bankCode, a.iban, a.accountNumber, a.currency, id]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!id}
                    onSelect={() => {
                      onValueChange(id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === id ? "opacity-100" : "opacity-0",
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
