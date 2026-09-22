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
import { useGetProduct, useListProducts } from "@/api/products";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export type ProductComboboxOption = {
  id: string;
  name: string;
  code?: string;
};

type ProductComboboxProps = {
  /** When omitted, options are loaded when the field is opened. */
  products?: ProductComboboxOption[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const matchesProductSearch = (p: ProductComboboxOption, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [p.name, p.code, p.id]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

const toOption = (p: { id?: string | null; name?: string | null }): ProductComboboxOption | null => {
  const id = p.id?.trim() ?? "";
  if (!id) return null;
  return { id, name: p.name?.trim() || "—" };
};

export const ProductCombobox = ({
  products,
  value,
  onValueChange,
  placeholder = "Select package",
  searchPlaceholder,
  emptyMessage = "No package found.",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All products",
}: ProductComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isRemote = products === undefined;
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data: productsPage, isFetching } = useListProducts(
    { pageNumber: 1, pageSize: 50, name: debouncedSearch || undefined },
    { enabled: isRemote && open },
  );
  const { data: selectedProduct } = useGetProduct(value, {
    enabled: isRemote && Boolean(value),
  });

  const remoteOptions = useMemo(() => {
    if (!isRemote) return [];
    return (productsPage?.items ?? []).flatMap((p) => {
      const option = toOption(p);
      return option ? [option] : [];
    });
  }, [isRemote, productsPage?.items]);

  const localOptions = useMemo(() => {
    if (isRemote) return [];
    return (products ?? []).filter((p) => matchesProductSearch(p, search));
  }, [isRemote, products, search]);

  const options = isRemote ? remoteOptions : localOptions;
  const selectedFromList = options.find((p) => p.id === value);
  const selected =
    selectedFromList ??
    (!isRemote ? products?.find((p) => p.id === value) : toOption(selectedProduct ?? {})) ??
    undefined;

  const remoteStatus =
    isRemote && options.length === 0
      ? isFetching || search.trim() !== debouncedSearch
        ? "Loading…"
        : "No product found."
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
            placeholder={searchPlaceholder ?? (isRemote ? "Search by product name…" : "Search packages…")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {remoteStatus && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">{remoteStatus}</div>
            )}
            {!isRemote && <CommandEmpty>{emptyMessage}</CommandEmpty>}
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
              {options.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.code ?? ""} ${p.id}`}
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
