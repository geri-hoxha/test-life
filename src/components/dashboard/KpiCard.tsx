import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  hint?: string;
  icon: LucideIcon;
};

const KpiCard = ({ label, value, delta, trend = "neutral", hint, icon: Icon }: Props) => {
  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow border-border">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="h-8 w-8 rounded-md bg-accent-soft text-accent flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold text-foreground tracking-tight">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={`inline-flex items-center gap-1 font-medium ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
};

export default KpiCard;
