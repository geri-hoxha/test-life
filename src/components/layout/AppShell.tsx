import { ReactNode } from "react";
import TopBar from "./TopBar";

const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 animate-fade-in">
        <div className="container py-8">{children}</div>
      </main>
      <footer className="border-t border-border bg-card">
        <div className="container py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 LifeERP Demo · Internal preview build</span>
          <span>v0.1.0 · Environment: Sandbox</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
