import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Info, TrendingUp } from "lucide-react";

const ACTIVITY_DATA = [
  { month: "Oct", offers: 12, policies: 8 },
  { month: "Nov", offers: 18, policies: 11 },
  { month: "Dec", offers: 15, policies: 14 },
  { month: "Jan", offers: 22, policies: 16 },
  { month: "Feb", offers: 19, policies: 13 },
  { month: "Mar", offers: 28, policies: 21 },
  { month: "Apr", offers: 24, policies: 19 },
  { month: "May", offers: 31, policies: 23 },
  { month: "Jun", offers: 27, policies: 22 },
  { month: "Jul", offers: 35, policies: 26 },
  { month: "Aug", offers: 29, policies: 24 },
  { month: "Sep", offers: 33, policies: 28 },
];

const chartConfig = {
  offers: { label: "Offers", color: "hsl(var(--accent))" },
  policies: { label: "Policies", color: "hsl(var(--success))" },
} satisfies ChartConfig;

const ActivityChart = () => {
  return (
    <Card className="shadow-card border-border overflow-hidden h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-md bg-accent-soft text-accent flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Activity</h3>
            <p className="text-xs text-muted-foreground">
              Offers and policies over the last 12 months
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200 text-xs border-b border-amber-400/30 shrink-0">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Sample data for presentation only — not live figures.
      </div>
      <div className="min-h-0 flex-1 px-2 pb-1 pt-2 sm:px-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-0 w-full">
          <AreaChart data={ACTIVITY_DATA} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillOffers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-offers)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-offers)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="fillPolicies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-policies)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-policies)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="offers"
              stroke="var(--color-offers)"
              fill="url(#fillOffers)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="policies"
              stroke="var(--color-policies)"
              fill="url(#fillPolicies)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default ActivityChart;
