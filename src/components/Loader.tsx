import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

type LoaderSize = "sm" | "md" | "lg";
type LoaderTone = "default" | "inverse";

const sizeClass: Record<
  LoaderSize,
  { wrap: string; ring: string; inner: string; core: string; label: string }
> = {
  sm: {
    wrap: "h-5 w-5",
    ring: "border-[1.5px]",
    inner: "inset-[3px]",
    core: "inset-[38%]",
    label: "text-xs",
  },
  md: {
    wrap: "h-9 w-9",
    ring: "border-2",
    inner: "inset-[5px]",
    core: "inset-[36%]",
    label: "text-sm",
  },
  lg: {
    wrap: "h-12 w-12",
    ring: "border-[2.5px]",
    inner: "inset-[7px]",
    core: "inset-[36%]",
    label: "text-sm",
  },
};

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
      <span className={cn("relative inline-flex", s.wrap)} aria-hidden>
        <span
          className={cn(
            "absolute inset-0 rounded-full border-transparent animate-loader-spin",
            inverse ? "border-t-accent border-r-white/40" : "border-t-accent border-r-accent/30",
            s.ring,
          )}
        />
        <span
          className={cn(
            "absolute rounded-full border-transparent animate-loader-spin-reverse",
            inverse
              ? "border-b-white/80 border-l-white/25"
              : "border-b-primary/80 border-l-primary/25",
            s.inner,
            s.ring,
          )}
        />
        <span
          className={cn(
            "absolute rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.45)] animate-loader-pulse",
            s.core,
          )}
        />
      </span>
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
      <TableCell colSpan={colSpan} className="py-12">
        <Loader size="md" label={label} />
      </TableCell>
    </TableRow>
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-w-[14rem] flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-elevated">
        <Loader size="lg" />
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
    </div>
  );
}
