import { useMemo, useState } from "react";
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
import { Customer, fullName } from "@/data/customers";
import { useGetPerson, useListPeople } from "@/api/people";
import { useGetCompany, useListCompanies } from "@/api/companies";
import { mapCompanyToCustomer, mapPersonToCustomer, mergeCustomers } from "@/api/adapters/customers";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type CustomerComboboxProps = {
  /** When omitted, people and companies are loaded when the field is opened. */
  customers?: Customer[];
  value: string;
  onValueChange: (id: string) => void;
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

const matchesCustomerSearch = (c: Customer, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;

  const fields =
    c.customerType === "Company"
      ? [c.companyName, c.nipt]
      : [c.firstName, c.lastName, c.personalId, c.dateOfBirth, formatBirthday(c.dateOfBirth)];

  return fields.some((field) => field?.toLowerCase().includes(q));
};

export const CustomerCombobox = ({
  customers,
  value,
  onValueChange,
  placeholder = "Select customer",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All parties",
}: CustomerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isRemote = customers === undefined;
  const debouncedSearch = useDebouncedValue(search.trim(), 500);

  const peopleQuery = useMemo(() => {
    const parts = debouncedSearch.split(/\s+/).filter(Boolean);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    return compactQuery({
      pageNumber: 1,
      pageSize: 50,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  }, [debouncedSearch]);

  const companiesQuery = useMemo(
    () =>
      compactQuery({
        pageNumber: 1,
        pageSize: 50,
        legalName: debouncedSearch || undefined,
      }),
    [debouncedSearch],
  );

  const { data: peoplePage, isFetching: peopleFetching } = useListPeople(peopleQuery, {
    enabled: isRemote && open,
  });
  const { data: companiesPage, isFetching: companiesFetching } = useListCompanies(companiesQuery, {
    enabled: isRemote && open,
  });
  const { data: selectedPerson } = useGetPerson(value, {
    enabled: isRemote && Boolean(value),
  });
  const { data: selectedCompany } = useGetCompany(value, {
    enabled: isRemote && Boolean(value) && !selectedPerson,
  });

  const remoteCustomers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [companiesPage?.items, peoplePage?.items],
  );
  const source = isRemote ? remoteCustomers : (customers ?? []);
  const filtered = useMemo(
    () => source.filter((c) => matchesCustomerSearch(c, search)),
    [search, source],
  );
  const selectedFromList = source.find((c) => c.id === value);
  const selectedMapped = selectedPerson
    ? mapPersonToCustomer(selectedPerson)
    : selectedCompany
      ? mapCompanyToCustomer(selectedCompany)
      : undefined;
  const selected = selectedFromList ?? (isRemote ? selectedMapped : undefined);
  const isFetching = peopleFetching || companiesFetching;

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
            placeholder="Search by personal ID, first or last name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isRemote && isFetching ? "Loading…" : "No customer found."}</CommandEmpty>
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
                    onValueChange(allowClear && value === c.id ? "" : c.id);
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
