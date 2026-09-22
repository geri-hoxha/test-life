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
import { useGetPartner, useListPartners } from "@/api/partners";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type PartnerComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const partnerLabel = (name?: string | null, id?: string) => name?.trim() || id || "—";

export const PartnerCombobox = ({
  value,
  onValueChange,
  placeholder = "Select partner…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All partners",
}: PartnerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  const { data: partnersPage, isFetching } = useListPartners(
    { pageNumber: 1, pageSize: 200 },
    { enabled: open },
  );
  const { data: selectedPartner } = useGetPartner(value, { enabled: Boolean(value) });

  const partners = useMemo(() => {
    const items = partnersPage?.items ?? [];
    if (!debouncedSearch) return items;
    return items.filter((p) => {
      const hay = `${p.name ?? ""} ${p.id ?? ""}`.toLowerCase();
      return hay.includes(debouncedSearch);
    });
  }, [partnersPage?.items, debouncedSearch]);

  const selectedFromList = partners.find((p) => p.id === value);
  const selected = selectedFromList ?? selectedPartner;
  const selectedLabel = selected ? partnerLabel(selected.name, selected.id) : null;

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
            placeholder="Search partners…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? "Searching…" : "No partner found."}</CommandEmpty>
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
              {partners.map((p) => {
                const id = p.id ?? "";
                if (!id) return null;
                return (
                  <CommandItem
                    key={id}
                    value={`${id} ${p.name ?? ""}`}
                    onSelect={() => {
                      onValueChange(allowClear && value === id ? "" : id);
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
                    <span className="truncate">{partnerLabel(p.name, id)}</span>
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
