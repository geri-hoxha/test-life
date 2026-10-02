import {
  ChevronDown,
  Settings,
  LogOut,
  User,
  Shield,
  LayoutDashboard,
  Package,
  FileText,
  ShieldCheck,
  RefreshCw,
  Receipt,
  Users,
  Building2,
  ShieldAlert,
  Wallet,
  Briefcase,
  Percent,
  Handshake,
  Landmark,
  Table2,
  ArrowLeftRight,
  FileType,
  Files,
  UserCog,
  ListChecks,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
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
import { useListCurrencyRates } from "@/api/currency-rates";
import { clearSession } from "@/api/client";
import { LOGIN_PATH, readDisplayUsername } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/Loader";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";

type NavLink = { label: string; to: string; icon: LucideIcon };
type NavGroup = { label: string; icon: LucideIcon; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const isNavGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const navEntries: NavEntry[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Products", to: "/products", icon: Package },
  { label: "Offers", to: "/offers", icon: FileText },
  { label: "Policies", to: "/policies", icon: ShieldCheck },
  { label: "Renewals", to: "/renewals", icon: RefreshCw },
  { label: "Invoices", to: "/invoices", icon: Receipt },
  {
    label: "Clients",
    icon: Users,
    items: [
      { label: "People", to: "/people", icon: User },
      { label: "Companies", to: "/companies", icon: Building2 },
      { label: "Risk list", to: "/risk-list", icon: ShieldAlert },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { label: "Agent commissions", to: "/agent-commissions", icon: Percent },
      { label: "Partner commissions", to: "/partner-commissions", icon: Percent },
      { label: "Bank accounts", to: "/bank-accounts", icon: Landmark },
    ],
  },
  {
    label: "Administration",
    icon: Settings,
    items: [
      { label: "Agents", to: "/agents", icon: Briefcase },
      { label: "Partners", to: "/partners", icon: Handshake },
      { label: "Rating tables", to: "/administration/rating-tables", icon: Table2 },
      { label: "Currency rates", to: "/administration/currency-exchange", icon: ArrowLeftRight },
      { label: "Document types", to: "/administration/document-types", icon: FileType },
      { label: "Documents", to: "/administration/documents", icon: Files },
      { label: "Policy plan types", to: "/administration/policy-plan-types", icon: ListChecks },
      { label: "Users", to: "/administration/users", icon: UserCog },
    ],
  },
];

const isPathActive = (pathname: string, to: string) =>
  to === "/"
    ? pathname === "/"
    : pathname === to || pathname.startsWith(`${to}/`);

const navTriggerClass = (active: boolean) =>
  cn(
    "group relative flex h-11 cursor-pointer items-center gap-1.5 px-3 text-[13px] font-medium rounded-none transition-colors whitespace-nowrap outline-none",
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

const initialsFromUsername = (username: string): string => {
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
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
  const fetchedAtUtc = rateItems.find((r) => r.fetchedAtUtc)?.fetchedAtUtc;
  const fetchedLabel = fetchedAtUtc ? formatDateTime(fetchedAtUtc) : null;
  const ratesLoading = eurRates.isLoading || usdRates.isLoading;
  const username = readDisplayUsername() ?? "User";
  const usernameInitials = initialsFromUsername(username);

  return (
    <header className="bg-gradient-topbar text-topbar-foreground border-b border-topbar-border sticky top-0 z-40 shadow-elevated">
      <div className="w-full px-6 flex items-center gap-4 h-16">
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

        <div className="flex items-center gap-2 ml-auto">
          <QuickActions />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-2 gap-2 text-topbar-foreground hover:bg-topbar-hover hover:text-topbar-foreground"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    {usernameInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-medium">{username}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-topbar-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Change password
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
          <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
          />
        </div>
      </div>

      <nav className="border-t border-topbar-border/60">
        <div className="w-full px-6 flex items-center gap-0.5 h-11 overflow-x-auto overflow-y-hidden">
          {navEntries.map((entry) => {
            const EntryIcon = entry.icon;
            if (!isNavGroup(entry)) {
              const active = isPathActive(location.pathname, entry.to);
              return (
                <Link
                  key={entry.label}
                  to={entry.to}
                  aria-current={active ? "page" : undefined}
                  className={navTriggerClass(active)}
                >
                  <EntryIcon
                    className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-80")}
                  />
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
                    <EntryIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        groupActive ? "opacity-100" : "opacity-80",
                      )}
                    />
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
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem key={item.to} asChild>
                        <Link
                          to={item.to}
                          className={cn("gap-2", active && "bg-accent-soft font-medium")}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                title="Rates fetched at"
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
