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

export type ProductComboboxOption = {
  id: string;
  name: string;
  code?: string;
};

type ProductComboboxProps = {
  products: ProductComboboxOption[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
};

const matchesProductSearch = (p: ProductComboboxOption, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [p.name, p.code, p.id]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

export const ProductCombobox = ({
  products,
  value,
  onValueChange,
  placeholder = "Select package",
  searchPlaceholder = "Search packages…",
  emptyMessage = "No package found.",
  className,
  triggerClassName,
  disabled,
}: ProductComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = products.find((p) => p.id === value);
  const filtered = products.filter((p) => matchesProductSearch(p, search));

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
          <span className="truncate">{selected ? selected.name : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filtered.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.code ?? ""} ${p.id}`}
                  onSelect={() => {
                    onValueChange(p.id);
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
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
