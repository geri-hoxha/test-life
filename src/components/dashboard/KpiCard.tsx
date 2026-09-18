import { Link } from "react-router-dom";
import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/Loader";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
  to?: string;
};

const KpiCard = ({
  label,
  value,
  delta,
  trend = "neutral",
  hint,
  icon: Icon,
  loading,
  to,
}: Props) => {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  const card = (
    <Card
      className={cn(
        "p-4 shadow-card border-border h-full transition-all",
        to &&
          "hover:shadow-elevated hover:border-accent/40 group-hover:border-accent/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {to ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
          ) : null}
          <div className="h-8 w-8 rounded-md bg-accent-soft text-accent flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="mt-1.5 min-h-[1.75rem] flex items-center">
        {loading ? (
          <Loader size="sm" className="items-start" />
        ) : (
          <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">
            {value}
          </div>
        )}
      </div>
      {(delta || hint) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {delta && !loading && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${trendColor}`}
            >
              <TrendIcon className="h-3 w-3" />
              {delta}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );

  if (!to) return card;

  return (
    <Link
      to={to}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
};

export default KpiCard;
