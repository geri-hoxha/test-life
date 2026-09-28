import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

type LoaderSize = "sm" | "md" | "lg";
type LoaderTone = "default" | "inverse";

/** Stroke widths are in viewBox units (50), tuned so each size renders a ~2–3px line. */
const sizeClass: Record<LoaderSize, { wrap: string; stroke: number; label: string }> = {
  sm: { wrap: "h-5 w-5", stroke: 5, label: "text-xs" },
  md: { wrap: "h-9 w-9", stroke: 3.5, label: "text-sm" },
  lg: { wrap: "h-12 w-12", stroke: 3, label: "text-sm" },
};

/** Indeterminate circular arc on a faint track: rotates while the arc grows and shrinks. */
function Arc({
  stroke,
  trackClassName = "stroke-accent/15",
  className,
}: {
  stroke: number;
  trackClassName?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 50 50" className={cn("animate-loader-orbit", className)} aria-hidden>
      <circle cx="25" cy="25" r="22" fill="none" strokeWidth={stroke} className={trackClassName} />
      <circle
        cx="25"
        cy="25"
        r="22"
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="40 200"
        className="stroke-accent animate-loader-dash"
      />
    </svg>
  );
}

/** Thin indeterminate progress bar; size and placement come from `className`. */
function IndeterminateBar({ className }: { className?: string }) {
  return (
    <span className={cn("block overflow-hidden rounded-full bg-accent/15", className)} aria-hidden>
      <span className="block h-full w-2/5 rounded-full bg-gradient-accent animate-loader-bar" />
    </span>
  );
}

type LoaderProps = {
  size?: LoaderSize;
  tone?: LoaderTone;
  label?: string;
  className?: string;
};

/** Brand spinner used while waiting on API responses. */
export function Loader({ size = "md", tone = "default", label, className }: LoaderProps) {
  const s = sizeClass[size];
  const inverse = tone === "inverse";

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Arc
        stroke={s.stroke}
        trackClassName={inverse ? "stroke-white/15" : undefined}
        className={s.wrap}
      />
      {label ? (
        <span
          className={cn(
            "text-center",
            s.label,
            inverse ? "text-topbar-muted" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/** Centered wait state for entity detail / full-page fetches. */
export function PageLoader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[40vh] items-center justify-center py-16", className)}>
      <Loader size="lg" label={label} />
    </div>
  );
}

/** Single table-body row shown while a list query is in flight. */
export function TableLoadingRow({
  colSpan,
  label = "Loading data, please wait…",
}: {
  colSpan: number;
  label?: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="relative py-12">
        <IndeterminateBar className="absolute inset-x-0 top-0 h-0.5 rounded-none" />
        <Loader size="md" label={label} />
      </TableCell>
    </TableRow>
  );
}

/** Status row inside a search dropdown: spinner while results load, otherwise the message. */
export function ComboboxStatus({
  loading,
  label = "Searching…",
  children,
}: {
  loading: boolean;
  label?: string;
  children?: ReactNode;
}) {
  if (loading) return <Loader size="sm" label={label} className="py-4" />;
  return <div className="px-2 py-3 text-center text-sm text-muted-foreground">{children}</div>;
}

/**
 * Branded wait state for app-level blocking loads: brand mark inside an orbiting arc,
 * status text, and an indeterminate progress bar.
 */
export function GlobalLoader({
  label,
  description,
  className,
}: {
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-5", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="relative inline-flex h-20 w-20 items-center justify-center" aria-hidden>
        <Arc stroke={2} className="absolute inset-0 h-full w-full" />
        <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gradient-accent shadow-elevated">
          <Shield className="h-6 w-6 text-accent-foreground" strokeWidth={2.5} />
          <span className="absolute inset-y-0 left-0 w-1/2 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent animate-loader-sheen" />
        </span>
      </span>
      <div className="space-y-1 text-center">
        <div className="text-sm font-semibold tracking-tight text-foreground">{label}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
      <IndeterminateBar className="h-1 w-44" />
    </div>
  );
}

/** Full-screen overlay for mutations and other blocking API waits. */
export function OverlayLoader({
  label,
  description = "Please wait…",
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="min-w-[16rem] rounded-xl border bg-card px-10 py-8 shadow-elevated animate-in fade-in-0 zoom-in-95 duration-200">
        <GlobalLoader label={label} description={description} />
      </div>
    </div>
  );
}
