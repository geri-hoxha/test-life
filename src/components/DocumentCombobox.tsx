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
import { useGetDocument, useListDocuments } from "@/api/documents";
import type { DocumentsDocumentResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type DocumentComboboxProps = {
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const documentLabel = (doc?: DocumentsDocumentResponse | null) =>
  doc?.originalFileName?.trim() || doc?.storedFileName?.trim() || doc?.id || "—";

export const DocumentCombobox = ({
  value,
  onValueChange,
  placeholder = "Select a document…",
  className,
  triggerClassName,
  disabled,
  allowClear = false,
  clearLabel = "No document",
}: DocumentComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const listQuery = useMemo(
    () =>
      compactQuery({
        pageNumber: 1,
        pageSize: 50,
        originalFileName: debouncedSearch || undefined,
        isDeleted: false,
      }),
    [debouncedSearch],
  );

  const { data: documentsPage, isFetching } = useListDocuments(listQuery, {
    enabled: open,
  });
  const { data: selectedDocument } = useGetDocument(value, { enabled: Boolean(value) });

  const documents = useMemo(
    () => (documentsPage?.items ?? []).filter((doc) => Boolean(doc.id)),
    [documentsPage?.items],
  );

  const selectedFromList = documents.find((doc) => doc.id === value);
  const selected = selectedFromList ?? selectedDocument;
  const selectedLabel = selected ? documentLabel(selected) : null;

  return (
    <Popover
      modal
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
      <PopoverContent className="z-[60] w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by file name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {documents.length === 0 && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {isFetching || search.trim() !== debouncedSearch
                  ? "Searching…"
                  : "No documents found."}
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
              {documents.map((doc) => {
                const id = doc.id ?? "";
                if (!id) return null;
                return (
                  <CommandItem
                    key={id}
                    value={`${id} ${documentLabel(doc)}`}
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
                    <span className="truncate" title={documentLabel(doc)}>
                      {documentLabel(doc)}
                    </span>
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
