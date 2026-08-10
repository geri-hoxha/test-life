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
import { useGetPerson, useListPeople } from "@/api/people";
import { mapPersonToCustomer } from "@/api/adapters/customers";
import { fullName } from "@/data/customers";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type PersonComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const optionLabel = (firstName: string, lastName: string, personalId?: string) => {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
  return personalId ? `${name}, ${personalId}` : name;
};

export const PersonCombobox = ({
  value,
  onValueChange,
  placeholder = "Select person…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All people",
}: PersonComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const { data: peoplePage, isFetching } = useListPeople(peopleQuery, {
    enabled: open || Boolean(value),
  });
  const { data: selectedPerson } = useGetPerson(value, { enabled: Boolean(value) });

  const people = useMemo(
    () => (peoplePage?.items ?? []).map(mapPersonToCustomer),
    [peoplePage?.items]
  );

  const selectedFromList = people.find((p) => p.id === value);
  const selectedMapped = selectedPerson ? mapPersonToCustomer(selectedPerson) : undefined;
  const selected = selectedFromList ?? selectedMapped;

  const selectedLabel = selected
    ? optionLabel(selected.firstName, selected.lastName, selected.personalId)
    : null;

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
            !value && "text-muted-foreground",
            triggerClassName,
            className,
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? "Searching…" : "No person found."}</CommandEmpty>
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
              {people.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.id} ${fullName(p)} ${p.personalId}`}
                  onSelect={() => {
                    onValueChange(allowClear && value === p.id ? "" : p.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {optionLabel(p.firstName, p.lastName, p.personalId)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
