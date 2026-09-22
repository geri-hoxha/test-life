import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterGridProps = {
  children: ReactNode;
  className?: string;
};

export function FilterGrid({ children, className }: FilterGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {children}
    </div>
  );
}
