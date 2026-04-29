import { Search, Bell, ChevronDown, Settings, LogOut, User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import QuickActions from "./QuickActions";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Customers", to: "/customers" },
  { label: "Offers", to: "/offers" },
  { label: "Policies", to: "/policies" },
  { label: "Payments", to: "/payments" },
  { label: "Reports", to: "/reports" },
  { label: "Administration", to: "/administration" },
];

const TopBar = () => {
  return (
    <header className="bg-gradient-topbar text-topbar-foreground border-b border-topbar-border sticky top-0 z-40 shadow-elevated">
      {/* Upper row: brand · search · quick actions · user */}
      <div className="container flex items-center gap-4 h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="h-9 w-9 rounded-md bg-gradient-accent flex items-center justify-center shadow-elevated">
            <Shield className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[15px] tracking-tight">LifeERP</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-topbar-muted">Demo</div>
          </div>
        </a>

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-topbar-muted" />
          <Input
            placeholder="Search customers, policies, offers…"
            className="pl-9 h-9 bg-topbar-hover/60 border-topbar-border text-topbar-foreground placeholder:text-topbar-muted focus-visible:ring-accent focus-visible:ring-offset-0"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 rounded border border-topbar-border bg-topbar/80 px-1.5 py-0.5 text-[10px] font-mono text-topbar-muted">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <QuickActions />

          <Button variant="ghost" size="icon" className="text-topbar-foreground hover:bg-topbar-hover hover:text-topbar-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-topbar" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 gap-2 text-topbar-foreground hover:bg-topbar-hover hover:text-topbar-foreground">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">AK</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-medium">Anna Kovač</div>
                  <div className="text-[10px] text-topbar-muted">Underwriter</div>
                </div>
                <ChevronDown className="h-4 w-4 text-topbar-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Anna Kovač</span>
                  <span className="text-xs text-muted-foreground font-normal">anna.k@lifeerp.demo</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Lower row: main nav */}
      <nav className="border-t border-topbar-border/60">
        <div className="container flex items-center gap-1 h-11 overflow-x-auto">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`relative px-3.5 py-2 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
                item.active
                  ? "text-topbar-foreground bg-topbar-hover"
                  : "text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-hover/60"
              }`}
            >
              {item.label}
              {item.active && (
                <span className="absolute -bottom-[10px] left-3 right-3 h-0.5 rounded-full bg-accent" />
              )}
            </a>
          ))}
          <div className="ml-auto hidden lg:flex items-center gap-2 text-[11px] text-topbar-muted">
            <Badge variant="outline" className="border-topbar-border text-topbar-muted bg-topbar-hover/40 font-normal">
              FX rate: EUR/USD 1.0842
            </Badge>
            <span>·</span>
            <span>Period: April 2026</span>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default TopBar;
