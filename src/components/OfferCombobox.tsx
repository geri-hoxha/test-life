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
import { useGetOffer, useListOffers } from "@/api/offers";
import type { OffersOfferListItemResponse, OffersOfferResponse } from "@/api/types";
import { offerListLabel, offerStatusLabel } from "@/pages/offers/offer-ui";

type OfferComboboxProps = {
  /** When omitted, options are loaded when the field is opened. */
  offers?: OffersOfferListItemResponse[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const matchesOfferSearch = (o: OffersOfferListItemResponse, search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [
    o.id,
    o.status,
    offerStatusLabel(o.status),
    o.currency,
    o.productId,
    o.productName,
    o.policyHolderName,
    o.insuredName,
    o.policyPlan,
    o.salesPartyName,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

const offerFromDetail = (offer?: OffersOfferResponse | null): OffersOfferListItemResponse | undefined => {
  if (!offer?.id) return undefined;
  const holder = offer.participants?.find((p) => p.role === "policyHolder");
  return {
    id: offer.id,
    status: offer.status,
    currency: offer.currency,
    productId: offer.productId,
    policyHolderName: holder?.displayName,
  };
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
  const isRemote = offers === undefined;

  const { data: offersPage, isFetching } = useListOffers(
    { pageNumber: 1, pageSize: 50 },
    { enabled: isRemote && open },
  );
  const { data: selectedOffer } = useGetOffer(value, {
    enabled: isRemote && Boolean(value),
  });

  const source = isRemote ? (offersPage?.items ?? []) : (offers ?? []);
  const filtered = useMemo(
    () => source.filter((o) => matchesOfferSearch(o, search)),
    [search, source],
  );
  const selectedFromList = source.find((o) => o.id === value);
  const selected = selectedFromList ?? (isRemote ? offerFromDetail(selectedOffer) : undefined);

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
            {selected ? offerListLabel(selected) : placeholder}
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
            <CommandEmpty>{isRemote && isFetching ? "Loading…" : "No offer found."}</CommandEmpty>
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
                  value={`${o.id} ${o.status} ${o.currency} ${o.policyHolderName ?? ""} ${o.insuredName ?? ""}`}
                  onSelect={() => {
                    if (!o.id) return;
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
                  <span className="truncate font-mono text-xs">{offerListLabel(o)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
