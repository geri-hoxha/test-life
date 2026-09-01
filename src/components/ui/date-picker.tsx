import * as React from "react";
import { format, isValid, parse, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DayPickerSingleProps, Matcher } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const DISPLAY_FORMAT = "dd/MM/yyyy";

const PARSE_FORMATS = [
  "dd/MM/yyyy",
  "d/M/yyyy",
  "dd-MM-yyyy",
  "d-M-yyyy",
  "dd.MM.yyyy",
  "d.M.yyyy",
  "yyyy-MM-dd",
  "yyyy/MM/dd",
];

const parseDateInput = (raw: string): Date | undefined => {
  const text = raw.trim();
  if (!text) return undefined;
  for (const fmt of PARSE_FORMATS) {
    const parsed = parse(text, fmt, new Date());
    if (isValid(parsed) && format(parsed, fmt) === text) {
      return parsed;
    }
  }
  // Accept loosely typed d/M/yyyy even when zero-padding does not match the format string.
  const loose = text.match(/^(\d{1,4})[/.\\-](\d{1,2})[/.\\-](\d{1,4})$/);
  if (loose) {
    const a = Number(loose[1]);
    const b = Number(loose[2]);
    const c = Number(loose[3]);
    let year: number;
    let month: number;
    let day: number;
    if (loose[1].length === 4) {
      year = a;
      month = b;
      day = c;
    } else if (loose[3].length === 4) {
      day = a;
      month = b;
      year = c;
    } else {
      return undefined;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return undefined;
    const date = new Date(year, month - 1, day);
    if (
      isValid(date) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }
  return undefined;
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
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => (value ? format(value, DISPLAY_FORMAT) : ""));

  React.useEffect(() => {
    setText(value ? format(value, DISPLAY_FORMAT) : "");
  }, [value]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange(undefined);
      setText("");
      return;
    }
    const parsed = parseDateInput(trimmed);
    if (!parsed || isDateDisabled(parsed, disabled)) {
      setText(value ? format(value, DISPLAY_FORMAT) : "");
      return;
    }
    onChange(parsed);
    setText(format(parsed, DISPLAY_FORMAT));
  };

  return (
    <div className="flex w-full items-center gap-1">
      <Input
        value={text}
        disabled={buttonDisabled}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        className={cn("flex-1", buttonClassName)}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const parsed = parseDateInput(next.trim());
          if (parsed && !isDateDisabled(parsed, disabled)) {
            onChange(parsed);
          }
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
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
