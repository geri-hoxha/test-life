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
import { Customer, fullName } from "@/data/customers";

type CustomerComboboxProps = {
  customers: Customer[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
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
}: CustomerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = customers.find((c) => c.id === value);
  const filtered = customers.filter((c) => matchesCustomerSearch(c, search));

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
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={customerSearchValue(c)}
                  className="data-[selected=true]:bg-blue-50 data-[selected='true']:bg-blue-50 data-[selected=true]:text-foreground data-[selected='true']:text-foreground"
                  onSelect={() => {
                    onValueChange(c.id);
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
