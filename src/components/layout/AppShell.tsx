import { ReactNode } from "react";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

/**
 * Max width of the page content. The top bar and footer always span the viewport.
 * - full:   lists, dashboards and data grids — use every pixel for columns (default)
 * - wide:   record detail pages and forms with a side column — capped at 1536px so
 *           label/value cards don't sprawl on large monitors
 * - narrow: single-column forms — capped at 1024px to keep labels close to fields
 */
export type AppShellWidth = "full" | "wide" | "narrow";

const widthClass: Record<AppShellWidth, string> = {
  full: "",
  wide: "max-w-screen-2xl",
  narrow: "max-w-5xl",
};

const AppShell = ({
  children,
  fullHeight,
  width = "full",
}: {
  children: ReactNode;
  fullHeight?: boolean;
  width?: AppShellWidth;
}) => {
  return (
    <div
      className={cn(
        "bg-background flex flex-col",
        fullHeight ? "h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      <TopBar />
      <main className={cn("flex-1 animate-fade-in", fullHeight && "min-h-0 overflow-hidden")}>
        <div
          className={cn(
            "mx-auto w-full px-6",
            widthClass[width],
            fullHeight ? "flex h-full min-h-0 flex-col py-4" : "py-8",
          )}
        >
          {children}
        </div>
      </main>
      <footer className="border-t border-border bg-card shrink-0">
        <div
          className={cn(
            "w-full px-6 flex items-center justify-between text-xs text-muted-foreground",
            fullHeight ? "py-2.5" : "py-4",
          )}
        >
          <span>© 2026 ESIG Life Demo · Internal preview build</span>
          <span>v0.1.0 · Environment: Sandbox</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
