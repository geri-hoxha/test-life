import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterGridProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Responsive filter row. Adds a column at each breakpoint so every field stays
 * roughly 220–260px wide, whatever the screen size.
 */
export function FilterGrid({ children, className }: FilterGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
