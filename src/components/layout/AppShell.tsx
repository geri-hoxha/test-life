import { ReactNode } from "react";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

const AppShell = ({
  children,
  fullHeight,
}: {
  children: ReactNode;
  fullHeight?: boolean;
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
            "container",
            fullHeight ? "flex h-full min-h-0 flex-col py-4" : "py-8",
          )}
        >
          {children}
        </div>
      </main>
      <footer className="border-t border-border bg-card shrink-0">
        <div
          className={cn(
            "container flex items-center justify-between text-xs text-muted-foreground",
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
