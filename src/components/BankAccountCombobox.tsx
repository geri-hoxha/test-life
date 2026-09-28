import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ComboboxStatus } from "@/components/Loader";
import {
  useGetBankAccounts,
  useListBankAccounts,
  type ListBankAccountsQuery,
} from "@/api/bank-accounts";
import type { BankAccountsBankAccountResponse } from "@/api/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 50;

type BankAccountSearchQueries = {
  primary: ListBankAccountsQuery;
  /** Second lookup so a 3-letter term matches a bank acronym ("BKT") or a currency ("EUR"). */
  byCurrency?: ListBankAccountsQuery;
};

/**
 * Maps a search term to list-endpoint filters:
 * - "AL47 2121…" (contains a digit) → IBAN
 * - "EUR" / "BKT" (three letters)   → bank name OR currency
 * - "Raiffeisen"                    → bank name
 */
const bankAccountSearchQueries = (term: string): BankAccountSearchQueries => {
  const page = { pageNumber: 1, pageSize: PAGE_SIZE };
  if (!term) return { primary: page };
  if (/\d/.test(term)) return { primary: { ...page, iban: term.replace(/\s+/g, "") } };

  const primary = { ...page, bankName: term };
  if (/^[a-z]{3}$/i.test(term)) {
    return { primary, byCurrency: { ...page, currency: term.toUpperCase() } };
  }
  return { primary };
};

type BankAccountComboboxBaseProps = {
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

/** Bank accounts are searched on the backend (debounced) once the field is opened. */
export const BankAccountCombobox = (props: BankAccountComboboxProps) => {
  const {
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
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const queries = useMemo(() => bankAccountSearchQueries(debouncedTerm), [debouncedTerm]);
  const byCurrencyEnabled = open && queries.byCurrency !== undefined;

  const primary = useListBankAccounts(queries.primary, { enabled: open });
  const byCurrency = useListBankAccounts(queries.byCurrency, { enabled: byCurrencyEnabled });

  const results = useMemo(() => {
    const first = primary.data?.items ?? [];
    // A disabled lookup can still expose keepPreviousData results from an earlier term.
    const second = byCurrencyEnabled ? (byCurrency.data?.items ?? []) : [];
    const seen = new Set(first.map((a) => a.id));
    return [...first, ...second.filter((a) => !seen.has(a.id))];
  }, [primary.data?.items, byCurrency.data?.items, byCurrencyEnabled]);
  const isSearching =
    term !== debouncedTerm || primary.isFetching || (byCurrencyEnabled && byCurrency.isFetching);

  // Selected ids are resolved by id so their labels don't depend on the current results.
  const selectedDetails = useGetBankAccounts(selectedIds);
  const selectedAccounts = selectedIds.flatMap((id, i) => {
    const account = results.find((a) => a.id === id) ?? selectedDetails[i]?.data;
    return account ? [account] : [];
  });

  const triggerLabel = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length > 1) return `${selectedIds.length} accounts selected`;
    return selectedAccounts[0] ? accountLabel(selectedAccounts[0]) : selectedIds[0];
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
            selectedIds.length === 0 && "text-muted-foreground",
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
            placeholder="Search by bank, IBAN or currency…"
            value={search}
            onValueChange={setSearch}
            loading={isSearching && results.length > 0}
          />
          <CommandList>
            {results.length === 0 && (
              <ComboboxStatus loading={isSearching}>No bank account found.</ComboboxStatus>
            )}
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
              {results.map((a) => {
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
