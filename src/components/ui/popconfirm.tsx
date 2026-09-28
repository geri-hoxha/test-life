import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PopconfirmProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  side?: React.ComponentPropsWithoutRef<typeof PopoverContent>["side"];
  align?: React.ComponentPropsWithoutRef<typeof PopoverContent>["align"];
  onConfirm: () => void;
  /** The trigger element; must accept a ref (e.g. a Button). */
  children: React.ReactElement;
}

const Popconfirm = ({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  disabled = false,
  side = "bottom",
  align = "end",
  onConfirm,
  children,
}: PopconfirmProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(disabled ? false : next)}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-72 p-3">
        <div className="flex gap-2.5">
          <AlertTriangle
            className={cn(
              "h-4 w-4 mt-0.5 shrink-0",
              destructive ? "text-destructive" : "text-amber-500",
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-snug">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs"
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            className="h-7 px-2.5 text-xs"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { Popconfirm };
export type { PopconfirmProps };
