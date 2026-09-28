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
import { Customer, fullName } from "@/data/customers";
import { useGetPerson } from "@/api/people";
import { useGetCompany } from "@/api/companies";
import { mapCompanyToCustomer, mapPersonToCustomer, mergeCustomers } from "@/api/adapters/customers";
import { usePartySearch } from "@/hooks/usePartySearch";

type CustomerComboboxProps = {
  /** When omitted, people and companies are searched on the backend (debounced). */
  customers?: Customer[];
  value: string;
  /** `customer` is the picked option; it is undefined when the value is cleared. */
  onValueChange: (id: string, customer?: Customer) => void;
  /** Remote mode: also search companies (default true). */
  includeCompanies?: boolean;
  /** Remote mode: query the backend only once the user types, instead of listing on open. */
  requireSearch?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const formatBirthday = (iso: string) => {
  if (!iso) return "";
  // Prefer a compact display; keep ISO if it isn't a plain date.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const customerOptionLabel = (c: Customer) => {
  if (c.customerType === "Company") {
    return [c.companyName || "—", c.nipt].filter(Boolean).join(", ");
  }

  return [
    `${c.firstName} ${c.lastName}`.trim() || "—",
    c.personalId,
    formatBirthday(c.dateOfBirth),
  ]
    .filter(Boolean)
    .join(", ");
};

const customerSearchValue = (c: Customer) =>
  [
    c.id,
    c.firstName,
    c.lastName,
    c.personalId,
    c.dateOfBirth,
    c.companyName,
    c.nipt,
  ]
    .filter(Boolean)
    .join(" ");

/** Every search word must match some field, so "Geri Hoxha" matches first + last name. */
const matchesCustomerSearch = (c: Customer, search: string) => {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const fields = (
    c.customerType === "Company"
      ? [c.companyName, c.nipt]
      : [c.firstName, c.lastName, c.personalId, c.dateOfBirth, formatBirthday(c.dateOfBirth)]
  ).map((field) => field?.toLowerCase() ?? "");

  return terms.every((term) => fields.some((field) => field.includes(term)));
};

export const CustomerCombobox = ({
  customers,
  value,
  onValueChange,
  includeCompanies = true,
  requireSearch = false,
  placeholder = "Select customer",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All parties",
}: CustomerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Last option picked here, so its label survives the result list being cleared.
  const [picked, setPicked] = useState<Customer>();
  const isRemote = customers === undefined;
  const remote = usePartySearch(search, {
    enabled: isRemote && open,
    includeCompanies,
    requireTerm: requireSearch,
  });

  const remoteCustomers = useMemo(
    () => mergeCustomers(remote.people, remote.companies),
    [remote.companies, remote.people],
  );
  const source = isRemote ? remoteCustomers : (customers ?? []);
  // Remote results are already filtered server-side by the debounced term; only
  // an in-memory `customers` list is filtered per keystroke.
  const filtered = useMemo(
    () =>
      isRemote
        ? remoteCustomers
        : (customers ?? []).filter((c) => matchesCustomerSearch(c, search)),
    [customers, isRemote, remoteCustomers, search],
  );
  const selectedFromList = source.find((c) => c.id === value);
  const selectedKnown = selectedFromList ?? (picked?.id === value ? picked : undefined);
  // Values set from outside (prefill, "same as", newly created) are resolved by id.
  const { data: selectedPerson } = useGetPerson(value, {
    enabled: isRemote && Boolean(value) && !selectedKnown,
  });
  const { data: selectedCompany } = useGetCompany(value, {
    enabled:
      isRemote && includeCompanies && Boolean(value) && !selectedKnown && !selectedPerson,
  });
  const selectedMapped = selectedPerson
    ? mapPersonToCustomer(selectedPerson)
    : selectedCompany
      ? mapCompanyToCustomer(selectedCompany)
      : undefined;
  const selected = selectedKnown ?? (isRemote ? selectedMapped : undefined);
  const awaitingTerm = isRemote && requireSearch && !search.trim();
  const isSearching = isRemote && remote.isSearching && !awaitingTerm;
  const emptyMessage = awaitingTerm ? "Start typing to search…" : "No customer found.";

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
            triggerClassName,
            className,
          )}
        >
          <span className="truncate">{selected ? fullName(selected) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={
              includeCompanies
                ? "Search by name, personal ID or NIPT…"
                : "Search by name or personal ID…"
            }
            value={search}
            onValueChange={setSearch}
            loading={isSearching && filtered.length > 0}
          />
          <CommandList>
            {filtered.length === 0 && (
              <ComboboxStatus loading={isSearching}>{emptyMessage}</ComboboxStatus>
            )}
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">{clearLabel}</span>
                </CommandItem>
              )}
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={customerSearchValue(c)}
                  onSelect={() => {
                    const next = allowClear && value === c.id ? undefined : c;
                    setPicked(next);
                    onValueChange(next?.id ?? "", next);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === c.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{customerOptionLabel(c)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
