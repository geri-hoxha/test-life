import { useState } from "react";
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
import { useGetPolicy, useListPolicies } from "@/api/policies";
import type { PoliciesPolicyListItemResponse, PoliciesPolicyResponse } from "@/api/types";
import { policyNumberLabel } from "@/pages/policies/policy-ui";

type PolicyComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const policyLabel = (
  policy: { serial?: number | null; id?: string | null; policyHolderName?: string | null },
) => {
  const number = policyNumberLabel(policy.serial, policy.id);
  const holder = policy.policyHolderName?.trim();
  return holder ? `${number} · ${holder}` : number;
};

const policyFromDetail = (
  policy?: PoliciesPolicyResponse | null,
): PoliciesPolicyListItemResponse | undefined => {
  if (!policy?.id) return undefined;
  const holder = policy.participants?.find((p) => p.role === "policyHolder");
  return {
    id: policy.id,
    serial: policy.serial,
    policyHolderName: holder?.displayName,
    productId: policy.productId,
    status: policy.status,
  };
};

const serialFromSearch = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const serial = Number(trimmed);
  return Number.isSafeInteger(serial) ? serial : undefined;
};

export const PolicyCombobox = ({
  value,
  onValueChange,
  placeholder = "Select policy…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All policies",
}: PolicyComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [serial, setSerial] = useState<number | undefined>();

  const handleSearchChange = (next: string) => {
    setSearch(next);
    setSerial(serialFromSearch(next));
  };

  const { data: policiesPage, isFetching } = useListPolicies(
    { pageNumber: 1, pageSize: 50, serial },
    { enabled: open && serial !== undefined },
  );
  const { data: selectedPolicy } = useGetPolicy(value, {
    enabled: Boolean(value),
  });

  const source = policiesPage?.items ?? [];
  const filtered =
    serial === undefined
      ? []
      : source.filter((policy) => String(policy.serial ?? "").startsWith(String(serial)));
  const selectedFromList = source.find((policy) => policy.id === value);
  const selected = selectedFromList ?? policyFromDetail(selectedPolicy);
  const listStatus =
    filtered.length > 0
      ? null
      : serial === undefined
        ? "Type a policy serial"
        : isFetching
          ? "Searching…"
          : "No policy found.";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setSerial(undefined);
        }
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
            {selected ? policyLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by serial…"
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {listStatus && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">{listStatus}</div>
            )}
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                    setSearch("");
                    setSerial(undefined);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">{clearLabel}</span>
                </CommandItem>
              )}
              {filtered.map((policy) => (
                <CommandItem
                  key={policy.id}
                  value={`${policy.serial ?? ""} ${policy.policyHolderName ?? ""} ${policy.id ?? ""}`}
                  onSelect={() => {
                    if (!policy.id) return;
                    onValueChange(allowClear && value === policy.id ? "" : policy.id);
                    setOpen(false);
                    setSearch("");
                    setSerial(undefined);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === policy.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate font-mono text-xs">{policyLabel(policy)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
