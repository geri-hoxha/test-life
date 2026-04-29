import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Package, FileText, ArrowRight } from "lucide-react";

const items = [
  {
    icon: UserPlus,
    title: "New Customer",
    desc: "Start onboarding & KYC for an individual or business client.",
  },
  {
    icon: Package,
    title: "New Product",
    desc: "Configure coverage, pricing tables, and underwriting rules.",
  },
  {
    icon: FileText,
    title: "New Offer",
    desc: "Build a personalized quote based on an active product.",
  },
];

const QuickStart = () => {
  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Quick Start</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Common workflows to get going</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-5 flex flex-col">
            <div className="h-10 w-10 rounded-md bg-gradient-accent text-accent-foreground flex items-center justify-center shadow-elevated">
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 self-start text-accent hover:text-accent hover:bg-accent-soft -ml-3"
            >
              Start now <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default QuickStart;
