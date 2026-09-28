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
import { useGetProduct, useListProducts } from "@/api/products";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type ProductComboboxOption = {
  id: string;
  name: string;
};

type ProductComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  /** Only list products of this product group. */
  productGroupId?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const toOption = (p: { id?: string | null; name?: string | null }): ProductComboboxOption | null => {
  const id = p.id?.trim() ?? "";
  if (!id) return null;
  return { id, name: p.name?.trim() || "—" };
};

/** Products are searched by name on the backend (debounced) once the field is opened. */
export const ProductCombobox = ({
  value,
  onValueChange,
  productGroupId,
  placeholder = "Select product",
  searchPlaceholder = "Search by product name…",
  emptyMessage = "No product found.",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All products",
}: ProductComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data: productsPage, isFetching } = useListProducts(
    compactQuery({ pageNumber: 1, pageSize: 50, name: debouncedSearch, productGroupId }),
    { enabled: open },
  );
  const { data: selectedProduct } = useGetProduct(value, { enabled: Boolean(value) });

  const options = useMemo(
    () =>
      (productsPage?.items ?? []).flatMap((p) => {
        // keepPreviousData can still hold another group's page while the new one loads.
        if (productGroupId && p.productGroupId !== productGroupId) return [];
        const option = toOption(p);
        return option ? [option] : [];
      }),
    [productGroupId, productsPage?.items],
  );
  const selected = options.find((p) => p.id === value) ?? toOption(selectedProduct ?? {}) ?? undefined;

  const isSearching = isFetching || search.trim() !== debouncedSearch;

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
            loading={isSearching && options.length > 0}
          />
          <CommandList>
            {options.length === 0 && (
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
              {options.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
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
