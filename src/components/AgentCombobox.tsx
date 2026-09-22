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
import { useGetAgent, useListAgents } from "@/api/agents";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type AgentComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const agentLabel = (name?: string | null, id?: string) => name?.trim() || id || "—";

export const AgentCombobox = ({
  value,
  onValueChange,
  placeholder = "Select agent…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "All agents",
}: AgentComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  const { data: agentsPage, isFetching } = useListAgents(
    { pageNumber: 1, pageSize: 200 },
    { enabled: open },
  );
  const { data: selectedAgent } = useGetAgent(value, { enabled: Boolean(value) });

  const agents = useMemo(() => {
    const items = agentsPage?.items ?? [];
    if (!debouncedSearch) return items;
    return items.filter((a) => {
      const hay = `${a.displayName ?? ""} ${a.id ?? ""}`.toLowerCase();
      return hay.includes(debouncedSearch);
    });
  }, [agentsPage?.items, debouncedSearch]);

  const selectedFromList = agents.find((a) => a.id === value);
  const selected = selectedFromList ?? selectedAgent;
  const selectedLabel = selected ? agentLabel(selected.displayName, selected.id) : null;

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
            placeholder="Search by agent name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {agents.length === 0 && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {isFetching || search.trim().toLowerCase() !== debouncedSearch
                  ? "Loading…"
                  : "No agent found."}
              </div>
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
              {agents.map((a) => {
                const id = a.id ?? "";
                if (!id) return null;
                return (
                  <CommandItem
                    key={id}
                    value={`${id} ${a.displayName ?? ""}`}
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
                    <span className="truncate">{agentLabel(a.displayName, id)}</span>
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
