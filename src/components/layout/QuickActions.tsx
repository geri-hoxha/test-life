import { Plus, UserPlus, Package, FileText, ShieldCheck, CreditCard, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const actions = [
  { icon: UserPlus, title: "New Customer", desc: "Onboard an individual or business client", color: "bg-accent-soft text-accent" },
  { icon: Package, title: "Create Product", desc: "Define a new life-insurance product", color: "bg-accent-soft text-accent" },
  { icon: FileText, title: "New Offer", desc: "Build a quote based on a product", color: "bg-accent-soft text-accent" },
  { icon: ShieldCheck, title: "Issue Policy", desc: "Convert an accepted offer into a policy", color: "bg-accent-soft text-accent" },
  { icon: CreditCard, title: "Record Payment", desc: "Log a premium or one-off payment", color: "bg-accent-soft text-accent" },
  { icon: Globe2, title: "Manual FX Rate", desc: "Override today's exchange rate", color: "bg-accent-soft text-accent" },
];

const QuickActions = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-elevated">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[640px] p-0 border-border shadow-elevated"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/40">
          <div className="text-sm font-semibold text-foreground">Quick Actions</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Jump straight into the most common workflows
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {actions.map(({ icon: Icon, title, desc, color }) => (
            <button
              key={title}
              className="group flex items-start gap-3 p-3 rounded-md text-left transition-colors hover:bg-accent-soft/60 border border-transparent hover:border-accent/20"
            >
              <div className={`shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${color} group-hover:bg-accent group-hover:text-accent-foreground transition-colors`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickActions;
