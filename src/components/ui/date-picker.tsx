import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DayPickerSingleProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  buttonClassName,
  buttonDisabled,
  defaultMonth,
  ...calendarProps
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={buttonDisabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            buttonClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
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
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
