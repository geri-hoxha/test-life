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
import type { Offer } from "@/data/offers";

type OfferComboboxProps = {
  offers: Offer[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

const offerLabel = (o: Offer) => {
  const parts = [shortId(o.id), o.status, o.currency].filter(Boolean);
  return parts.join(" · ");
};

const matchesOfferSearch = (o: Offer, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [o.id, o.number, o.status, o.currency, o.productId]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

export const OfferCombobox = ({
  offers,
  value,
  onValueChange,
  placeholder = "Select offer…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All offers",
}: OfferComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = offers.find((o) => o.id === value);
  const filtered = offers.filter((o) => matchesOfferSearch(o, search));

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
          <span className="truncate font-mono text-xs">
            {selected ? offerLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search offers…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No offer found.</CommandEmpty>
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
              {filtered.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.id} ${o.number} ${o.status} ${o.currency}`}
                  onSelect={() => {
                    onValueChange(allowClear && value === o.id ? "" : o.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate font-mono text-xs">{offerLabel(o)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
