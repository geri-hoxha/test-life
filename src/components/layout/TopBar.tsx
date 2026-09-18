import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Shield,
} from "lucide-react";
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
import QuickActions from "./QuickActions";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useListCurrencyRates } from "@/api/currency-rates";
import { clearSession } from "@/api/client";
import { LOGIN_PATH } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/Loader";

type NavLink = { label: string; to: string };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const isNavGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const navEntries: NavEntry[] = [
  { label: "Dashboard", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Offers", to: "/offers" },
  { label: "Policies", to: "/policies" },
  { label: "Invoices", to: "/invoices" },
  {
    label: "Clients",
    items: [
      { label: "People", to: "/people" },
      { label: "Companies", to: "/companies" },
      { label: "Risk list", to: "/risk-list" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Renewals", to: "/renewals" },
      { label: "Agents", to: "/agents" },
      { label: "Agent commissions", to: "/agent-commissions" },
      { label: "Partners", to: "/partners" },
      { label: "Partner commissions", to: "/partner-commissions" },
      { label: "Bank accounts", to: "/bank-accounts" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Rating tables", to: "/administration/rating-tables" },
      { label: "Currency rates", to: "/administration/currency-exchange" },
      { label: "Document types", to: "/administration/document-types" },
      { label: "Documents", to: "/administration/documents" },
    ],
  },
];

const isPathActive = (pathname: string, to: string) =>
  to === "/"
    ? pathname === "/"
    : pathname === to || pathname.startsWith(`${to}/`);

const navTriggerClass = (active: boolean) =>
  cn(
    "group relative flex h-11 cursor-pointer items-center gap-1 px-3.5 text-[13px] font-medium rounded-none transition-colors whitespace-nowrap outline-none",
    "data-[state=open]:text-topbar-foreground data-[state=open]:bg-topbar-hover",
    active
      ? "text-topbar-foreground bg-topbar-hover"
      : "text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-hover/60",
  );

const formatRate = (rate: number) =>
  rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

type FxRate = { currency: string; rate: number };

const pickFxRates = (
  items: { currency?: string; rateToAll?: number }[] | undefined,
): FxRate[] => {
  const byCurrency = Object.fromEntries(
    (items ?? [])
      .filter((r) => r.currency && typeof r.rateToAll === "number")
      .map((r) => [r.currency!.toUpperCase(), r.rateToAll as number]),
  );
  const preferred = ["EUR", "USD"];
  const rates: FxRate[] = [];
  for (const currency of preferred) {
    if (byCurrency[currency] != null) {
      rates.push({ currency, rate: byCurrency[currency] });
    }
  }
  if (rates.length === 0) {
    for (const currency of Object.keys(byCurrency).sort((a, b) =>
      a.localeCompare(b),
    )) {
      rates.push({ currency, rate: byCurrency[currency] });
    }
  }
  return rates;
};

const formatFetchedAt = (fetchedAtUtc?: string): string | null => {
  if (!fetchedAtUtc) return null;
  try {
    return format(parseISO(fetchedAtUtc), "d MMM HH:mm");
  } catch {
    return null;
  }
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const eurRates = useListCurrencyRates({
    currency: "EUR",
    latestOnly: true,
    pageNumber: 1,
    pageSize: 20,
  });
  const usdRates = useListCurrencyRates({
    currency: "USD",
    latestOnly: true,
    pageNumber: 1,
    pageSize: 20,
  });
  const rateItems = [
    ...(eurRates.data?.items ?? []),
    ...(usdRates.data?.items ?? []),
  ];
  const fxRates = pickFxRates(rateItems);
  const fetchedLabel = formatFetchedAt(
    rateItems.find((r) => r.fetchedAtUtc)?.fetchedAtUtc,
  );
  const ratesLoading = eurRates.isLoading || usdRates.isLoading;

  return (
    <header className="bg-gradient-topbar text-topbar-foreground border-b border-topbar-border sticky top-0 z-40 shadow-elevated">
      <div className="container flex items-center gap-4 h-16">
        <a href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="h-9 w-9 rounded-md bg-gradient-accent flex items-center justify-center shadow-elevated">
            <Shield
              className="h-5 w-5 text-accent-foreground"
              strokeWidth={2.5}
            />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[15px] tracking-tight">
              ESIG Life
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-topbar-muted">
              Demo
            </div>
          </div>
        </a>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-topbar-muted" />
          <Input
            placeholder="Search people, companies, policies, offers…"
            className="pl-9 h-9 bg-topbar-hover/60 border-topbar-border text-topbar-foreground placeholder:text-topbar-muted focus-visible:ring-accent focus-visible:ring-offset-0"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 rounded border border-topbar-border bg-topbar/80 px-1.5 py-0.5 text-[10px] font-mono text-topbar-muted">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <QuickActions />

          <Button
            variant="ghost"
            size="icon"
            className="text-topbar-foreground hover:bg-topbar-hover hover:text-topbar-foreground relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-topbar" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-2 gap-2 text-topbar-foreground hover:bg-topbar-hover hover:text-topbar-foreground"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    AK
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-medium">Erin Hoxha</div>
                  <div className="text-[10px] text-topbar-muted">
                    Underwriter
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-topbar-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Erin Hoxha</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    erin.h@esiglife.demo
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  clearSession();
                  queryClient.clear();
                  navigate(LOGIN_PATH, { replace: true });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="border-t border-topbar-border/60">
        <div className="container flex items-center gap-0.5 h-11 overflow-x-auto overflow-y-hidden">
          {navEntries.map((entry) => {
            if (!isNavGroup(entry)) {
              const active = isPathActive(location.pathname, entry.to);
              return (
                <Link
                  key={entry.label}
                  to={entry.to}
                  aria-current={active ? "page" : undefined}
                  className={navTriggerClass(active)}
                >
                  {entry.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            }

            const groupActive = entry.items.some((item) =>
              isPathActive(location.pathname, item.to),
            );
            return (
              <DropdownMenu key={entry.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={navTriggerClass(groupActive)}
                  >
                    {entry.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-data-[state=open]:rotate-180" />
                    {groupActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[220px]">
                  {entry.items.map((item) => {
                    const active = isPathActive(location.pathname, item.to);
                    return (
                      <DropdownMenuItem key={item.to} asChild>
                        <Link
                          to={item.to}
                          className={cn(active && "bg-accent-soft font-medium")}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          <Link
            to="/administration/currency-exchange"
            title="Latest rates to ALL"
            aria-label="Currency rates"
            className="ml-auto hidden h-11 shrink-0 items-center gap-4 whitespace-nowrap pl-6 text-topbar-muted transition-colors hover:text-topbar-foreground focus-visible:text-topbar-foreground focus-visible:outline-none lg:flex"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-topbar-muted/60">
              FX
            </span>
            {ratesLoading ? (
              <Loader size="sm" tone="inverse" className="gap-0" />
            ) : fxRates.length === 0 ? (
              <span className="text-[11px] text-topbar-muted/70">No rates</span>
            ) : (
              fxRates.map((item) => (
                <span
                  key={item.currency}
                  className="inline-flex items-baseline gap-1.5"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                    {item.currency}
                  </span>
                  <span className="font-mono text-[12px] font-medium tabular-nums tracking-tight text-topbar-foreground/90">
                    {formatRate(item.rate)}
                  </span>
                </span>
              ))
            )}
            {fetchedLabel && (
              <span
                className="text-[10px] tabular-nums text-topbar-muted/45"
                title="Currency rates fetchedAtUtc"
              >
                {fetchedLabel}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default TopBar;
