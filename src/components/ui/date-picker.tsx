import * as React from "react";
import { isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DayPickerSingleProps, Matcher } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDisplayDate, parseDateInput } from "@/components/ui/date-mask";

type CalendarSingleProps = Omit<
  DayPickerSingleProps,
  "mode" | "selected" | "onSelect" | "initialFocus" | "className"
>;

type DatePickerProps = CalendarSingleProps & {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  buttonDisabled?: boolean;
};

const isDateDisabled = (date: Date, disabled: Matcher | Matcher[] | undefined): boolean => {
  if (disabled == null) return false;
  const matchers = Array.isArray(disabled) ? disabled : [disabled];
  return matchers.some((m) => {
    if (typeof m === "boolean") return m;
    if (typeof m === "function") return m(date);
    if (m instanceof Date) return isSameDay(m, date);
    return false;
  });
};

function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className,
  buttonClassName,
  buttonDisabled,
  defaultMonth,
  disabled,
  ...calendarProps
}: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusedRef = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const valueKey = formatDisplayDate(value);
  const initialText = React.useState(valueKey)[0];

  const write = (next: string) => {
    const el = inputRef.current;
    if (el && el.value !== next) el.value = next;
  };

  React.useEffect(() => {
    if (focusedRef.current) return;
    write(valueKey);
  }, [valueKey]);

  const commit = () => {
    const raw = inputRef.current?.value ?? "";
    const trimmed = raw.trim();
    if (!trimmed) {
      if (valueKey) onChange(undefined);
      write("");
      return;
    }
    const parsed = parseDateInput(trimmed);
    if (!parsed || isDateDisabled(parsed, disabled)) {
      write(valueKey);
      return;
    }
    const display = formatDisplayDate(parsed);
    write(display);
    if (display !== valueKey) onChange(parsed);
  };

  return (
    <div className="flex w-full items-center gap-1">
      <Input
        ref={inputRef}
        // The browser owns the text while typing, so the caret stays on the digit you edit.
        disabled={buttonDisabled}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn("flex-1", buttonClassName)}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        aria-label={placeholder}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={buttonDisabled}
            className={cn("shrink-0 px-2", buttonClassName)}
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", className)} align="end">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={defaultMonth ?? value}
            onSelect={(date) => {
              focusedRef.current = false;
              write(formatDisplayDate(date));
              onChange(date);
              setOpen(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
            disabled={disabled}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DatePicker };
